<template>
  <div class="left-panel">
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
import type { DesignElement, ElementType } from '../types'

const props = defineProps<{
  customVariableNames: string[]
}>()

const emit = defineEmits<{
  'add-element': [element: Omit<DesignElement, 'id'>]
  'add-custom-variable': [name?: string]
}>()

const layoutTools: { type: ElementType; name: string; icon: string; defaults: Record<string, unknown> }[] = [
  { type: 'text', name: '文本', icon: 'T', defaults: { name: '文本', content: '双击编辑', fontSize: 12, fontFamily: 'Microsoft YaHei', color: '#000000', textAlign: 'left', bold: false, italic: false, fill: '', stroke: '', strokeWidth: 0, cornerRadius: 0 } },
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
