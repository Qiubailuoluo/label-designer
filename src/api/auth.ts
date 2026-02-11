/**
 * 认证相关 API：注册、登录、登出
 */
import api from './index'
import type { ApiResponse } from './index'

/** 用户注册 */
export const register = (data: {
  username: string
  password: string
  nickname?: string
}): Promise<ApiResponse<RegisterData>> => {
  return api.post('/auth/register', data)
}

/** 用户登录，返回 accessToken 与 userInfo */
export const login = (data: {
  username: string
  password: string
}): Promise<ApiResponse<LoginData>> => {
  return api.post('/auth/login', data)
}

/** 用户登出 */
export const logout = (): Promise<ApiResponse> => {
  return api.post('/auth/logout')
}



/** 登录成功时 data 中的 accessToken 与 userInfo */
interface LoginData {
  accessToken: string
  userInfo: {
    username: string
    nickname: string
  }
}

/** 注册成功时 data 可为 null */
interface RegisterData {
  // 空接口，表示 data 为 null
}

