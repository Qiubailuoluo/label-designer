<template>
  <div class="dashboard">
    <div class="welcome-section">
      <h1>欢迎回来，{{ userStore.nickname }} 👋</h1>
      <p class="subtitle">开始设计您的RFID标签吧！</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>0</h3>
          <p>设计的标签</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-content">
          <h3>0</h3>
          <p>保存的模板</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🕒</div>
        <div class="stat-content">
          <h3>0</h3>
          <p>今日操作</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>1</h3>
          <p>活跃用户</p>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2>快速开始</h2>
      <div class="actions-grid">
        <button class="action-btn">
          <span class="icon">🆕</span>
          <span class="text">新建标签</span>
        </button>
        <button class="action-btn">
          <span class="icon">📂</span>
          <span class="text">打开模板</span>
        </button>
        <button class="action-btn">
          <span class="icon">🎨</span>
          <span class="text">设计工具</span>
        </button>
        <button class="action-btn">
          <span class="icon">📚</span>
          <span class="text">使用教程</span>
        </button>
      </div>
    </div>

    <div class="recent-activity">
      <h2>最近活动</h2>
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无最近活动记录</p>
        <button class="start-btn">开始设计</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style scoped>
@import './css/dashboard.css';
</style>