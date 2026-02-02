<template>
  <div class="designer-container">
    <!-- 顶部工具栏 -->
    <DesignerToolbar />
    
    <!-- 主内容区 -->
    <div class="designer-main">
      <!-- 左侧元素面板 -->
      <ElementsPanel />
      
      <!-- 中间画布区 -->
      <div class="canvas-area">
        <Canvas
          :width="canvasConfig.width"
          :height="canvasConfig.height"
          :dpi="canvasConfig.dpi"
          :backgroundColor="canvasConfig.backgroundColor"
          :gridEnabled="canvasConfig.gridEnabled"
          :gridSize="canvasConfig.gridSize"
        />
      </div>
      
      <!-- 右侧属性面板 -->
      <PropertiesPanel />
    </div>
    
    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-item">元素数: {{ elementCount }}</span>
        <span class="status-item">画布: {{ canvasSize }}</span>
        <span class="status-item">DPI: {{ canvasConfig.dpi }}</span>
      </div>
      <div class="status-right">
        <span class="status-item">坐标: ({{ mouseX }}mm, {{ mouseY }}mm)</span>
        <span class="status-item">缩放: {{ zoom }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useDesignerStore } from './stores/designer-store'

// 组件引入
import DesignerToolbar from './components/DesignerToolbar.vue'
import ElementsPanel from './components/ElementsPanel.vue'
import Canvas from './components/Canvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'

const store = useDesignerStore()

// 状态
const mouseX = ref(0)
const mouseY = ref(0)
const zoom = ref(100)

// 计算属性
const canvasConfig = computed(() => store.canvasConfig)
const elementCount = computed(() => store.elementCount)

const canvasSize = computed(() => {
  return `${canvasConfig.value.width}mm × ${canvasConfig.value.height}mm`
})

// 鼠标移动监听
const handleMouseMove = (event: MouseEvent) => {
  // TODO: 根据画布位置计算实际坐标
  mouseX.value = Math.round(event.clientX)
  mouseY.value = Math.round(event.clientY)
}

// 生命周期
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
@import './css/designer.scss';

.designer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.designer-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #f0f2f5;
}

.status-bar {
  height: 24px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  font-size: 12px;
  color: #666;
  
  .status-left, .status-right {
    display: flex;
    gap: 20px;
  }
  
  .status-item {
    display: inline-flex;
    align-items: center;
  }
}
</style>