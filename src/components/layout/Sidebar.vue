<template>
  <aside 
    class="sidebar" 
    :class="{ 'collapsed': collapsed }"
  >
    <!-- 系统Logo和名称 -->
    <div class="sidebar-header">
      <div class="logo">
        <span v-if="!collapsed" class="logo-text">RFID Designer</span>
        <span v-else class="logo-icon">R</span>
      </div>
      <button 
        v-if="!collapsed" 
        class="collapse-btn"
        @click="$emit('toggle-collapse')"
      >
        &lt;
      </button>
    </div>

    <!-- 用户信息 -->
    <div class="user-info">
      <div class="avatar">
        {{ userInitials }}
      </div>
      <div v-if="!collapsed" class="user-details">
        <p class="username">{{ userStore.username }}</p>
        <p class="nickname">{{ userStore.nickname }}</p>
      </div>
      <button 
        v-if="collapsed" 
        class="expand-btn"
        @click="$emit('toggle-collapse')"
      >
        &gt;
      </button>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in menuItems" :key="item.path">
          <router-link 
            :to="item.path" 
            class="nav-item"
            active-class="active"
            :title="item.title"
          >
            <span class="icon">{{ item.icon }}</span>
            <span v-if="!collapsed" class="text">{{ item.title }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- 底部信息 -->
    <div v-if="!collapsed" class="sidebar-footer">
      <p class="system-info">Version 1.0.0</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

interface MenuItem {
  path: string
  title: string
  icon: string
}

const props = defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  'toggle-collapse': []
}>()

const userStore = useUserStore()

// 用户名字首字母
const userInitials = computed(() => {
  const username = userStore.username
  return username ? username.charAt(0).toUpperCase() : 'U'
})

// 菜单项：模板设置 = 标签设计模块列表，创建/编辑进入设计器
const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '仪表盘', icon: '🏠' },
  { path: '/label-designer', title: '模板设置', icon: '🏷️' },
  { path: '/nothing', title: '功能页面', icon: '📄' },
  { path: '/user-info', title: '用户信息', icon: '👤' }
]
</script>

<style scoped>
@import './css/sidebar.css';
</style>