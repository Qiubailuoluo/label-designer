import api from './index'

// 用户注册接口
export const register = (data: {
  username: string
  password: string
  nickname?: string
}) => {
  return api.post('/auth/register', data)
}

// 用户登录接口
export const login = (data: {
  username: string
  password: string
}) => {
  return api.post('/auth/login', data)
}

// 用户退出接口
export const logout = () => {
  return api.post('/auth/logout')
}