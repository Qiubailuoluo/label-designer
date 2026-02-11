/**
 * 全局 API 实例：baseURL、超时、请求/响应拦截器
 * - 请求：自动附加 Authorization: Bearer <accessToken>
 * - 响应：505 表示 Token 过期，清除本地并跳转登录；其他错误统一 reject
 */
import axios from 'axios'

/** 统一业务响应格式（code/msg/data） */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T | null
}

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // 根据你的后端地址调整
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动添加Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response.data
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response
      
      // Token过期处理
      if (data.code === 505) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
      }
      
      return Promise.reject(data)
    }
    
    return Promise.reject({
      code: 500,
      msg: '网络错误，请检查网络连接',
      data: null
    })
  }
)

export default api