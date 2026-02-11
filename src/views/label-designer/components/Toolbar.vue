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
/**
 * 设计器顶部工具栏：返回、模板名称、画布宽/高/DPI、保存
 */
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
@import '../css/toolbar.css';
</style>
