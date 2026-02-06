<template>
  <header class="topbar">
    <div class="left-section">
      <div class="page-title">
        <h2>{{ currentPageTitle }}</h2>
      </div>
    </div>
    
    <div class="right-section">
      <div class="user-actions">
        <button class="notification-btn" @click="toggleNotifications">
          <span class="icon">🔔</span>
          <span v-if="notificationCount > 0" class="badge">
            {{ notificationCount }}
          </span>
        </button>
        
        <div class="user-dropdown">
          <button class="user-menu-btn" @click="toggleUserMenu">
            <span class="username">{{ userStore.username }}</span>
            <span class="dropdown-icon">▼</span>
          </button>
          
          <div v-if="showUserMenu" class="dropdown-menu">
            <router-link to="/user-info" class="dropdown-item">
              <span class="icon">👤</span> 个人信息
            </router-link>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-btn" @click="handleLogout">
              <span class="icon">🚪</span> 退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showUserMenu = ref(false)
const notificationCount = ref(0)

// 获取当前页面标题
const currentPageTitle = computed(() => {
  const routeName = route.name as string
  const titles: Record<string, string> = {
    'Dashboard': '仪表盘',
    'Nothing': '功能页面',
    'UserInfo': '用户信息',
    'TemplateList': '模板设置',
    'LabelDesigner': '标签设计器'
  }
  return titles[routeName] || 'RFID标签设计系统'
})

// 切换用户菜单
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 切换通知
const toggleNotifications = () => {
  console.log('查看通知')
  // TODO: 实现通知功能
}

// 退出登录
const handleLogout = async () => {
  await userStore.userLogout()
  router.push('/login')
}

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-dropdown')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 模拟获取通知数量
  notificationCount.value = 3
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import './css/topbar.css';
</style>