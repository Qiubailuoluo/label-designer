<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="title">RFID标签设计系统</h2>
      <h3 class="subtitle">用户注册</h3>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <form @submit.prevent="handleRegister" class="login-form">
        <div class="form-group">
          <label for="username">用户名 *</label>
          <input
            v-model="form.username"
            type="text"
            id="username"
            placeholder="请输入用户名"
            required
          />
          <div class="hint">用户名将用于登录，不可重复</div>
        </div>
        
        <div class="form-group">
          <label for="password">密码 *</label>
          <input
            v-model="form.password"
            type="password"
            id="password"
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input
            v-model="form.nickname"
            type="text"
            id="nickname"
            placeholder="请输入昵称（可选）"
          />
          <div class="hint">不填默认为"默认昵称"</div>
        </div>
        
        <button 
          type="submit" 
          class="login-btn"
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="links">
        <span>已有账号？</span>
        <router-link to="/login" class="register-link">立即登录</router-link>
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
const successMessage = ref('')

const form = reactive({
  username: '',
  password: '',
  nickname: ''
})

const handleRegister = async () => {
  // 前端验证
  if (!form.username.trim()) {
    errorMessage.value = '用户名不能为空'
    return
  }
  
  if (!form.password.trim()) {
    errorMessage.value = '密码不能为空'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  const result = await userStore.userRegister(
    form.username,
    form.password,
    form.nickname || undefined
  )
  
  if (result.success) {
    successMessage.value = '注册成功！正在跳转到登录页面...'
    
    // 2秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else {
    errorMessage.value = result.error || '注册失败'
  }
  
  loading.value = false
}
</script>

<style scoped>
@import './css/login.css';

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.hint {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>