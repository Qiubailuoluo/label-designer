import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, register } from '@/api/auth'
import { ApiResponse } from '@/api'

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
  
  // 登录方法（修复后的版本）
  const userLogin = async (username: string, password: string) => {
    try {
      // 明确指定响应类型
      const response = await login({ username, password }) as ApiResponse<{
        accessToken: string
        userInfo: UserInfo
      }>
      
      console.log('登录API响应：', response)
      
      // 检查响应结构
      if (!response || typeof response !== 'object') {
        console.error('服务器返回数据格式错误：', response)
        return { success: false, error: '服务器返回数据格式错误' }
      }
      
      // 现在 TypeScript 能正确识别 response.code 和 response.data
      if (response.code === 200 && response.data) {
        console.log('登录成功，准备设置用户信息')
        const { accessToken, userInfo } = response.data
        console.log('获取到的accessToken：', accessToken ? '存在' : '不存在')
        console.log('获取到的userInfo：', userInfo)
        setUserInfo(accessToken, userInfo)
        return { success: true, data: response.data }
      }
      
      return { success: false, error: response.msg }
    } catch (error: any) {
      console.error('登录请求异常：', error)
      return { 
        success: false, 
        error: error.msg || error.message || '登录失败，请稍后再试' 
      }
    }
  }
  
  // 注册方法（修复后的版本）
  const userRegister = async (
    username: string, 
    password: string, 
    nickname?: string
  ) => {
    try {
      const response = await register({ username, password, nickname }) as ApiResponse
      
      if (response.code === 200) {
        return { success: true }
      }
      
      return { success: false, error: response.msg }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.msg || error.message || '注册失败，请稍后再试' 
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