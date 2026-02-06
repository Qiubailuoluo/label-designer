<template>
  <div class="properties-panel">
    <div class="panel-header">
      <span class="title">属性</span>
    </div>
    <template v-if="!element">
      <div class="no-selection">
        <p>未选定项目</p>
        <p class="hint">选择设计表面上的一个或多个项目，以编辑其属性。</p>
      </div>
    </template>
    <template v-else>
      <div class="props-body">
        <div class="prop-group">
          <label>名称</label>
          <input :value="element.name" @input="emitUpdate('name', ($event.target as HTMLInputElement).value)" class="prop-input" />
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <label>X (mm)</label>
            <input type="number" :value="element.x" @input="emitUpdate('x', numberVal($event))" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>Y (mm)</label>
            <input type="number" :value="element.y" @input="emitUpdate('y', numberVal($event))" class="prop-input" />
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <label>宽 (mm)</label>
            <input type="number" :value="element.width" @input="emitUpdate('width', numberVal($event))" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>高 (mm)</label>
            <input type="number" :value="element.height" @input="emitUpdate('height', numberVal($event))" class="prop-input" />
          </div>
        </div>
        <div class="prop-group">
          <label>旋转 (°)</label>
          <input type="number" :value="element.rotation" @input="emitUpdate('rotation', numberVal($event))" class="prop-input" min="0" max="360" />
        </div>

        <template v-if="element.type === 'text'">
          <div class="prop-group">
            <label>内容</label>
            <input :value="(element as any).content" @input="emitUpdate('content', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
          <div class="prop-row">
            <div class="prop-group">
              <label>字号</label>
              <input type="number" :value="(element as any).fontSize" @input="emitUpdate('fontSize', numberVal($event))" class="prop-input" min="1" max="200" />
            </div>
            <div class="prop-group">
              <label>颜色</label>
              <input type="color" :value="(element as any).color" @input="emitUpdate('color', ($event.target as HTMLInputElement).value)" class="prop-color" />
            </div>
          </div>
          <div class="prop-group">
            <label>对齐</label>
            <select :value="(element as any).textAlign" @change="emitUpdate('textAlign', ($event.target as HTMLSelectElement).value)" class="prop-select">
              <option value="left">左</option>
              <option value="center">中</option>
              <option value="right">右</option>
            </select>
          </div>
          <div class="prop-group checkboxes">
            <label><input type="checkbox" :checked="(element as any).bold" @change="emitUpdate('bold', ($event.target as HTMLInputElement).checked)" /> 粗体</label>
            <label><input type="checkbox" :checked="(element as any).italic" @change="emitUpdate('italic', ($event.target as HTMLInputElement).checked)" /> 斜体</label>
          </div>
        </template>

        <template v-if="element.type === 'rectangle'">
          <div class="prop-group">
            <label>填充</label>
            <input type="color" :value="(element as any).fill" @input="emitUpdate('fill', ($event.target as HTMLInputElement).value)" class="prop-color" />
          </div>
          <div class="prop-group">
            <label>边框</label>
            <input type="color" :value="(element as any).stroke" @input="emitUpdate('stroke', ($event.target as HTMLInputElement).value)" class="prop-color" />
          </div>
          <div class="prop-group">
            <label>边框宽</label>
            <input type="number" :value="(element as any).strokeWidth" @input="emitUpdate('strokeWidth', numberVal($event))" class="prop-input" min="0" />
          </div>
        </template>

        <template v-if="element.type === 'line'">
          <div class="prop-group">
            <label>颜色</label>
            <input type="color" :value="(element as any).stroke" @input="emitUpdate('stroke', ($event.target as HTMLInputElement).value)" class="prop-color" />
          </div>
          <div class="prop-group">
            <label>线宽</label>
            <input type="number" :value="(element as any).strokeWidth" @input="emitUpdate('strokeWidth', numberVal($event))" class="prop-input" min="0" />
          </div>
        </template>

        <template v-if="element.type === 'variable'">
          <div class="prop-group">
            <label>标签</label>
            <input :value="(element as any).label" @input="emitUpdate('label', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>示例值</label>
            <input :value="(element as any).sampleValue" @input="emitUpdate('sampleValue', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
        </template>

        <template v-if="element.type === 'barcode'">
          <div class="prop-group">
            <label>内容</label>
            <input :value="(element as any).content" @input="emitUpdate('content', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>格式</label>
            <select :value="(element as any).format" @change="emitUpdate('format', ($event.target as HTMLSelectElement).value)" class="prop-select">
              <option value="CODE128">CODE128</option>
              <option value="EAN13">EAN13</option>
            </select>
          </div>
        </template>

        <template v-if="element.type === 'image'">
          <div class="prop-group">
            <label>上传图片</label>
            <input
              type="file"
              accept="image/*"
              class="prop-file"
              @change="onImageFileChange"
            />
            <p v-if="(element as any).src" class="prop-hint">已设置图片，可拖拽调整大小</p>
          </div>
        </template>

        <div class="prop-actions">
          <button type="button" class="btn-delete" @click="emitDelete">删除元素</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DesignElement } from '../types'

const props = defineProps<{
  element: DesignElement | null
}>()

const emit = defineEmits<{
  update: [id: string, updates: Partial<DesignElement>]
  delete: [id: string]
}>()

function numberVal(e: Event): number {
  const v = (e.target as HTMLInputElement).value
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function emitUpdate(key: string, value: unknown) {
  if (!props.element) return
  emit('update', props.element.id, { [key]: value } as Partial<DesignElement>)
}

function emitDelete() {
  if (!props.element) return
  if (confirm('确定删除该元素？')) emit('delete', props.element.id)
}

function onImageFileChange(e: Event) {
  const input = (e.target as HTMLInputElement)
  const file = input.files?.[0]
  if (!file || !props.element) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    emit('update', props.element!.id, { src: dataUrl } as Partial<DesignElement>)
  }
  reader.readAsDataURL(file)
  input.value = ''
}
</script>

<style scoped>
.properties-panel {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}
.no-selection {
  padding: 24px 16px;
  color: #666;
  font-size: 14px;
}
.no-selection .hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
.props-body {
  padding: 12px 16px;
  overflow-y: auto;
}
.prop-group {
  margin-bottom: 12px;
}
.prop-group label {
  display: block;
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
}
.prop-row {
  display: flex;
  gap: 12px;
}
.prop-row .prop-group {
  flex: 1;
}
.prop-input,
.prop-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}
.prop-color {
  width: 100%;
  height: 32px;
  padding: 2px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
.checkboxes {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.checkboxes label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0;
}
.prop-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.btn-delete {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  color: #c62828;
  cursor: pointer;
  font-size: 13px;
}
.btn-delete:hover {
  background: #ffebee;
  border-color: #ef5350;
}

.prop-file {
  width: 100%;
  font-size: 12px;
}

.prop-hint {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #666;
}
</style>
