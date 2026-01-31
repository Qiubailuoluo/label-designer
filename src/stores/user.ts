import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, register } from '@/api/auth'

interface UserInfo {
  username: string
  nickname: string
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('accessToken'))
  const userInfo = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('userInfo') || 'null')
  )
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')
  const nickname = computed(() => userInfo.value?.nickname || '')
  
  // 方法
  const setUserInfo = (newToken: string, newUserInfo: UserInfo) => {
    token.value = newToken
    userInfo.value = newUserInfo
    localStorage.setItem('accessToken', newToken)
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo))
  }
  
  const clearUserInfo = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userInfo')
  }
  
  // 登录方法
  const userLogin = async (username: string, password: string) => {
    try {
      const response = await login({ username, password })
      const responseData = response.data
      
      if (responseData.code === 200 && responseData.data) {
        const { accessToken, userInfo } = responseData.data
        setUserInfo(accessToken, userInfo)
        return { success: true, data: responseData.data }
      }
      
      return { success: false, error: responseData.msg }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.msg || '登录失败，请稍后再试' 
      }
    }
  }
  
  // 注册方法
  const userRegister = async (
    username: string, 
    password: string, 
    nickname?: string
  ) => {
    try {
      const response = await register({ username, password, nickname })
      const responseData = response.data
      
      if (responseData.code === 200) {
        return { success: true }
      }
      
      return { success: false, error: responseData.msg }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.msg || '注册失败，请稍后再试' 
      }
    }
  }
  
  // 退出方法
  const userLogout = async () => {
    try {
      const response = await logout()
      // 处理登出响应（如果需要）
      console.log(response?.data)
    } finally {
      // 无论退出请求是否成功，都清除本地存储
      clearUserInfo()
    }
  }
  
  return {
    // 状态
    token,
    userInfo,
    
    // 计算属性
    isLoggedIn,
    username,
    nickname,
    
    // 方法
    userLogin,
    userRegister,
    userLogout,
    clearUserInfo
  }
})