<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="title">RFID标签设计系统</h2>
      <h3 class="subtitle">用户登录</h3>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            v-model="form.username"
            type="text"
            id="username"
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            v-model="form.password"
            type="password"
            id="password"
            placeholder="请输入密码"
            required
          />
        </div>
        
        <button 
          type="submit" 
          class="login-btn"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="links">
        <span>还没有账号？</span>
        <router-link to="/register" class="register-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  // 简单前端验证
  if (!form.username.trim() || !form.password.trim()) {
    errorMessage.value = '用户名和密码不能为空'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  const result = await userStore.userLogin(form.username, form.password)
  
  if (result.success) {
    // 登录成功，跳转到nothing页面
    router.push('/nothing')
  } else {
    errorMessage.value = result.error || '登录失败'
  }
  
  loading.value = false
}
</script>

<style scoped>
@import './css/login.css';
</style>