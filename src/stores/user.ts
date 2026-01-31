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
    console.log('开始登录请求...', { username, password: '***' });
    try {
      const response = await login({ username, password })
      console.log('登录API响应:', response);
      
      // 检查响应结构
      if (!response || typeof response !== 'object') {
        console.error('服务器返回数据格式错误:', response);
        return { success: false, error: '服务器返回数据格式错误' };
      }
      
      const responseData = response;
      console.log('响应数据:', responseData);
      
      // 检查是否包含期望的字段
      if (responseData.code === 200 && responseData.data) {
        console.log('登录成功，准备设置用户信息');
        const { accessToken, userInfo } = responseData.data;
        console.log('获取到的accessToken:', accessToken ? '存在' : '不存在');
        console.log('获取到的userInfo:', userInfo);
        
        if (!accessToken || !userInfo) {
          console.error('登录响应缺少必要字段:', { accessToken: !!accessToken, userInfo: !!userInfo });
          return { success: false, error: '登录响应缺少必要字段' };
        }
        
        setUserInfo(accessToken, userInfo);
        console.log('用户信息已保存到store和localStorage');
        return { success: true, data: responseData.data }
      } else {
        console.warn('登录失败，服务器返回:', responseData);
        return { success: false, error: responseData.msg || '登录失败，请稍后再试' };
      }
    } catch (error: any) {
      console.error('登录请求发生异常:', error);
      return { 
        success: false, 
        error: error.msg || error.message || '登录失败，请稍后再试' 
      }
    }
  }
  
  // 注册方法
  const userRegister = async (
    username: string, 
    password: string, 
    nickname?: string
  ) => {
    console.log('开始注册请求...', { username, nickname });
    try {
      const response = await register({ username, password, nickname })
      console.log('注册API响应:', response);
      
      // 检查响应结构
      if (!response || typeof response !== 'object') {
        console.error('服务器返回数据格式错误:', response);
        return { success: false, error: '服务器返回数据格式错误' };
      }
      
      const responseData = response;
      console.log('注册响应数据:', responseData);
      
      // 对于注册，只需检查code是否为200即可，data可能为null
      if (responseData.code === 200) {
        console.log('注册成功');
        return { success: true }
      } else {
        console.warn('注册失败，服务器返回:', responseData);
        return { success: false, error: responseData.msg || '注册失败，请稍后再试' };
      }
    } catch (error: any) {
      console.error('注册请求发生异常:', error);
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