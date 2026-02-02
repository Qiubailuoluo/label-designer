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
          @change="handleNameChange"
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
        
        <div class="control-item">
          <label>背景色</label>
          <input
            v-model="localConfig.backgroundColor"
            type="color"
            @change="updateConfig"
          />
        </div>
        
        <div class="control-item">
          <label class="checkbox-label">
            <input
              v-model="localConfig.gridEnabled"
              type="checkbox"
              @change="updateConfig"
            />
            网格
          </label>
        </div>
      </div>
    </div>
    
    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <button class="action-btn save-btn" @click="handleSave">
        <span class="icon">💾</span>
        <span class="text">保存</span>
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
}

interface Emits {
  (e: 'config-update', config: Partial<CanvasConfig>): void
  (e: 'save'): void
  (e: 'back'): void
  (e: 'name-change', name: string): void
}

const props = defineProps<Props>()
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
.designer-toolbar {
  height: 60px;
  background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.template-name {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
}

.toolbar-center {
  display: flex;
  align-items: center;
}

.canvas-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 6px;
  
  label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
  }
  
  input[type="number"] {
    width: 60px;
    padding: 4px 6px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    text-align: center;
    
    &:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
  
  select {
    padding: 4px 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    min-width: 80px;
    
    &:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
    }
    
    option {
      background: #1a237e;
      color: white;
    }
  }
  
  input[type="color"] {
    width: 30px;
    height: 30px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    
    input[type="checkbox"] {
      margin: 0;
    }
  }
}

.unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 25px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
}
</style>