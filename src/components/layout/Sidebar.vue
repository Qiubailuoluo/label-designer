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

    <!-- 用户信息：仅名称可点击跳转；折叠时点击整块区域仅展开侧栏 -->
    <div
      class="user-info"
      :class="{ 'is-collapsed': collapsed }"
      @click="collapsed && $emit('toggle-collapse')"
    >
      <div class="avatar">
        {{ userInitials }}
      </div>
      <template v-if="!collapsed">
        <div class="user-details">
          <router-link to="/user-info" class="username-link" title="个人信息">
            {{ userStore.username }}
          </router-link>
          <p class="nickname">{{ userStore.nickname }}</p>
        </div>
      </template>
      <button
        v-if="collapsed"
        type="button"
        class="expand-btn"
        title="展开侧边栏"
        @click.stop="$emit('toggle-collapse')"
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

// 菜单项：模板设置 = 标签设计模块列表，创建/编辑进入设计器；连接打印 = 打印机连接与打印
// 用户信息页仅通过顶部「个人信息」或侧栏点击用户名进入，不在此菜单中
const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '仪表盘', icon: '🏠' },
  { path: '/label-designer', title: '模板设置', icon: '🏷️' },
  { path: '/connect-print', title: '连接打印', icon: '🖨️' },
  { path: '/nothing', title: '功能页面', icon: '📄' }
]
</script>

<style scoped>
@import './css/sidebar.css';
</style>