<template>
  <div class="designer-toolbar">
    <!-- 左侧：返回和模板名称 -->
    <div class="toolbar-left">
      <button class="back-btn" @click="handleBack">
        <span class="icon">←</span>
        <span class="text">返回</span>
      </button>
      
      <div class="template-info">
        <input
          v-model="localName"
          type="text"
          class="template-name"
          placeholder="输入模板名称"
          :disabled="isSaving"
          @change="handleNameChange"
        />
         <input
          v-model="localDescription"
          type="text"
          class="template-description"
          placeholder="模板描述（可选）"
          :disabled="isSaving"
          @change="handleDescriptionChange"
        />
      </div>
    </div>
    
    <!-- 中间：画布设置 -->
    <div class="toolbar-center">
      <div class="canvas-controls">
        <div class="control-item">
          <label>宽度</label>
          <input
            v-model.number="localConfig.width"
            type="number"
            min="10"
            max="500"
            @change="updateConfig"
          />
          <span class="unit">mm</span>
        </div>
        
        <div class="control-item">
          <label>高度</label>
          <input
            v-model.number="localConfig.height"
            type="number"
            min="10"
            max="500"
            @change="updateConfig"
          />
          <span class="unit">mm</span>
        </div>
        
        <div class="control-item">
          <label>分辨率</label>
          <select v-model.number="localConfig.dpi" @change="updateConfig">
            <option value="72">72 DPI</option>
            <option value="150">150 DPI</option>
            <option value="300" selected>300 DPI</option>
            <option value="600">600 DPI</option>
          </select>
        </div>
        
        
      </div>
    </div>
    
    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <button class="action-btn save-btn" @click="handleSave" :disabled="isSaving">
         <span v-if="isSaving" class="icon">⏳</span>
         <span v-else class="icon">💾</span>
        <span class="text">{{ isSaving ? '保存中...' : '保存' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CanvasConfig } from '../types'

interface Props {
  config: CanvasConfig
  templateName: string
  templateDescription?: string
  isSaving?: boolean
}

interface Emits {
  (e: 'config-update', config: Partial<CanvasConfig>): void
  (e: 'save'): void
  (e: 'back'): void
  (e: 'name-change', name: string): void
  (e: 'description-change', description: string): void
}

const props = withDefaults(defineProps<Props>(), {
  templateDescription: '',
  isSaving: false
})
const emit = defineEmits<Emits>()

// 本地配置副本
const localConfig = ref({
  width: props.config.width,
  height: props.config.height,
  dpi: props.config.dpi,
  backgroundColor: props.config.backgroundColor,
  gridEnabled: props.config.gridEnabled
})

// 本地名称副本
const localName = ref(props.templateName)

// 本地描述副本
const localDescription = ref(props.templateDescription)

// 监听描述变化
watch(() => props.templateDescription, (newDescription) => {
  localDescription.value = newDescription
}, { immediate: true })

// 描述变化
const handleDescriptionChange = () => {
  emit('description-change', localDescription.value)
}

// 监听父组件配置变化
watch(() => props.config, (newConfig) => {
  localConfig.value = {
    ...localConfig.value,
    width: newConfig.width,
    height: newConfig.height,
    dpi: newConfig.dpi,
    backgroundColor: newConfig.backgroundColor,
    gridEnabled: newConfig.gridEnabled
  }
}, { immediate: true })

// 监听模板名称变化
watch(() => props.templateName, (newName) => {
  localName.value = newName
}, { immediate: true })

// 更新配置
const updateConfig = () => {
  emit('config-update', localConfig.value)
}

// 名称变化
const handleNameChange = () => {
  emit('name-change', localName.value)
}

// 保存
const handleSave = () => {
  emit('save')
}

// 返回
const handleBack = () => {
  emit('back')
}
</script>

<style scoped>
@import '../css/toolbar.scss';
</style>