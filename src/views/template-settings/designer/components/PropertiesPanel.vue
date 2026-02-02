<template>
  <div class="properties-panel">
    <div class="panel-header">
      <h3>属性</h3>
      <div class="element-type">{{ getElementTypeName(element.type) }}</div>
    </div>
    
    <div class="properties-content">
      <!-- 基础属性 -->
      <div class="property-section">
        <div class="section-header">
          <span class="section-title">基础属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label>名称</label>
            <input
              v-model="localElement.name"
              type="text"
              class="property-input"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>位置 X</label>
            <input
              v-model.number="localElement.x"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="unit">mm</span>
          </div>
          
          <div class="property-row">
            <label>位置 Y</label>
            <input
              v-model.number="localElement.y"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="unit">mm</span>
          </div>
          
          <div class="property-row">
            <label>宽度</label>
            <input
              v-model.number="localElement.width"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="unit">mm</span>
          </div>
          
          <div class="property-row">
            <label>高度</label>
            <input
              v-model.number="localElement.height"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="unit">mm</span>
          </div>
          
          <div class="property-row">
            <label>旋转</label>
            <input
              v-model.number="localElement.rotation"
              type="number"
              min="0"
              max="360"
              class="property-input"
              @change="updateElement"
            />
            <span class="unit">°</span>
          </div>
          
          <div class="property-row">
            <label>不透明度</label>
            <input
              v-model.number="localElement.opacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="property-slider"
              @change="updateElement"
            />
            <span class="value">{{ Math.round(localElement.opacity * 100) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 文本属性 -->
      <div v-if="localElement.type === 'text'" class="property-section">
        <div class="section-header">
          <span class="section-title">文本属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label>内容</label>
            <textarea
              v-model="(localElement as any).content"
              class="property-textarea"
              rows="3"
              @change="updateElement"
            ></textarea>
          </div>
          
          <div class="property-row">
            <label>字体大小</label>
            <input
              v-model.number="(localElement as any).fontSize"
              type="number"
              class="property-input"
              min="1"
              max="200"
              @change="updateElement"
            />
            <span class="unit">pt</span>
          </div>
          
          <div class="property-row">
            <label>字体颜色</label>
            <input
              v-model="(localElement as any).color"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>字体</label>
            <select
              v-model="(localElement as any).fontFamily"
              class="property-select"
              @change="updateElement"
            >
              <option value="Microsoft YaHei">微软雅黑</option>
              <option value="SimSun">宋体</option>
              <option value="SimHei">黑体</option>
              <option value="Arial">Arial</option>
            </select>
          </div>
          
          <div class="property-row">
            <label>对齐方式</label>
            <select
              v-model="(localElement as any).textAlign"
              class="property-select"
              @change="updateElement"
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
          
          <div class="property-row">
            <label class="checkbox-label">
              <input
                v-model="(localElement as any).bold"
                type="checkbox"
                @change="updateElement"
              />
              加粗
            </label>
            
            <label class="checkbox-label">
              <input
                v-model="(localElement as any).italic"
                type="checkbox"
                @change="updateElement"
              />
              斜体
            </label>
          </div>
        </div>
      </div>
      
      <!-- 矩形属性 -->
      <div v-if="localElement.type === 'rectangle'" class="property-section">
        <div class="section-header">
          <span class="section-title">矩形属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label>填充色</label>
            <input
              v-model="(localElement as any).fill"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>边框颜色</label>
            <input
              v-model="(localElement as any).stroke"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>边框宽度</label>
            <input
              v-model.number="(localElement as any).strokeWidth"
              type="number"
              class="property-input"
              min="0"
              max="10"
              @change="updateElement"
            />
            <span class="unit">px</span>
          </div>
          
          <div class="property-row">
            <label>圆角半径</label>
            <input
              v-model.number="(localElement as any).cornerRadius"
              type="number"
              class="property-input"
              min="0"
              max="50"
              @change="updateElement"
            />
            <span class="unit">px</span>
          </div>
        </div>
      </div>
      
      <!-- RFID属性 -->
      <div v-if="localElement.type === 'rfid'" class="property-section">
        <div class="section-header">
          <span class="section-title">RFID属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label>TID值</label>
            <input
              v-model="(localElement as any).tid"
              type="text"
              class="property-input"
              placeholder="387656779876543212345678"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="checkbox-label">
              <input
                v-model="(localElement as any).showLabel"
                type="checkbox"
                @change="updateElement"
              />
              显示标签
            </label>
          </div>
          
          <div v-if="(localElement as any).showLabel" class="property-row">
            <label>标签文本</label>
            <input
              v-model="(localElement as any).label"
              type="text"
              class="property-input"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>文本颜色</label>
            <input
              v-model="(localElement as any).textColor"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>背景色</label>
            <input
              v-model="(localElement as any).bgColor"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="property-section actions-section">
        <div class="property-group">
          <button class="action-btn delete-btn" @click="handleDelete">
            删除元素
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DesignElement } from '../types'

interface Props {
  element: DesignElement
}

interface Emits {
  (e: 'element-update', elementId: string, updates: Partial<DesignElement>): void
  (e: 'element-delete', elementId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地元素副本（用于双向绑定）
const localElement = ref({ ...props.element })

// 监听父组件元素变化
watch(() => props.element, (newElement) => {
  localElement.value = { ...newElement }
}, { deep: true })

// 获取元素类型名称
const getElementTypeName = (type: string): string => {
  const names: Record<string, string> = {
    'text': '文本',
    'rectangle': '矩形',
    'rfid': 'RFID字段',
    'image': '图片',
    'barcode': '条形码'
  }
  return names[type] || type
}

// 更新元素
const updateElement = () => {
  const updates: Partial<DesignElement> = { ...localElement.value }
  // 移除id和type，因为它们不应该被更新
  delete (updates as any).id
  delete (updates as any).type
  
  emit('element-update', props.element.id, updates)
}

// 删除元素
const handleDelete = () => {
  if (confirm('确定要删除这个元素吗？')) {
    emit('element-delete', props.element.id)
  }
}
</script>

<style scoped>
@import '../css/panel.scss';

.properties-panel {
  width: 300px;
  background-color: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  
  h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #333;
    font-weight: 600;
  }
  
  .element-type {
    font-size: 12px;
    color: #666;
  }
}

.properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-section {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
  
  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    flex: 1;
    font-size: 12px;
    color: #555;
    min-width: 60px;
  }
  
  .property-input {
    width: 80px;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    
    &:focus {
      outline: none;
      border-color: #2196f3;
    }
  }
  
  .property-textarea {
    flex: 1;
    min-height: 60px;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    resize: vertical;
    
    &:focus {
      outline: none;
      border-color: #2196f3;
    }
  }
  
  .property-select {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    background-color: white;
    
    &:focus {
      outline: none;
      border-color: #2196f3;
    }
  }
  
  .property-color {
    width: 30px;
    height: 30px;
    padding: 2px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .property-slider {
    flex: 1;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    outline: none;
    appearance: none;
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: #2196f3;
      border-radius: 50%;
      cursor: pointer;
    }
  }
  
  .unit {
    width: 30px;
    font-size: 11px;
    color: #666;
  }
  
  .value {
    width: 40px;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    
    input[type="checkbox"] {
      margin: 0;
    }
  }
}

.actions-section {
  .property-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .action-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      opacity: 0.9;
    }
  }
  
  .delete-btn {
    background-color: #dc3545;
    color: white;
  }
}

/* 滚动条样式 */
.properties-content::-webkit-scrollbar {
  width: 4px;
}

.properties-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.properties-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.properties-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>