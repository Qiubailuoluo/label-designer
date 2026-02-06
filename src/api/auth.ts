import api from './index'
import type { ApiResponse } from './index'

//***************请求参数类型-登录，注册***************

// 用户注册接口
export const register = (data: {
  username: string
  password: string
  nickname?: string
}): Promise<ApiResponse<RegisterData>> => {
  return api.post('/auth/register', data)
}

// 用户登录接口
export const login = (data: {
  username: string
  password: string
}): Promise<ApiResponse<LoginData>> => {
  return api.post('/auth/login', data)
}

// 用户退出接口
export const logout = (): Promise<ApiResponse> => {
  return api.post('/auth/logout')
}



//***************响应返回类型-登录，注册***************

// 登录接口的返回数据类型
interface LoginData {
  accessToken: string
  userInfo: {
    username: string
    nickname: string
  }
}

// 注册接口的返回数据类型（注册成功时data为null）
interface RegisterData {
  // 可以是空接口，表示data为null
}

