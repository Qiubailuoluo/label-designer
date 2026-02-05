<template>
  <div class="canvas-wrapper">
    <div ref="containerRef" class="canvas-container">
      <canvas ref="canvasRef" class="main-canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as fabric from 'fabric'
import type { CanvasConfig, DesignElement } from '../types'
import { 
  mmToPx, 
  createFabricObject, 
  updateFabricObject, 
  getElementFromFabricObject 
} from '../utils/fabric-helper'

// 定义Props接口
interface Props {
  config: CanvasConfig
  elements: DesignElement[]
}

// 定义Emits接口
type Emits = {
  (e: 'element-select', elementId: string | null): void
  (e: 'element-update', elementId: string, updates: Partial<DesignElement>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let fabricCanvas: fabric.Canvas | null = null

// 当前选中的元素ID
let selectedElementId: string | null = null

// 元素ID到fabric对象的映射
const elementMap = new Map<string, fabric.Object>()

// 是否正在通过程序更新（避免循环更新）
let isProgrammaticUpdate = false

// 处理对象选中
const handleSelectionCreated = (e: any) => {
  if (e.selected && e.selected[0]) {
    const object = e.selected[0]
    selectedElementId = object.get('elementId') || null
    console.log('✅ 选中元素:', selectedElementId, '类型:', object.get('type'))
    emit('element-select', selectedElementId)
  }
}

const handleSelectionUpdated = (e: any) => {
  if (e.selected && e.selected[0]) {
    const object = e.selected[0]
    selectedElementId = object.get('elementId') || null
    console.log('🔄 更新选中元素:', selectedElementId, '类型:', object.get('type'))
    emit('element-select', selectedElementId)
  }
}

const handleSelectionCleared = () => {
  console.log('❌ 取消选择')
  selectedElementId = null
  emit('element-select', null)
}

// 处理对象修改（位置、大小、旋转等变化）
const handleObjectModified = (e: any) => {
  const object = e.target
  if (!object || !object.get('elementId') || isProgrammaticUpdate) return
  
  const elementId = object.get('elementId')
  
  // 从fabric对象获取更新后的数据
  const updates = getElementFromFabricObject(object, props.config.dpi)
  
  // 发送更新事件
  if (Object.keys(updates).length > 0) {
    emit('element-update', elementId, updates)
  }
}

// 渲染所有元素
const renderAllElements = () => {
  if (!fabricCanvas) return
  
  // 清空映射
  elementMap.clear()
  
  // 清空画布
  fabricCanvas.clear()
  
  // 按zIndex排序渲染
  const sortedElements = [...props.elements].sort((a, b) => a.zIndex - b.zIndex)
  
  sortedElements.forEach(element => {
    addElementToCanvas(element)
  })
  
  fabricCanvas.renderAll()
}

// 添加元素到画布
const addElementToCanvas = (element: DesignElement) => {
  if (!fabricCanvas) return
  
  // 检查元素是否已存在
  if (elementMap.has(element.id)) {
    console.warn(`⚠️ 元素 ${element.id} 已存在于画布中，跳过添加`)
    return
  }
  
  const fabricObject = createFabricObject(element, props.config.dpi)
  
  // 存储到映射
  elementMap.set(element.id, fabricObject)
  
  fabricCanvas.add(fabricObject)
  fabricCanvas.renderAll()
}

// 更新画布上的元素（不重新创建）
const updateElementOnCanvas = (element: DesignElement) => {
  if (!fabricCanvas) return
  
  // 标记为程序更新
  isProgrammaticUpdate = true
  
  const existingObject = elementMap.get(element.id)
  
  if (existingObject) {
    // 更新现有对象
    updateFabricObject(existingObject, element, props.config.dpi)
    
    // 如果这个元素当前被选中，保持选中状态
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject && activeObject.get('elementId') === element.id) {
      // 重新设置活动对象
      fabricCanvas.setActiveObject(existingObject)
    }
    
    fabricCanvas.requestRenderAll()
  } else {
    // 如果不存在，添加新对象
    addElementToCanvas(element)
  }
  
  // 重置标记
  setTimeout(() => {
    isProgrammaticUpdate = false
  }, 10)
}

// 移除元素的辅助函数
const removeElementFromCanvas = (elementId: string) => {
  const fabricObject = elementMap.get(elementId)
  if (fabricObject && fabricCanvas) {
    fabricCanvas.remove(fabricObject)
    elementMap.delete(elementId)
    
    // 如果删除的是当前选中的元素，清空选中状态
    if (selectedElementId === elementId) {
      selectedElementId = null
      emit('element-select', null)
    }
    
    fabricCanvas.requestRenderAll()
  }
}

// 清空画布所有元素
const clearCanvas = () => {
  if (fabricCanvas) {
    fabricCanvas.clear()
    elementMap.clear()
    selectedElementId = null
    emit('element-select', null)
    console.log('🧹 画布已清空')
  }
}

// 更新画布配置
const updateConfig = (config: CanvasConfig) => {
  if (!fabricCanvas || !containerRef.value) return
  
  // 标记为程序更新
  isProgrammaticUpdate = true
  
  // 更新画布尺寸
  const width = mmToPx(config.width, config.dpi)
  const height = mmToPx(config.height, config.dpi)
  
  fabricCanvas.setDimensions({ width, height })
  
  // 更新容器尺寸
  if (containerRef.value) {
    containerRef.value.style.width = `${width}px`
    containerRef.value.style.height = `${height}px`
  }
  
  // 更新背景色
  fabricCanvas.backgroundColor = config.backgroundColor
  fabricCanvas.renderAll()
  
  // 重新计算所有元素位置（因为DPI可能变化）
  elementMap.forEach((obj, elementId) => {
    const element = props.elements.find(e => e.id === elementId)
    if (element) {
      updateFabricObject(obj, element, config.dpi)
    }
  })
  
  fabricCanvas.renderAll()
  
  // 重置标记
  setTimeout(() => {
    isProgrammaticUpdate = false
  }, 10)
}

// 添加元素（供父组件调用）
const addElement = (element: DesignElement) => {
  addElementToCanvas(element)
}

// 更新元素（供父组件调用）
const updateElement = (element: DesignElement) => {
  updateElementOnCanvas(element)
}

// 删除元素（供父组件调用）
const removeElement = (elementId: string) => {
  removeElementFromCanvas(elementId)
}

// 初始化画布
const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return
  
  // 计算画布尺寸
  const width = mmToPx(props.config.width, props.config.dpi)
  const height = mmToPx(props.config.height, props.config.dpi)
  
  // 创建fabric画布
  fabricCanvas = new fabric.Canvas(canvasRef.value, {
    width,
    height,
    backgroundColor: props.config.backgroundColor,
    selection: true,
    preserveObjectStacking: true,
    renderOnAddRemove: true,
    stopContextMenu: true,
    fireRightClick: true
  })
  
  // 设置容器尺寸
  if (containerRef.value) {
    containerRef.value.style.width = `${width}px`
    containerRef.value.style.height = `${height}px`
  }
  
  // 监听对象选中事件
  fabricCanvas.on('selection:created', handleSelectionCreated)
  fabricCanvas.on('selection:updated', handleSelectionUpdated)
  fabricCanvas.on('selection:cleared', handleSelectionCleared)
  
  // 监听对象修改事件
  fabricCanvas.on('object:modified', handleObjectModified)
  
  // 渲染所有元素
  renderAllElements()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})

onUnmounted(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose()
  }
})

// 暴露方法给父组件
defineExpose({
  updateConfig,
  addElement,
  updateElement,
  removeElement,
  clearCanvas
})
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-container {
  position: relative;
  overflow: auto;
}

.main-canvas {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
}
</style>