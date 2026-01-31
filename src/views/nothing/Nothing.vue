<template>
  <div class="nothing-container">
    <header class="header">
      <div class="user-info">
        <span>欢迎，{{ nickname }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>
    
    <main class="content">
      <h1>🎉 登录成功！</h1>
      <p>这是临时页面，后续会添加具体的功能模块</p>
      <div class="info-box">
        <p><strong>用户名：</strong> {{ username }}</p>
        <p><strong>昵称：</strong> {{ nickname }}</p>
        <p><strong>Token：</strong> {{ tokenPreview }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 从store获取用户信息
const username = computed(() => userStore.username)
const nickname = computed(() => userStore.nickname)
const token = computed(() => userStore.token)

// Token预览（只显示前10位）
const tokenPreview = computed(() => {
  if (!token.value) return '无'
  return `${token.value.substring(0, 10)}...`
})

const handleLogout = async () => {
  await userStore.userLogout()
  router.push('/login')
}

// 页面加载时检查登录状态
onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
  }
})
</script>

<style scoped>
@import './css/nothing.css';
</style>