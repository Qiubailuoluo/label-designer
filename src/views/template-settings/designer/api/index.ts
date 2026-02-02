import axios from 'axios'
import type { ApiResponse } from './types'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // 后端API地址
  timeout: 30000, // 30秒超时
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