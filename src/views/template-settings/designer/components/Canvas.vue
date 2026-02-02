<template>
  <div class="canvas-container" ref="containerRef">
    <!-- 网格背景 -->
    <div 
      v-if="props.gridEnabled"
      class="grid-background"
      :style="gridStyle"
    ></div>
    
    <!-- 主画布 -->
    <canvas 
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="main-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @click="handleCanvasClick"
    ></canvas>
    
    <!-- 选中框 -->
    <div 
      v-if="selectedElement && selectionBox"
      class="selection-box"
      :style="selectionBoxStyle"
    >
      <!-- 控制点 -->
      <div 
        v-for="(point, index) in controlPoints"
        :key="index"
        class="control-point"
        :class="`control-point-${point.position}`"
        :style="point.style"
        @mousedown.stop="startResize($event, point.position)"
      ></div>
      
      <!-- 旋转控制点 -->
      <div 
        class="rotate-handle"
        :style="rotateHandleStyle"
        @mousedown.stop="startRotate"
      ></div>
    </div>
    
    <!-- 标尺 -->
    <div v-if="showRulers" class="rulers">
      <div class="ruler-horizontal">
        <div 
          v-for="tick in horizontalTicks"
          :key="tick.position"
          class="ruler-tick"
          :style="{ left: `${tick.position}px` }"
        >
          <span class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
      <div class="ruler-vertical">
        <div 
          v-for="tick in verticalTicks"
          :key="tick.position"
          class="ruler-tick"
          :style="{ top: `${tick.position}px` }"
        >
          <span class="tick-label">{{ tick.label }}</span>
        </div>
      </div>
    </div>
    
    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <button @click="zoomOut" title="缩小">-</button>
      <span>{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoomIn" title="放大">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as fabric from 'fabric'
import { useDesignerStore } from '../stores/designer-store'
import type { DesignElement } from '../types/elements'

const props = defineProps<{
  width: number
  height: number
  dpi: number
  backgroundColor: string
  gridEnabled: boolean
  gridSize: number
}>()

const emit = defineEmits<{
  'element-selected': [id: string | null]
  'element-moved': [id: string, x: number, y: number]
  'element-resized': [id: string, width: number, height: number]
  'element-rotated': [id: string, rotation: number]
}>()

const store = useDesignerStore()

// Refs
const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
let fabricCanvas: fabric.Canvas | null = null

// 状态
const zoom = ref(1)
const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const selectedElement = computed(() => store.selectedElement)

// 计算属性
const canvasWidth = computed(() => props.width * (props.dpi / 25.4))
const canvasHeight = computed(() => props.height * (props.dpi / 25.4))

const gridStyle = computed(() => ({
  backgroundImage: `
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
  `,
  backgroundSize: `${props.gridSize * (props.dpi / 25.4)}px ${props.gridSize * (props.dpi / 25.4)}px`,
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`
}))

const selectionBox = computed(() => {
  if (!selectedElement.value) return null
  
  return {
    x: selectedElement.value.x * (props.dpi / 25.4),
    y: selectedElement.value.y * (props.dpi / 25.4),
    width: selectedElement.value.width * (props.dpi / 25.4),
    height: selectedElement.value.height * (props.dpi / 25.4),
    rotation: selectedElement.value.rotation || 0
  }
})

const selectionBoxStyle = computed(() => {
  if (!selectionBox.value) return {}
  
  return {
    left: `${selectionBox.value.x}px`,
    top: `${selectionBox.value.y}px`,
    width: `${selectionBox.value.width}px`,
    height: `${selectionBox.value.height}px`,
    transform: `rotate(${selectionBox.value.rotation}deg)`,
    transformOrigin: 'center center'
  }
})

// 控制点
const controlPoints = computed(() => {
  if (!selectionBox.value) return []
  
  const points = [
    { position: 'nw', x: -4, y: -4 },
    { position: 'n', x: selectionBox.value.width / 2 - 4, y: -4 },
    { position: 'ne', x: selectionBox.value.width - 4, y: -4 },
    { position: 'e', x: selectionBox.value.width - 4, y: selectionBox.value.height / 2 - 4 },
    { position: 'se', x: selectionBox.value.width - 4, y: selectionBox.value.height - 4 },
    { position: 's', x: selectionBox.value.width / 2 - 4, y: selectionBox.value.height - 4 },
    { position: 'sw', x: -4, y: selectionBox.value.height - 4 },
    { position: 'w', x: -4, y: selectionBox.value.height / 2 - 4 }
  ]
  
  return points.map(point => ({
    ...point,
    style: {
      left: `${point.x}px`,
      top: `${point.y}px`
    }
  }))
})

const rotateHandleStyle = computed(() => {
  if (!selectionBox.value) return {}
  
  return {
    left: `${selectionBox.value.width / 2 - 4}px`,
    top: `-30px`
  }
})

// 标尺相关
const showRulers = ref(true)
const horizontalTicks = computed(() => {
  const ticks = []
  const tickInterval = 50 // 像素间隔
  const tickCount = Math.floor(canvasWidth.value / tickInterval)
  
  for (let i = 0; i <= tickCount; i++) {
    const position = i * tickInterval
    const mm = (position / (props.dpi / 25.4)).toFixed(1)
    ticks.push({
      position,
      label: i === 0 ? '0' : `${mm}mm`
    })
  }
  
  return ticks
})

const verticalTicks = computed(() => {
  const ticks = []
  const tickInterval = 50
  const tickCount = Math.floor(canvasHeight.value / tickInterval)
  
  for (let i = 0; i <= tickCount; i++) {
    const position = i * tickInterval
    const mm = (position / (props.dpi / 25.4)).toFixed(1)
    ticks.push({
      position,
      label: i === 0 ? '0' : `${mm}mm`
    })
  }
  
  return ticks
})

// 方法
const initCanvas = () => {
  if (!canvasRef.value) return
  
  fabricCanvas = new fabric.Canvas(canvasRef.value, {
    backgroundColor: props.backgroundColor,
    selection: false
  })
  
  // 禁用默认选择
  fabricCanvas.selection = false
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 3)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.1)
}

const handleMouseDown = (event: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  dragStartPos.value = { x, y }
  isDragging.value = true
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !selectedElement.value) return
  
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const deltaX = x - dragStartPos.value.x
  const deltaY = y - dragStartPos.value.y
  
  // 转换为mm
  const mmPerPixel = 25.4 / props.dpi
  const deltaXmm = deltaX * mmPerPixel
  const deltaYmm = deltaY * mmPerPixel
  
  store.moveElement(selectedElement.value.id, deltaXmm, deltaYmm)
  dragStartPos.value = { x, y }
}

const handleMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
}

const handleCanvasClick = () => {
  store.selectElement(null)
}

const startResize = (event: MouseEvent, position: string) => {
  event.preventDefault()
  isResizing.value = true
  // TODO: 实现调整大小逻辑
}

const startRotate = (event: MouseEvent) => {
  event.preventDefault()
  isRotating.value = true
  // TODO: 实现旋转逻辑
}

// 渲染元素到画布
const renderElements = () => {
  if (!fabricCanvas) return
  
  fabricCanvas.clear()
  
  store.elements.forEach(element => {
    let fabricObject: fabric.Object | null = null
    
    switch (element.type) {
      case 'text':
        fabricObject = new fabric.Text(element.content, {
          left: element.x * (props.dpi / 25.4),
          top: element.y * (props.dpi / 25.4),
          fontSize: element.fontSize * (props.dpi / 96), // 转换pt到像素
          fill: element.color,
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textAlign: element.textAlign
        })
        break
        
      case 'rectangle':
        fabricObject = new fabric.Rect({
          left: element.x * (props.dpi / 25.4),
          top: element.y * (props.dpi / 25.4),
          width: element.width * (props.dpi / 25.4),
          height: element.height * (props.dpi / 25.4),
          fill: element.fill,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          rx: element.cornerRadius,
          ry: element.cornerRadius
        })
        break
        
      // TODO: 添加其他元素类型的渲染
    }
    
    if (fabricObject) {
      if (fabricCanvas) {  // 再次确认fabricCanvas不为null
        fabricCanvas.add(fabricObject)
        
        // 点击选择
        fabricObject.on('mousedown', () => {
          store.selectElement(element.id)
        })
      }
    }
  })
}

// 监听状态变化
watch(() => store.elements, renderElements, { deep: true })
watch(() => props.backgroundColor, (color) => {
  if (fabricCanvas) {
    fabricCanvas.backgroundColor = color
    fabricCanvas.renderAll()
  }
})

// 生命周期
onMounted(() => {
  initCanvas()
  renderElements()
})

onUnmounted(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose()
  }
})
</script>

<style scoped>
@import '../css/canvas.scss';
</style>