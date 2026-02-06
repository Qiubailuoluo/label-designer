<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button type="button" class="btn btn-back" @click="emit('back')">← 返回</button>
      <input
        :value="templateName"
        type="text"
        class="template-name-input"
        placeholder="模板名称"
        @input="emit('name-change', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="toolbar-center">
      <span class="label">画布</span>
      <label>宽 <input type="number" :value="config.width" min="10" max="500" @input="emitConfig('width', numberVal($event))" class="num-input" /> mm</label>
      <label>高 <input type="number" :value="config.height" min="10" max="500" @input="emitConfig('height', numberVal($event))" class="num-input" /> mm</label>
      <select :value="config.dpi" @change="emitConfig('dpi', numberVal($event))" class="dpi-select">
        <option :value="72">72 DPI</option>
        <option :value="150">150 DPI</option>
        <option :value="300">300 DPI</option>
        <option :value="600">600 DPI</option>
      </select>
    </div>
    <div class="toolbar-right">
      <button type="button" class="btn btn-save" @click="emit('save')">💾 存储</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CanvasConfig } from '../types'

defineProps<{
  config: CanvasConfig
  templateName: string
}>()

const emit = defineEmits<{
  'config-update': [config: Partial<CanvasConfig>]
  'name-change': [name: string]
  save: []
  back: []
}>()

function numberVal(e: Event): number {
  const v = (e.target as HTMLInputElement).value
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : 0
}

function emitConfig(key: keyof CanvasConfig, value: number) {
  emit('config-update', { [key]: value })
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #2563eb;
  color: #fff;
  flex-shrink: 0;
}
.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn {
  padding: 6px 12px;
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 6px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
.btn:hover {
  background: rgba(255,255,255,0.25);
}
.template-name-input {
  padding: 6px 10px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 6px;
  background: rgba(255,255,255,0.9);
  color: #333;
  font-size: 13px;
  width: 160px;
}
.toolbar-center .label {
  font-size: 12px;
  opacity: 0.9;
}
.toolbar-center label {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.num-input {
  width: 56px;
  padding: 4px 6px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 4px;
  background: rgba(255,255,255,0.9);
  color: #333;
  font-size: 12px;
}
.dpi-select {
  padding: 4px 8px;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 4px;
  background: rgba(255,255,255,0.9);
  color: #333;
  font-size: 12px;
}
.btn-save {
  background: rgba(255,255,255,0.95);
  color: #2563eb;
  font-weight: 500;
}
.btn-save:hover {
  background: #fff;
}
</style>
