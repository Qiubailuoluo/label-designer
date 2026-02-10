<template>
  <div class="left-panel">
    <section class="panel-section layer-section">
      <h3 class="section-title">图层</h3>
      <div class="layer-list">
        <div
          v-for="(el, index) in layersByZIndex"
          :key="el.id"
          class="layer-item"
          :class="{ active: selectedId === el.id, 'is-dragging': draggedId === el.id, 'drag-over': dropTargetIndex === index && draggedId !== el.id }"
          draggable="true"
          @click="emit('select', el.id)"
          @dragstart="onLayerDragStart($event, el, index)"
          @dragend="onLayerDragEnd"
          @dragover.prevent="onLayerDragOver($event, index)"
          @drop.prevent="onLayerDrop($event, index)"
        >
          <span class="layer-drag-handle" title="拖动排序">⋮⋮</span>
          <span class="layer-icon">{{ typeIcon(el.type) }}</span>
          <span class="layer-name">{{ el.name }}</span>
          <div class="layer-actions" @mousedown.stop @click.stop>
            <button
              type="button"
              class="layer-move"
              title="上移一层"
              :disabled="index === 0"
              @click.stop="moveLayer(el, index, 'up')"
            >
              ▲
            </button>
            <button
              type="button"
              class="layer-move"
              title="下移一层"
              :disabled="index === layersByZIndex.length - 1"
              @click.stop="moveLayer(el, index, 'down')"
            >
              ▼
            </button>
            <button
              type="button"
              class="layer-visibility"
              :class="{ 'is-hidden': !el.visible }"
              :title="el.visible ? '隐藏' : '显示'"
              @click.stop="toggleVisible(el)"
            >
              👁
            </button>
          </div>
        </div>
        <p v-if="!elements.length" class="layer-empty">暂无元素，从下方添加</p>
      </div>
    </section>

    <section class="panel-section">
      <h3 class="section-title">基本元素</h3>
      <div class="tool-grid">
        <button
          v-for="t in layoutTools"
          :key="t.type"
          class="tool-btn"
          :title="t.name"
          @click="addElement(t.type, t.defaults)"
        >
          <span class="tool-icon">{{ t.icon }}</span>
          <span class="tool-name">{{ t.name }}</span>
        </button>
      </div>
    </section>

    <section class="panel-section">
      <h3 class="section-title">RFID 标签</h3>
      <div class="variable-list">
        <button
          v-for="v in rfidVariables"
          :key="v.dataField"
          class="variable-btn"
          @click="addRfidVariable(v)"
        >
          <span class="variable-icon">📌</span>
          {{ v.label }}
        </button>
      </div>
    </section>

    <section class="panel-section">
      <h3 class="section-title">变量</h3>
      <p class="section-hint">用户创建的变量，用于绑定 Excel 列</p>
      <div class="variable-list">
        <button
          v-for="name in customVariableNames"
          :key="name"
          class="variable-btn"
          @click="addCustomVariableElement(name)"
        >
          <span class="variable-icon">📌</span>
          {{ name }}
        </button>
        <button type="button" class="add-variable-btn" @click="onAddCustomVariableClick">
          + 添加变量
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DesignElement, ElementType } from '../types'

const draggedId = ref<string | null>(null)
const draggedIndex = ref<number>(0)
const dropTargetIndex = ref<number | null>(null)

const props = defineProps<{
  elements: DesignElement[]
  selectedId: string | null
  customVariableNames: string[]
}>()

const emit = defineEmits<{
  'add-element': [element: Omit<DesignElement, 'id'>]
  'add-custom-variable': [name?: string]
  'select': [id: string | null]
  'element-update': [payload: { id: string; updates: Partial<DesignElement> }]
}>()

/** 按 zIndex 降序（最上层在前） */
const layersByZIndex = computed(() => {
  return [...props.elements].sort((a, b) => b.zIndex - a.zIndex)
})

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    text: 'T',
    rectangle: '▢',
    line: '—',
    ellipse: '○',
    barcode: '▌',
    image: '🖼',
    variable: '📌',
  }
  return map[type] ?? '?'
}

function toggleVisible(el: DesignElement) {
  emit('element-update', { id: el.id, updates: { visible: !el.visible } })
}

/** 上移/下移图层：调整 zIndex 使顺序改变 */
function moveLayer(el: DesignElement, currentIndex: number, direction: 'up' | 'down') {
  const list = layersByZIndex.value
  if (direction === 'up') {
    if (currentIndex <= 0) return
    const above = list[currentIndex - 1]
    emit('element-update', { id: el.id, updates: { zIndex: above.zIndex + 1 } })
  } else {
    if (currentIndex >= list.length - 1) return
    const below = list[currentIndex + 1]
    emit('element-update', { id: el.id, updates: { zIndex: Math.max(0, below.zIndex - 1) } })
  }
}

/** 拖动开始 */
function onLayerDragStart(e: DragEvent, el: DesignElement, index: number) {
  draggedId.value = el.id
  draggedIndex.value = index
  dropTargetIndex.value = null
  e.dataTransfer?.setData('text/plain', el.id)
  e.dataTransfer!.effectAllowed = 'move'
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

/** 拖动结束 */
function onLayerDragEnd() {
  draggedId.value = null
  dropTargetIndex.value = null
}

/** 拖动经过 */
function onLayerDragOver(_e: DragEvent, index: number) {
  if (draggedId.value === null) return
  dropTargetIndex.value = index
}

/** 放置：重排顺序并批量更新 zIndex */
function onLayerDrop(_e: DragEvent, dropIndex: number) {
  if (draggedId.value === null) return
  const list = layersByZIndex.value
  const dragIdx = list.findIndex((item) => item.id === draggedId.value)
  if (dragIdx < 0 || dragIdx === dropIndex) {
    onLayerDragEnd()
    return
  }
  const reordered = [...list]
  const [removed] = reordered.splice(dragIdx, 1)
  reordered.splice(dropIndex, 0, removed)
  const n = reordered.length
  for (let i = 0; i < n; i++) {
    const newZ = n - 1 - i
    if (reordered[i].zIndex !== newZ) {
      emit('element-update', { id: reordered[i].id, updates: { zIndex: newZ } })
    }
  }
  onLayerDragEnd()
}

const layoutTools: { type: ElementType; name: string; icon: string; defaults: Record<string, unknown> }[] = [
  { type: 'text', name: '文本', icon: 'T', defaults: { name: '文本', content: '双击编辑', fontSize: 12, fontFamily: 'ZEBRA 0', color: '#000000', textAlign: 'left', bold: false, italic: false, fill: '', stroke: '', strokeWidth: 0, cornerRadius: 0 } },
  { type: 'rectangle', name: '矩形', icon: '▢', defaults: { name: '矩形', fill: '#ffffff', stroke: '#cccccc', strokeWidth: 1, cornerRadius: 0 } },
  { type: 'line', name: '直线', icon: '—', defaults: { name: '直线', stroke: '#000000', strokeWidth: 1 } },
  { type: 'ellipse', name: '椭圆', icon: '○', defaults: { name: '椭圆', fill: '#ffffff', stroke: '#000000', strokeWidth: 1 } },
  { type: 'barcode', name: '条码', icon: '▌', defaults: { name: '条码', content: '123456789012', format: 'CODE128' } },
  { type: 'image', name: '图片', icon: '🖼', defaults: { name: '图片', src: '', alt: '' } },
]

const rfidVariables = [
  { dataField: 'EPC', label: 'EPC' },
  { dataField: 'TID', label: 'TID' },
  { dataField: 'User Data', label: 'User Data' },
]

function addElement(type: ElementType, defaults: Record<string, unknown>) {
  const base = {
    type,
    name: (defaults.name as string) || type,
    x: 15,
    y: 15,
    width: type === 'line' ? 40 : type === 'text' ? 60 : 50,
    height: type === 'line' ? 0 : 20,
    rotation: 0,
    zIndex: 1,
    visible: true,
  }
  emit('add-element', { ...base, ...defaults } as Omit<DesignElement, 'id'>)
}

function addRfidVariable(v: { dataField: string; label: string }) {
  emit('add-element', {
    type: 'variable',
    name: v.label,
    x: 15,
    y: 15,
    width: 80,
    height: 18,
    rotation: 0,
    zIndex: 1,
    visible: true,
    dataField: v.dataField,
    label: v.label + ':',
    sampleValue: v.dataField === 'TID' ? '387656779876543212345678' : v.dataField === 'EPC' ? '0123456789ABCDEF' : '00000001',
  } as Omit<DesignElement, 'id'>)
}

function addCustomVariableElement(varName: string) {
  emit('add-element', {
    type: 'variable',
    name: varName,
    x: 15,
    y: 15,
    width: 80,
    height: 18,
    rotation: 0,
    zIndex: 1,
    visible: true,
    dataField: varName,
    label: varName + ':',
    sampleValue: '',
  } as Omit<DesignElement, 'id'>)
}

function onAddCustomVariableClick() {
  const used = new Set(props.customVariableNames)
  let n = 1
  while (used.has(`变量${n}`)) n++
  const defaultName = `变量${n}`
  const input = window.prompt('输入变量名称（留空则使用默认 ' + defaultName + '）：', defaultName)
  const name = (input != null && input.trim() !== '') ? input.trim() : defaultName
  emit('add-custom-variable', name)
}
</script>

<style scoped>
@import '../css/left-panel.css';
</style>
