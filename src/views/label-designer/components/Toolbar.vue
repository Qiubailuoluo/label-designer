<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <el-button type="default" :icon="ArrowLeft" @click="emit('back')">返回</el-button>
      <el-input
        :model-value="templateName"
        placeholder="模板名称"
        class="template-name-input"
        clearable
        @update:model-value="emit('name-change', $event)"
      />
    </div>
    <div class="toolbar-center">
      <span class="label">画布</span>
      <el-input-number
        :model-value="config.width"
        :min="10"
        :max="500"
        controls-position="right"
        class="num-input"
        @update:model-value="onWidthChange"
      />
      <span class="unit">mm 宽</span>
      <el-input-number
        :model-value="config.height"
        :min="10"
        :max="500"
        controls-position="right"
        class="num-input"
        @update:model-value="onHeightChange"
      />
      <span class="unit">mm 高</span>
      <el-select :model-value="config.dpi" class="dpi-select" @update:model-value="onDpiChange">
        <el-option :value="72" label="72 DPI" />
        <el-option :value="150" label="150 DPI" />
        <el-option :value="300" label="300 DPI" />
        <el-option :value="600" label="600 DPI" />
      </el-select>
    </div>
    <div class="toolbar-right">
      <el-button type="primary" :icon="DocumentCopy" @click="emit('save')">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设计器顶部工具栏：返回、模板名称、画布宽/高/DPI、保存
 */
import { ArrowLeft, DocumentCopy } from '@element-plus/icons-vue'
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

function emitConfig(key: keyof CanvasConfig, value: number) {
  emit('config-update', { [key]: value })
}
function onWidthChange(v: number | undefined) {
  if (v != null) emitConfig('width', v)
}
function onHeightChange(v: number | undefined) {
  if (v != null) emitConfig('height', v)
}
function onDpiChange(v: number | string) {
  emitConfig('dpi', Number(v))
}
</script>

<style scoped>
@import '../css/toolbar.css';
</style>
