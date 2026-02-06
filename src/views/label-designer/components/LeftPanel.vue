<template>
  <div class="left-panel">
    <section class="panel-section">
      <h3 class="section-title">布局板</h3>
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
      <h3 class="section-title">变量</h3>
      <div class="variable-list">
        <button
          v-for="v in variables"
          :key="v.dataField"
          class="variable-btn"
          @click="addVariable(v)"
        >
          <span class="variable-icon">📌</span>
          {{ v.label }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DesignElement, ElementType } from '../types'

const emit = defineEmits<{
  'add-element': [element: Omit<DesignElement, 'id'>]
}>()

const layoutTools: { type: ElementType; name: string; icon: string; defaults: Record<string, unknown> }[] = [
  { type: 'text', name: '文本', icon: 'T', defaults: { name: '文本', content: '双击编辑', fontSize: 12, fontFamily: 'Microsoft YaHei', color: '#000000', textAlign: 'left', bold: false, italic: false, fill: '', stroke: '', strokeWidth: 0, cornerRadius: 0 } },
  { type: 'rectangle', name: '矩形', icon: '▢', defaults: { name: '矩形', fill: '#ffffff', stroke: '#cccccc', strokeWidth: 1, cornerRadius: 0 } },
  { type: 'line', name: '直线', icon: '—', defaults: { name: '直线', stroke: '#000000', strokeWidth: 1 } },
  { type: 'ellipse', name: '椭圆', icon: '○', defaults: { name: '椭圆', fill: '#ffffff', stroke: '#000000', strokeWidth: 1 } },
  { type: 'barcode', name: '条码', icon: '▌', defaults: { name: '条码', content: '123456789012', format: 'CODE128' } },
  { type: 'image', name: '图片', icon: '🖼', defaults: { name: '图片', src: '', alt: '' } },
]

const variables = [
  { dataField: 'EPC' as const, label: 'EPC' },
  { dataField: 'TID' as const, label: 'TID' },
  { dataField: 'User Data' as const, label: 'User Data' },
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

function addVariable(v: { dataField: 'EPC' | 'TID' | 'User Data'; label: string }) {
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
</script>

<style scoped>
.left-panel {
  width: 220px;
  min-width: 220px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-section {
  padding: 12px;
  border-bottom: 1px solid #eee;
}
.section-title {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: background 0.15s;
}
.tool-btn:hover {
  background: #e8f4fd;
  border-color: #2196f3;
}
.tool-icon {
  font-size: 18px;
  margin-bottom: 4px;
}
.tool-name {
  font-size: 12px;
  color: #555;
}
.variable-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.variable-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
}
.variable-btn:hover {
  background: #f5f5f5;
  border-color: #2196f3;
}
.variable-icon {
  font-size: 14px;
}
</style>
