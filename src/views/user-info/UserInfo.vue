<template>
  <div class="user-info">
    <div class="page-header">
      <h1>用户信息</h1>
      <p class="description">查看和管理您的个人信息</p>
    </div>

    <div class="user-info-content">
      <div class="info-card">
        <div class="card-header">
          <h2>基本信息</h2>
          <button class="edit-btn">编辑</button>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <label>用户名</label>
            <div class="info-value">{{ userStore.username }}</div>
          </div>
          <div class="info-item">
            <label>昵称</label>
            <div class="info-value">{{ userStore.nickname }}</div>
          </div>
          <div class="info-item">
            <label>注册时间</label>
            <div class="info-value">--</div>
          </div>
          <div class="info-item">
            <label>最后登录</label>
            <div class="info-value">--</div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <h2>账户安全</h2>
        </div>
        
        <div class="security-items">
          <div class="security-item">
            <div class="security-info">
              <span class="security-icon">🔒</span>
              <div>
                <h3>密码</h3>
                <p>定期更改密码以保证账户安全</p>
              </div>
            </div>
            <button class="change-btn">修改密码</button>
          </div>
          
          <div class="security-item">
            <div class="security-info">
              <span class="security-icon">📧</span>
              <div>
                <h3>邮箱绑定</h3>
                <p>绑定邮箱用于找回密码</p>
              </div>
            </div>
            <button class="bind-btn" disabled>暂不可用</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style scoped>
@import './css/user-info.css';
</style>