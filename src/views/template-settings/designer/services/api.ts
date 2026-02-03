import type { TemplateSaveRequest } from './types.ts'

class ApiService {
  //private baseUrl = '/api'
  private baseUrl = 'http://localhost:8080/api'

  // 获取认证头
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  // 通用请求方法
  private async request(url: string, options: RequestInit = {}) {
    const defaultOptions: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options
    }

    try {
      const response = await fetch(url, defaultOptions)
      
      // 检查token过期
      if (response.status === 401 || response.status === 403) {
        // Token过期，清除本地存储并跳转到登录页
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
        throw new Error('认证失败，请重新登录')
      }
      
      return response
    } catch (error) {
      // 网络错误处理
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      throw error
    }
  }

  // 保存模板
  async saveTemplate(request: TemplateSaveRequest) {
    // 记录保存请求开始
    console.group('📤 模板保存请求')
    console.log('📋 请求数据:', request)
    console.log('🌐 请求地址:', `${this.baseUrl}/templates/save`)
    console.log('📅 请求时间:', new Date().toISOString())
    console.log('🔐 Token状态:', localStorage.getItem('accessToken') ? '已认证' : '未认证')
    
    try {
      const response = await this.request(`${this.baseUrl}/templates/save`, {
        method: 'POST',
        body: JSON.stringify(request)
      })

      console.log('📡 HTTP响应状态:', response.status)
      console.log('📄 响应头:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 保存失败:', response.statusText)
        console.error('📄 错误详情:', errorText)
        console.groupEnd()
        throw new Error(`保存失败: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('✅ 保存成功')
      console.log('📥 响应数据:', responseData)
      console.groupEnd()
      
      return responseData
    } catch (error) {
      console.error('💥 保存请求异常:', error)
      console.groupEnd()
      throw error
    }
  }

  // 加载模板
  async loadTemplate(templateId: string) {
    console.group('📥 模板加载请求')
    console.log('🆔 模板ID:', templateId)
    console.log('🌐 请求地址:', `${this.baseUrl}/templates/${templateId}`)
    console.log('📅 请求时间:', new Date().toISOString())
    console.log('🔐 Token状态:', localStorage.getItem('accessToken') ? '已认证' : '未认证')
    
    try {
      const response = await this.request(`${this.baseUrl}/templates/${templateId}`)

      console.log('📡 HTTP响应状态:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 加载失败:', response.statusText)
        console.error('📄 错误详情:', errorText)
        console.groupEnd()
        throw new Error(`加载失败: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('✅ 加载成功')
      console.log('📥 响应数据:', responseData)
      console.groupEnd()
      
      return responseData
    } catch (error) {
      console.error('💥 加载请求异常:', error)
      console.groupEnd()
      throw error
    }
  }

  // 删除模板
  async deleteTemplate(templateId: string) {
    console.group('🗑️ 模板删除请求')
    console.log('🆔 模板ID:', templateId)
    console.log('🌐 请求地址:', `${this.baseUrl}/templates/${templateId}`)
    console.log('📅 请求时间:', new Date().toISOString())
    console.log('🔐 Token状态:', localStorage.getItem('accessToken') ? '已认证' : '未认证')
    
    try {
      const response = await this.request(`${this.baseUrl}/templates/${templateId}`, {
        method: 'DELETE'
      })

      console.log('📡 HTTP响应状态:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 删除失败:', response.statusText)
        console.error('📄 错误详情:', errorText)
        console.groupEnd()
        throw new Error(`删除失败: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('✅ 删除成功')
      console.log('📥 响应数据:', responseData)
      console.groupEnd()
      
      return responseData
    } catch (error) {
      console.error('💥 删除请求异常:', error)
      console.groupEnd()
      throw error
    }
  }

  // 获取模板列表
  async getTemplateList(category?: string) {
    const url = category 
      ? `${this.baseUrl}/templates?category=${category}`
      : `${this.baseUrl}/templates`

    console.group('📋 模板列表请求')
    console.log('🏷️ 分类:', category || '全部')
    console.log('🌐 请求地址:', url)
    console.log('📅 请求时间:', new Date().toISOString())
    console.log('🔐 Token状态:', localStorage.getItem('accessToken') ? '已认证' : '未认证')
    
    try {
      const response = await this.request(url)

      console.log('📡 HTTP响应状态:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 获取列表失败:', response.statusText)
        console.error('📄 错误详情:', errorText)
        console.groupEnd()
        throw new Error(`获取列表失败: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('✅ 获取列表成功')
      console.log('📥 响应数据:', responseData)
      console.groupEnd()
      
      return responseData
    } catch (error) {
      console.error('💥 列表请求异常:', error)
      console.groupEnd()
      throw error
    }
  }
}

export const apiService = new ApiService()