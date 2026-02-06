<template>
  <div class="label-designer-page">
    <LabelDesignerToolbar
      :config="canvasConfig"
      :template-name="templateName"
      @config-update="onConfigUpdate"
      @name-change="templateName = $event"
      @save="onSave"
      @back="onBack"
    />
    <div class="designer-body">
      <LabelDesignerLeftPanel
        :custom-variable-names="customVariableNames"
        @add-element="onAddElement"
        @add-custom-variable="onAddCustomVariable"
      />
      <div class="canvas-area">
        <div v-if="pendingAdd" class="placement-hint">请在画布上点击以放置「{{ pendingAddName }}」</div>
        <DesignCanvas
          :config="canvasConfig"
          :elements="elements"
          :selected-id="selectedId"
          @select="selectedId = $event"
          @element-update="onElementUpdate"
          @canvas-click="onCanvasClick"
        />
      </div>
      <PropertiesPanel
        :element="selectedElement"
        :custom-variable-names="customVariableNames"
        @update="onPropertyUpdate"
        @delete="onElementDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LabelDesignerToolbar from './components/Toolbar.vue'
import LabelDesignerLeftPanel from './components/LeftPanel.vue'
import DesignCanvas from './components/DesignCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import type { DesignElement, CanvasConfig } from './types'
import { loadTemplate, saveTemplate } from './services/api'

const route = useRoute()
const router = useRouter()

const templateId = computed(() => (route.params.id as string) || '')
const templateName = ref('新标签设计')
const canvasConfig = ref<CanvasConfig>({
  width: 100,
  height: 60,
  dpi: 300,
  backgroundColor: '#ffffff',
  gridEnabled: true,
})
const elements = ref<DesignElement[]>([])
const customVariableNames = ref<string[]>([])
const selectedId = ref<string | null>(null)
const pendingAdd = ref<Omit<DesignElement, 'id'> | null>(null)
const pendingAddName = computed(() => pendingAdd.value?.name ?? '')

const selectedElement = computed(() => {
  const id = selectedId.value
  if (!id) return null
  return elements.value.find((e) => e.id === id) ?? null
})

function genId() {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** 补齐元素必填字段并生成 id */
function normalizeElement(partial: Omit<DesignElement, 'id'>): DesignElement {
  const id = genId()
  const base = {
    id,
    type: partial.type,
    name: partial.name ?? partial.type,
    x: partial.x ?? 15,
    y: partial.y ?? 15,
    width: partial.width ?? 50,
    height: partial.height ?? 20,
    rotation: partial.rotation ?? 0,
    zIndex: partial.zIndex ?? 1,
    visible: partial.visible !== false,
  }
  const merged = { ...base, ...partial, id } as DesignElement
  if (merged.type === 'text') {
    const t = merged as any
    if (t.content === undefined) t.content = '文本'
    if (t.fontSize === undefined) t.fontSize = 12
    if (t.fontFamily === undefined) t.fontFamily = 'Microsoft YaHei'
    if (t.color === undefined) t.color = '#000000'
    if (t.textAlign === undefined) t.textAlign = 'left'
    if (t.bold === undefined) t.bold = false
    if (t.italic === undefined) t.italic = false
  }
  if (merged.type === 'rectangle') {
    const r = merged as any
    if (r.fill === undefined) r.fill = '#ffffff'
    if (r.stroke === undefined) r.stroke = '#cccccc'
    if (r.strokeWidth === undefined) r.strokeWidth = 1
    if (r.cornerRadius === undefined) r.cornerRadius = 0
  }
  if (merged.type === 'line') {
    const l = merged as any
    if (l.stroke === undefined) l.stroke = '#000000'
    if (l.strokeWidth === undefined) l.strokeWidth = 1
  }
  if (merged.type === 'ellipse') {
    const e = merged as any
    if (e.fill === undefined) e.fill = '#ffffff'
    if (e.stroke === undefined) e.stroke = '#000000'
    if (e.strokeWidth === undefined) e.strokeWidth = 1
  }
  if (merged.type === 'barcode') {
    const b = merged as any
    if (b.content === undefined) b.content = '123456789012'
    if (b.format === undefined) b.format = 'CODE128'
  }
  if (merged.type === 'variable') {
    const v = merged as any
    if (v.dataField === undefined) v.dataField = 'TID'
    if (v.label === undefined) v.label = 'TID:'
    if (v.sampleValue === undefined) v.sampleValue = ''
  }
  return merged
}

function onAddElement(partial: Omit<DesignElement, 'id'>) {
  pendingAdd.value = partial
}

/** 添加用户变量：生成 变量1、变量2… 并加入列表，再添加对应 variable 元素 */
function onAddCustomVariable() {
  const used = new Set(customVariableNames.value)
  let n = 1
  while (used.has(`变量${n}`)) n++
  const name = `变量${n}`
  customVariableNames.value = [...customVariableNames.value, name]
  pendingAdd.value = {
    type: 'variable',
    name,
    x: 15,
    y: 15,
    width: 80,
    height: 18,
    rotation: 0,
    zIndex: 1,
    visible: true,
    dataField: name,
    label: name + ':',
    sampleValue: '',
  } as Omit<DesignElement, 'id'>
}

function onCanvasClick(xMm: number, yMm: number) {
  if (!pendingAdd.value) return
  const partial = { ...pendingAdd.value, x: xMm, y: yMm }
  pendingAdd.value = null
  const el = normalizeElement(partial)
  elements.value.push(el)
  selectedId.value = el.id
}

function onElementUpdate(id: string, updates: Partial<DesignElement>) {
  const el = elements.value.find((e) => e.id === id)
  if (el) Object.assign(el, updates)
}

function onPropertyUpdate(id: string, updates: Partial<DesignElement>) {
  onElementUpdate(id, updates)
}

function onElementDelete(id: string) {
  elements.value = elements.value.filter((e) => e.id !== id)
  if (selectedId.value === id) selectedId.value = null
}

function onConfigUpdate(patch: Partial<CanvasConfig>) {
  canvasConfig.value = { ...canvasConfig.value, ...patch }
}

async function onSave() {
  try {
    await saveTemplate({
      id: templateId.value || undefined,
      name: templateName.value,
      width: canvasConfig.value.width,
      height: canvasConfig.value.height,
      config: canvasConfig.value,
      elements: elements.value,
      customVariableNames: customVariableNames.value,
    })
    alert('保存成功')
    onBack()
  } catch (e) {
    console.error(e)
    alert('保存失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

function onBack() {
  router.push('/label-designer')
}

async function loadInitial() {
  if (!templateId.value) return
  try {
    const data = await loadTemplate(templateId.value)
    templateName.value = data.name
    canvasConfig.value = data.config
    elements.value = data.elements
    const fromApi = data.customVariableNames ?? []
    const fromElements = new Set<string>()
    for (const el of data.elements) {
      if (el.type === 'variable' && el.dataField && !['EPC', 'TID', 'User Data'].includes(el.dataField))
        fromElements.add(el.dataField)
    }
    customVariableNames.value = [...new Set([...fromApi, ...fromElements])]
    selectedId.value = null
  } catch (e) {
    console.error(e)
    alert('加载模板失败：' + (e instanceof Error ? e.message : String(e)))
  }
}

onMounted(() => loadInitial())
watch(templateId, () => loadInitial())
</script>

<style scoped>
@import './css/label-designer.css';
</style>
