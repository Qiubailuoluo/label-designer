<template>
  <div class="designer-toolbar">
    <!-- 左侧：设计信息 -->
    <div class="toolbar-left">
      <div class="design-info">
        <input
          v-model="designName"
          type="text"
          class="design-name-input"
          placeholder="设计名称"
          @change="updateDesignName"
        />
        <span class="design-status" :class="{ 'has-changes': hasChanges }">
          {{ statusText }}
        </span>
      </div>
    </div>
    
    <!-- 中间：画布控制 -->
    <div class="toolbar-center">
      <!-- 画布尺寸 -->
      <div class="canvas-controls">
        <div class="control-group">
          <label class="control-label">宽度</label>
          <input
            v-model.number="canvasWidth"
            type="number"
            class="control-input"
            min="10"
            max="1000"
            @change="updateCanvasSize"
          />
          <span class="control-unit">mm</span>
        </div>
        
        <div class="control-group">
          <label class="control-label">高度</label>
          <input
            v-model.number="canvasHeight"
            type="number"
            class="control-input"
            min="10"
            max="1000"
            @change="updateCanvasSize"
          />
          <span class="control-unit">mm</span>
        </div>
        
        <div class="control-group">
          <label class="control-label">分辨率</label>
          <select
            v-model.number="dpi"
            class="control-select"
            @change="updateDpi"
          >
            <option value="72">72 DPI</option>
            <option value="150">150 DPI</option>
            <option value="300" selected>300 DPI</option>
            <option value="600">600 DPI</option>
          </select>
        </div>
      </div>
      
      <!-- 显示控制 -->
      <div class="display-controls">
        <button
          class="toolbar-btn"
          :class="{ active: gridEnabled }"
          @click="toggleGrid"
          title="显示/隐藏网格"
        >
          <span class="btn-icon">#</span>
          <span class="btn-text">网格</span>
        </button>
        
        <button
          class="toolbar-btn"
          @click="toggleRulers"
          title="显示/隐藏标尺"
        >
          <span class="btn-icon">📏</span>
          <span class="btn-text">标尺</span>
        </button>
        
        <button
          class="toolbar-btn"
          @click="clearCanvas"
          title="清空画布"
        >
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">清空</span>
        </button>
      </div>
    </div>
    
    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <div class="action-buttons">
        <button
          class="action-btn save-btn"
          :disabled="isSaving"
          @click="saveDesign"
        >
          <span v-if="isSaving" class="btn-icon">⏳</span>
          <span v-else class="btn-icon">💾</span>
          <span class="btn-text">{{ saveButtonText }}</span>
        </button>
        
        <button
          class="action-btn export-btn"
          @click="exportDesign"
        >
          <span class="btn-icon">📤</span>
          <span class="btn-text">导出</span>
        </button>
        
        <button
          class="action-btn preview-btn"
          @click="previewDesign"
        >
          <span class="btn-icon">👁️</span>
          <span class="btn-text">预览</span>
        </button>
        
        <div class="user-menu">
          <button class="user-btn" @click="toggleUserMenu">
            <span class="user-icon">👤</span>
            <span class="user-name">{{ userStore.nickname }}</span>
          </button>
          <div v-if="showUserMenu" class="user-dropdown">
            <router-link to="/user-info" class="dropdown-item">
              <span class="dropdown-icon">👤</span> 用户设置
            </router-link>
            <button class="dropdown-item" @click="logout">
              <span class="dropdown-icon">🚪</span> 退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useDesignerStore } from '../stores/designer-store'

const router = useRouter()
const userStore = useUserStore()
const store = useDesignerStore()

// 状态
const designName = ref('新标签设计')
const canvasWidth = ref(100)
const canvasHeight = ref(50)
const dpi = ref(300)
const gridEnabled = ref(true)
const showRulers = ref(true)
const showUserMenu = ref(false)
const isSaving = computed(() => store.isSaving)
const hasChanges = computed(() => store.hasChanges)

// 计算属性
const statusText = computed(() => {
  if (isSaving.value) return '保存中...'
  if (hasChanges.value) return '有未保存的更改'
  if (store.lastSavedAt) {
    const date = new Date(store.lastSavedAt)
    return `最后保存: ${date.toLocaleTimeString()}`
  }
  return '新设计'
})

const saveButtonText = computed(() => {
  if (isSaving.value) return '保存中...'
  return store.currentDesignId ? '保存' : '另存为'
})

// 方法
const updateDesignName = () => {
  store.updateCanvasConfig({ name: designName.value })
}

const updateCanvasSize = () => {
  store.updateCanvasConfig({ 
    width: canvasWidth.value,
    height: canvasHeight.value
  })
}

const updateDpi = () => {
  store.updateCanvasConfig({ dpi: dpi.value })
}

const toggleGrid = () => {
  gridEnabled.value = !gridEnabled.value
  store.updateCanvasConfig({ gridEnabled: gridEnabled.value })
}

const toggleRulers = () => {
  showRulers.value = !showRulers.value
  // TODO: 实现标尺显示/隐藏逻辑
}

const clearCanvas = () => {
  if (confirm('确定要清空画布吗？所有元素将被删除。')) {
    store.clearElements()
  }
}

const saveDesign = async () => {
  const result = await store.saveCurrentDesign()
  if (result.success) {
    // 显示保存成功提示
    console.log('保存成功:', result.id)
  } else {
    alert(`保存失败: ${result.error}`)
  }
}

const exportDesign = () => {
  // TODO: 打开导出对话框
  console.log('导出设计')
}

const previewDesign = () => {
  // TODO: 打开预览窗口
  console.log('预览设计')
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const logout = () => {
  userStore.userLogout()
  router.push('/login')
}

// 点击外部关闭用户菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

// 初始化
onMounted(() => {
  // 监听画布配置变化
  canvasWidth.value = store.canvasConfig.width
  canvasHeight.value = store.canvasConfig.height
  dpi.value = store.canvasConfig.dpi
  gridEnabled.value = store.canvasConfig.gridEnabled
  designName.value = store.canvasConfig.name
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import '../css/designer.scss';

.designer-toolbar {
  height: 60px;
  background: linear-gradient(to right, #1a2b6d, #0d1645);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.toolbar-left {
  flex: 1;
}

.design-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.design-name-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
}

.design-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  
  &.has-changes {
    color: #ff9800;
    font-weight: 500;
  }
}

.toolbar-center {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.canvas-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 6px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.control-input {
  width: 60px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 3px;
  font-size: 12px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }
}

.control-unit {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.control-select {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 3px;
  font-size: 12px;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  option {
    background: #1a2b6d;
    color: white;
  }
}

.display-controls {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: rgba(33, 150, 243, 0.3);
    border-color: rgba(33, 150, 243, 0.6);
  }
  
  .btn-icon {
    font-size: 14px;
  }
  
  .btn-text {
    font-weight: 500;
  }
}

.toolbar-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-icon {
    font-size: 14px;
  }
}

.save-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
}

.export-btn {
  background: linear-gradient(135deg, #007bff, #17a2b8);
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
}

.preview-btn {
  background: linear-gradient(135deg, #ff9800, #ffc107);
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .user-icon {
    font-size: 14px;
  }
  
  .user-name {
    font-size: 13px;
    font-weight: 500;
  }
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  min-width: 150px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  width: 100%;
  border: none;
  background: none;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
  
  &:hover {
    background: #f5f5f5;
  }
  
  .dropdown-icon {
    font-size: 14px;
    width: 20px;
  }
}
</style>