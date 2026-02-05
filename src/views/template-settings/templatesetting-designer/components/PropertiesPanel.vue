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
            <input
              v-model="(localElement as any).content"
              type="text"
              class="property-input"
              @change="updateElement"
            />
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
      
      <!-- 条码属性 -->
      <div v-if="localElement.type === 'barcode'" class="property-section">
        <div class="section-header">
          <span class="section-title">条码属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label>内容</label>
            <input
              v-model="(localElement as any).content"
              type="text"
              class="property-input"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label>条码类型</label>
            <select
              v-model="(localElement as any).format"
              class="property-select"
              @change="updateElement"
            >
              <option value="CODE128">CODE128</option>
              <option value="EAN13">EAN13</option>
              <option value="UPC-A">UPC-A</option>
              <option value="QR">QR Code</option>
              <option value="PDF417">PDF417</option>
            </select>
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
import { ElementType } from '../types'

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
    'circle': '圆形',
    'line': '线条',
    'rfid': 'RFID字段',
    'image': '图片',
    'barcode': '条形码',
    'qrCode': '二维码'
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
@import '../css/properties-panel.scss';
</style>