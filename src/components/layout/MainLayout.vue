<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <Sidebar 
      :collapsed="sidebarCollapsed"
      @toggle-collapse="toggleSidebar"
    />
    
    <!-- 主内容区 -->
    <div 
      class="main-content"
      :class="{ 'collapsed': sidebarCollapsed }"
    >
      <!-- 顶部导航栏 -->
      <Topbar />
      
      <!-- 页面内容 -->
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'  // 引入侧边栏组件 工具链报错 可忽略
import Topbar from './Topbar.vue'

// 侧边栏折叠状态
const sidebarCollapsed = ref(false)

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 监听窗口大小变化，自动折叠侧边栏
const handleResize = () => {
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // 初始检查
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
@import './css/layout.css';
</style>