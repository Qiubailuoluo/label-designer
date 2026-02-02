<template>
  <div class="elements-panel">
    <div class="panel-header">
      <h3>元素库</h3>
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索元素..."
          class="search-input"
        />
      </div>
    </div>
    
    <div class="elements-list">
      <!-- 文本元素 -->
      <div class="element-category">
        <div class="category-header">
          <span class="category-icon">🔤</span>
          <span class="category-name">文本元素</span>
        </div>
        <div class="category-items">
          <div
            v-for="element in textElements"
            :key="element.id"
            class="element-item"
            @click="addElement(element.type, element)"
          >
            <div class="element-icon">{{ element.icon }}</div>
            <div class="element-name">{{ element.name }}</div>
          </div>
        </div>
      </div>
      
      <!-- 形状 -->
      <div class="element-category">
        <div class="category-header">
          <span class="category-icon">🔷</span>
          <span class="category-name">形状</span>
        </div>
        <div class="category-items">
          <div
            v-for="element in shapeElements"
            :key="element.id"
            class="element-item"
            @click="addElement(element.type, element)"
          >
            <div class="element-icon">{{ element.icon }}</div>
            <div class="element-name">{{ element.name }}</div>
          </div>
        </div>
      </div>
      
      <!-- RFID字段 -->
      <div class="element-category">
        <div class="category-header">
          <span class="category-icon">🏷️</span>
          <span class="category-name">RFID字段</span>
        </div>
        <div class="category-items">
          <div
            v-for="element in rfidElements"
            :key="element.id"
            class="element-item"
            @click="addElement(element.type, element)"
          >
            <div class="element-icon">{{ element.icon }}</div>
            <div class="element-name">{{ element.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElementType, ElementPreset } from '../types'

interface Emits {
  (e: 'add-element', type: ElementType, preset: ElementPreset): void
}

const emit = defineEmits<Emits>()

const searchKeyword = ref('')

// 文本元素
const textElements = ref<ElementPreset[]>([
  {
    id: 'text_basic',
    name: '文本',
    icon: 'T',
    type: ElementType.TEXT,
    defaultConfig: {
      name: '文本',
      content: '双击编辑文本',
      fontSize: 12,
      fontFamily: 'Microsoft YaHei',
      color: '#000000',
      textAlign: 'left',
      bold: false,
      italic: false
    }
  },
  {
    id: 'text_title',
    name: '标题',
    icon: 'H',
    type: ElementType.TEXT,
    defaultConfig: {
      name: '标题',
      content: '标题文本',
      fontSize: 24,
      fontFamily: 'Microsoft YaHei',
      color: '#333333',
      textAlign: 'center',
      bold: true,
      italic: false
    }
  }
])

// 形状元素
const shapeElements = ref<ElementPreset[]>([
  {
    id: 'rectangle',
    name: '矩形',
    icon: '⬜',
    type: ElementType.RECTANGLE,
    defaultConfig: {
      name: '矩形',
      fill: '#ffffff',
      stroke: '#cccccc',
      strokeWidth: 1,
      cornerRadius: 0
    }
  }
])

// RFID元素
const rfidElements = ref<ElementPreset[]>([
  {
    id: 'rfid_tid',
    name: 'TID',
    icon: '🏷️',
    type: ElementType.RFID,
    defaultConfig: {
      name: 'RFID TID',
      tid: '387656779876543212345678',
      showLabel: true,
      label: 'TID:',
      textColor: '#000000',
      bgColor: '#f0f0f0'
    }
  },
  {
    id: 'rfid_epc',
    name: 'EPC',
    icon: '📊',
    type: ElementType.RFID,
    defaultConfig: {
      name: 'RFID EPC',
      tid: '0123456789ABCDEF',
      showLabel: true,
      label: 'EPC:',
      textColor: '#000000',
      bgColor: '#f0f0f0'
    }
  }
])

// 搜索过滤
const filteredElements = computed(() => {
  if (!searchKeyword.value) {
    return [...textElements.value, ...shapeElements.value, ...rfidElements.value]
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return [
    ...textElements.value.filter(e => e.name.toLowerCase().includes(keyword)),
    ...shapeElements.value.filter(e => e.name.toLowerCase().includes(keyword)),
    ...rfidElements.value.filter(e => e.name.toLowerCase().includes(keyword))
  ]
})

// 添加元素
const addElement = (type: ElementType, preset: ElementPreset) => {
  emit('add-element', type, preset)
}
</script>

<style scoped>
@import '../css/panel.scss';

.elements-panel {
  width: 220px;
  background-color: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
    font-weight: 600;
  }
}

.search-box {
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    
    &:focus {
      outline: none;
      border-color: #2196f3;
    }
  }
}

.elements-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.element-category {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.category-icon {
  font-size: 12px;
}

.category-name {
  flex: 1;
}

.category-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 16px;
}

.element-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  
  &:hover {
    background-color: #e9ecef;
    border-color: #dee2e6;
    transform: translateY(-1px);
  }
  
  .element-icon {
    font-size: 16px;
    margin-bottom: 4px;
    color: #495057;
  }
  
  .element-name {
    font-size: 11px;
    color: #6c757d;
    text-align: center;
    line-height: 1.2;
  }
}

/* 滚动条样式 */
.elements-list::-webkit-scrollbar {
  width: 4px;
}

.elements-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.elements-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.elements-list::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>