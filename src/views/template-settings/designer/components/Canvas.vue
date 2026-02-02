<template>
  <div class="canvas-wrapper">
    <div ref="containerRef" class="canvas-container">
      <canvas ref="canvasRef" class="main-canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as fabric from 'fabric'
import type { CanvasConfig, DesignElement } from '../types'
import { mmToPx, createFabricObject } from '../utils/fabric-helper'

interface Props {
  config: CanvasConfig
  elements: DesignElement[]
}

interface Emits {
  (e: 'element-select', elementId: string | null): void
  (e: 'element-update', elementId: string, updates: Partial<DesignElement>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
let fabricCanvas: fabric.Canvas | null = null

// 当前选中的元素ID
let selectedElementId: string | null = null

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
    selection: false, // 禁用fabric默认的选择框
    preserveObjectStacking: true
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

// 处理对象选中
const handleSelectionCreated = (e: any) => {
  if (e.selected && e.selected[0]) {
    const object = e.selected[0]
    selectedElementId = object.data?.id || null
    emit('element-select', selectedElementId)
  }
}

const handleSelectionUpdated = (e: any) => {
  if (e.selected && e.selected[0]) {
    const object = e.selected[0]
    selectedElementId = object.data?.id || null
    emit('element-select', selectedElementId)
  }
}

const handleSelectionCleared = () => {
  selectedElementId = null
  emit('element-select', null)
}

// 处理对象修改（位置、大小、旋转等变化）
const handleObjectModified = (e: any) => {
  const object = e.target
  if (!object || !object.data?.id) return
  
  const updates: Partial<DesignElement> = {}
  
  // 更新位置
  if (object.left !== undefined && object.top !== undefined) {
    updates.x = object.left / (props.config.dpi / 25.4)
    updates.y = object.top / (props.config.dpi / 25.4)
  }
  
  // 更新尺寸
  if (object.width && object.scaleX && object.height && object.scaleY) {
    updates.width = (object.width * object.scaleX) / (props.config.dpi / 25.4)
    updates.height = (object.height * object.scaleY) / (props.config.dpi / 25.4)
  }
  
  // 更新旋转
  if (object.angle !== undefined) {
    updates.rotation = object.angle
  }
  
  // 发送更新事件
  if (Object.keys(updates).length > 0) {
    emit('element-update', object.data.id, updates)
  }
}

// 渲染所有元素
const renderAllElements = () => {
  if (!fabricCanvas) return
  
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
  
  const fabricObject = createFabricObject(element, props.config.dpi)
  
  // 存储元素ID
  fabricObject.set('data', { id: element.id })
  
  // 设置旋转
  if (element.rotation) {
    fabricObject.set('angle', element.rotation)
  }
  
  // 设置透明度
  if (element.opacity !== undefined) {
    fabricObject.set('opacity', element.opacity)
  }
  
  fabricCanvas.add(fabricObject)
}

// 更新元素
const updateElementOnCanvas = (element: DesignElement) => {
  if (!fabricCanvas) return
  
  const objects = fabricCanvas.getObjects()
  const existingObject = objects.find((obj: fabric.Object) => (obj as any).data?.id === element.id)
  
  if (existingObject) {
    // 移除旧对象
    fabricCanvas.remove(existingObject)
  }
  
  // 添加新对象
  addElementToCanvas(element)
  fabricCanvas.renderAll()
}

// 移除元素
const removeElementFromCanvas = (elementId: string) => {
  if (!fabricCanvas) return
  
  const objects = fabricCanvas.getObjects()
  const objectToRemove = objects.find((obj: fabric.Object) => (obj as any).data?.id === elementId)
  
  if (objectToRemove) {
    fabricCanvas.remove(objectToRemove)
    fabricCanvas.renderAll()
  }
}

// 更新画布配置
const updateConfig = (config: CanvasConfig) => {
  if (!fabricCanvas || !containerRef.value) return
  
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
  fabricCanvas.backgroundColor = config.backgroundColor;
  fabricCanvas.renderAll();
  // 重新渲染所有元素
  renderAllElements()
}

// 添加元素（供父组件调用）
const addElement = (element: DesignElement) => {
  addElementToCanvas(element)
}

// 更新元素（供父组件调用）
const updateElement = (elementId: string, element: DesignElement) => {
  updateElementOnCanvas(element)
}

// 移除元素（供父组件调用）
const removeElement = (elementId: string) => {
  removeElementFromCanvas(elementId)
}

// 监听元素变化
watch(() => props.elements, () => {
  renderAllElements()
}, { deep: true })

// 监听配置变化
watch(() => props.config, (newConfig) => {
  updateConfig(newConfig)
}, { deep: true })

// 生命周期
onMounted(() => {
  initCanvas()
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
  removeElement
})
</script>

<style scoped>
@import '../css/canvas.scss';

.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: auto;
}

.canvas-container {
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}

.main-canvas {
  display: block;
}
</style>