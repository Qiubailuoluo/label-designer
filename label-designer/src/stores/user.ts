
  // 登录方法
  const userLogin = async (username: string, password: string) => {
    try {
      console.log('开始执行登录请求...')
      const response = await login({ username, password })
      console.log('登录请求响应:', response)

      const responseData = response.data
      console.log('解析后的响应数据:', responseData)

      // 检查响应结构是否符合预期
      if (!responseData || typeof responseData !== 'object') {
        console.error('响应数据格式错误，不是有效的对象')
        return { success: false, error: '服务器返回数据格式错误' }
      }

      // 检查 code 字段是否存在且为 200
      if (responseData.code === 200 && responseData.data) {
        const { accessToken, userInfo } = responseData.data
        console.log('登录成功，获取到 token 和用户信息:', { accessToken, userInfo })

        if (!accessToken || !userInfo) {
          console.error('登录成功但缺少必要字段: accessToken 或 userInfo')
          return { success: false, error: '登录成功但返回数据不完整' }
        }

        setUserInfo(accessToken, userInfo)
        return { success: true, data: responseData.data }
      }

      // 处理非 200 状态的响应
      console.warn('登录失败，服务器返回 code:', responseData.code, 'msg:', responseData.msg)
      return { success: false, error: responseData.msg || '登录失败，请稍后再试' }
    } catch (error: any) {
      console.error('登录请求发生异常:', error)
      return { 
        success: false, 
        error: error.msg || '网络请求失败，请检查网络连接或稍后再试' 
      }
    }
  }
