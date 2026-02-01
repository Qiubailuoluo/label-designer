<template>
  <div class="template-settings">
    <div class="page-header">
      <h1>模板设置</h1>
      <p class="description">管理您的标签模板和预设</p>
    </div>

    <div class="settings-content">
      <div class="settings-card">
        <div class="card-header">
          <h2>默认模板设置</h2>
          <button class="create-btn">创建新模板</button>
        </div>
        
        <div class="template-list">
          <div class="template-item" v-for="i in 3" :key="i">
            <div class="template-preview">
              <div class="preview-placeholder">
                <span>模板{{ i }}</span>
              </div>
            </div>
            <div class="template-info">
              <h3>默认标签模板 {{ i }}</h3>
              <p>尺寸：100mm × 50mm</p>
              <div class="template-actions">
                <button class="use-btn">使用</button>
                <button class="edit-btn">编辑</button>
                <button class="delete-btn">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="card-header">
          <h2>系统设置</h2>
        </div>
        
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <h3>自动保存</h3>
              <p>每隔5分钟自动保存工作进度</p>
            </div>
            <label class="switch">
              <input type="checkbox" checked>
              <span class="slider"></span>
            </label>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <h3>默认导出格式</h3>
              <p>选择标签导出的默认文件格式</p>
            </div>
            <select class="format-select">
              <option value="png">PNG图片</option>
              <option value="pdf">PDF文档</option>
              <option value="svg">SVG矢量图</option>
            </select>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <h3>默认标签尺寸</h3>
              <p>新建标签时的默认尺寸</p>
            </div>
            <div class="size-inputs">
              <input type="number" class="size-input" placeholder="宽" value="100">
              <span>×</span>
              <input type="number" class="size-input" placeholder="高" value="50">
              <span class="unit">mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 暂时不需要特殊的逻辑
</script>

<style scoped>
@import './css/template-settings.css';
</style>