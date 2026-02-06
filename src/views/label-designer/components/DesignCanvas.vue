<template>
  <div class="design-canvas-wrap">
    <div ref="containerRef" class="design-canvas-container">
      <canvas ref="canvasEl"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as fabric from 'fabric'
import type { CanvasConfig, DesignElement } from '../types'
import { mmToPx, pxToMm, createFabricObject, getUpdatesFromFabricObject, loadImageObject } from '../utils/fabric-canvas'

const props = defineProps<{
  config: CanvasConfig
  elements: DesignElement[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string | null]
  'element-update': [id: string, updates: Partial<DesignElement>]
  'canvas-click': [xMm: number, yMm: number]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
let fabricCanvas: fabric.Canvas | null = null
let isSyncing = false

function getCanvasSize() {
  const dpi = props.config.dpi || 300
  return {
    width: mmToPx(props.config.width, dpi),
    height: mmToPx(props.config.height, dpi),
  }
}

/** 将当前画布上所有对象的几何（位置/尺寸/旋转）写回 state，避免重画时用旧尺寸；不写内容以免覆盖右侧刚改的 */
function flushCanvasToState() {
  if (!fabricCanvas) return
  const dpi = props.config.dpi || 300
  const objs = fabricCanvas.getObjects()
  for (const obj of objs) {
    const id = obj.get('elementId') as string
    if (!id) continue
    const updates = getUpdatesFromFabricObject(obj, dpi, true)
    if (Object.keys(updates).length > 0) emit('element-update', id, updates)
  }
}

/** 仅当 elements 或 config 变化时：清空并按数据重新渲染，再恢复选中 */
function fullSyncToFabric() {
  if (!fabricCanvas || !containerRef.value) return
  isSyncing = true
  const dpi = props.config.dpi || 300
  const { width, height } = getCanvasSize()

  flushCanvasToState()

  fabricCanvas.setDimensions({ width, height })
  fabricCanvas.backgroundColor = props.config.backgroundColor
  fabricCanvas.clear()

  const sorted = [...props.elements].filter(e => e.visible !== false).sort((a, b) => a.zIndex - b.zIndex)
  for (const el of sorted) {
    const obj = createFabricObject(el, dpi)
    fabricCanvas.add(obj)
  }

  for (const el of sorted) {
    if (el.type === 'image' && (el as any).src) {
      const x = mmToPx(el.x, dpi)
      const y = mmToPx(el.y, dpi)
      const w = mmToPx(el.width, dpi)
      const h = mmToPx(el.height, dpi)
      loadImageObject((el as any).src, x, y, w, h, el.rotation ?? 0, dpi, el.id)
        .then((imgObj) => {
          if (!fabricCanvas) return
          const oldObj = fabricCanvas.getObjects().find((o: fabric.Object) => o.get('elementId') === el.id)
          if (oldObj) {
            fabricCanvas.remove(oldObj)
            fabricCanvas.add(imgObj)
            if (props.selectedId === el.id) fabricCanvas.setActiveObject(imgObj)
            fabricCanvas.requestRenderAll()
          }
        })
        .catch(() => {})
    }
  }

  const sel = props.selectedId
  if (sel) {
    const obj = fabricCanvas.getObjects().find((o: fabric.Object) => o.get('elementId') === sel)
    if (obj) fabricCanvas.setActiveObject(obj)
  } else {
    fabricCanvas.discardActiveObject()
  }

  fabricCanvas.requestRenderAll()
  setTimeout(() => { isSyncing = false }, 50)
}

/** 仅更新当前选中对象，不清空画布（保证拖拽/缩放可用） */
function updateSelectionOnly() {
  if (!fabricCanvas) return
  const sel = props.selectedId
  if (sel) {
    const obj = fabricCanvas.getObjects().find((o: fabric.Object) => o.get('elementId') === sel)
    if (obj) fabricCanvas.setActiveObject(obj)
  } else {
    fabricCanvas.discardActiveObject()
  }
  fabricCanvas.requestRenderAll()
}

function onSelectionChange() {
  if (isSyncing) return
  const active = fabricCanvas?.getActiveObject()
  const id = active && !(active instanceof fabric.ActiveSelection)
    ? (active.get('elementId') as string) ?? null
    : null
  emit('select', id)
}

function onObjectModified(e: { target?: fabric.Object }) {
  if (isSyncing || !e.target) return
  const obj = e.target
  const id = obj.get('elementId')
  if (!id) return
  const dpi = props.config.dpi || 300
  const updates = getUpdatesFromFabricObject(obj, dpi)
  if (Object.keys(updates).length > 0) emit('element-update', id, updates)
}

onMounted(() => {
  if (!canvasEl.value || !containerRef.value) return
  const { width, height } = getCanvasSize()
  fabricCanvas = new fabric.Canvas(canvasEl.value, {
    width,
    height,
    backgroundColor: props.config.backgroundColor,
    selection: true,
    preserveObjectStacking: true,
    stopContextMenu: true,
  })
  containerRef.value.style.width = `${width}px`
  containerRef.value.style.height = `${height}px`

  fabricCanvas.on('selection:created', onSelectionChange)
  fabricCanvas.on('selection:updated', onSelectionChange)
  fabricCanvas.on('selection:cleared', onSelectionChange)
  fabricCanvas.on('object:modified', onObjectModified)

  fabricCanvas.on('mouse:down', (e: any) => {
    if (isSyncing) return
    if (e.target) return
    const pointer = (fabricCanvas as any)?.getScenePoint?.(e.e) ?? (fabricCanvas as any)?.getPointer?.(e.e)
    if (!pointer || !fabricCanvas) return
    const px = typeof pointer.x === 'number' ? pointer.x : (pointer as any).x
    const py = typeof pointer.y === 'number' ? pointer.y : (pointer as any).y
    if (typeof px !== 'number' || typeof py !== 'number') return
    const dpi = props.config.dpi || 300
    emit('canvas-click', pxToMm(px, dpi), pxToMm(py, dpi))
    // 立即模拟 mouseup，避免 Fabric 进入「框选」状态导致一直拖出选择框
    const upper = (fabricCanvas as any).upperCanvasEl
    if (upper && e.e) {
      upper.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: e.e.view,
          clientX: e.e.clientX,
          clientY: e.e.clientY,
        })
      )
    }
  })

  fullSyncToFabric()
})

onUnmounted(() => {
  fabricCanvas?.dispose()
  fabricCanvas = null
})

/** 元素「内容/样式」签名，用于右侧改属性后触发重画；不含位置尺寸，避免拖拽触发 */
function contentSignature(el: DesignElement): string {
  const e = el as any
  switch (el.type) {
    case 'text':
      return JSON.stringify({ content: e.content, fontSize: e.fontSize, fontFamily: e.fontFamily, color: e.color, textAlign: e.textAlign, bold: e.bold, italic: e.italic })
    case 'rectangle':
      return JSON.stringify({ fill: e.fill, stroke: e.stroke, strokeWidth: e.strokeWidth, cornerRadius: e.cornerRadius })
    case 'line':
      return JSON.stringify({ stroke: e.stroke, strokeWidth: e.strokeWidth })
    case 'ellipse':
      return JSON.stringify({ fill: e.fill, stroke: e.stroke, strokeWidth: e.strokeWidth })
    case 'variable':
      return JSON.stringify({ label: e.label, sampleValue: e.sampleValue })
    case 'barcode':
      return JSON.stringify({ content: e.content, format: e.format })
    case 'image':
      return JSON.stringify({ src: (e.src || '').slice(0, 50) })
    default:
      return ''
  }
}

watch(
  () => ({
    w: props.config.width,
    h: props.config.height,
    dpi: props.config.dpi,
    bg: props.config.backgroundColor,
    len: props.elements.length,
    ids: props.elements.map(e => e.id).join(','),
    contentKey: props.elements.map(e => `${e.id}:${contentSignature(e)}`).join('|'),
  }),
  () => fullSyncToFabric(),
  { deep: true }
)
watch(
  () => props.selectedId,
  () => updateSelectionOnly(),
  { immediate: true }
)
</script>

<style scoped>
.design-canvas-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8ecf1;
}
.design-canvas-container {
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  background: #fff;
}
.design-canvas-container canvas {
  display: block;
}
</style>
