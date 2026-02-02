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
    
    <div class="elements-categories">
      <div 
        v-for="category in filteredCategories"
        :key="category.id"
        class="category"
      >
        <div class="category-header">
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
        </div>
        
        <div class="elements-list">
          <div
            v-for="element in category.elements"
            :key="element.id"
            class="element-item"
            draggable="true"
            @dragstart="handleDragStart($event, element)"
            @click="addElement(element)"
          >
            <div class="element-icon">{{ element.icon }}</div>
            <div class="element-name">{{ element.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- RFID变量列表 -->
    <div class="rfid-variables" v-if="showRfidVariables">
      <div class="variables-header">
        <h4>RFID变量列表</h4>
        <button class="add-variable-btn" @click="addRfidVariable">
          + 添加新变量
        </button>
      </div>
      
      <div class="variables-list">
        <div 
          v-for="variable in rfidVariables"
          :key="variable.id"
          class="variable-item"
          draggable="true"
          @dragstart="handleVariableDragStart($event, variable)"
        >
          <div class="variable-icon">{{ variable.icon }}</div>
          <div class="variable-content">
            <div class="variable-name">{{ variable.name }}</div>
            <div class="variable-desc">{{ variable.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDesignerStore } from '../stores/designer-store'
import { ElementType, FontWeight, FontStyle, TextAlign, BorderStyle } from '../types/elements'

const store = useDesignerStore()

// 定义元素类型
interface ElementConfig {
  id: string;
  name: string;
  icon: string;
  type: ElementType;
  defaultConfig: any;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  elements: ElementConfig[];
}

// 搜索关键词
const searchKeyword = ref('')

// 元素分类
const elementCategories = ref<Category[]>([
  {
    id: 'text',
    name: '文本元素',
    icon: '🔤',
    elements: [
      {
        id: 'text_basic',
        name: '文本',
        icon: 'T',
        type: ElementType.TEXT,
        defaultConfig: {
          content: '双击编辑文本',
          fontSize: 12,
          fontFamily: 'Microsoft YaHei',
          fontWeight: FontWeight.NORMAL,
          fontStyle: FontStyle.NORMAL,
          color: '#000000',
          backgroundColor: 'transparent',
          textAlign: TextAlign.LEFT,
          lineHeight: 1.5,
          letterSpacing: 0,
          underline: false,
          strikethrough: false
        }
      },
      {
        id: 'text_title',
        name: '标题',
        icon: 'H',
        type: ElementType.TEXT,
        defaultConfig: {
          content: '标题文本',
          fontSize: 24,
          fontFamily: 'Microsoft YaHei',
          fontWeight: FontWeight.BOLD,
          color: '#333333',
          textAlign: TextAlign.CENTER
        }
      }
    ]
  },
  {
    id: 'shapes',
    name: '形状',
    icon: '🔷',
    elements: [
      {
        id: 'rectangle',
        name: '矩形',
        icon: '⬜',
        type: ElementType.RECTANGLE,
        defaultConfig: {
          fill: '#ffffff',
          stroke: '#cccccc',
          strokeWidth: 1,
          strokeStyle: BorderStyle.SOLID,
          cornerRadius: 0
        }
      },
      {
        id: 'line',
        name: '线条',
        icon: '📏',
        type: ElementType.LINE,
        defaultConfig: {
          stroke: '#000000',
          strokeWidth: 1,
          strokeStyle: BorderStyle.SOLID,
          startArrow: false,
          endArrow: false
        }
      },
      {
        id: 'ellipse',
        name: '椭圆',
        icon: '⭕',
        type: ElementType.ELLIPSE,
        defaultConfig: {
          fill: '#ffffff',
          stroke: '#cccccc',
          strokeWidth: 1
        }
      }
    ]
  },
  {
    id: 'barcode',
    name: '条码/二维码',
    icon: '📊',
    elements: [
      {
        id: 'barcode',
        name: '条形码',
        icon: '📋',
        type: ElementType.BARCODE,
        defaultConfig: {
          value: '123456789012',
          format: 'CODE128',
          backgroundColor: '#ffffff',
          lineColor: '#000000',
          displayValue: true
        }
      },
      {
        id: 'qrcode',
        name: '二维码',
        icon: '🔳',
        type: ElementType.QRCODE,
        defaultConfig: {
          value: 'https://example.com',
          backgroundColor: '#ffffff',
          foregroundColor: '#000000'
        }
      }
    ]
  },
  {
    id: 'rfid',
    name: 'RFID字段',
    icon: '🏷️',
    elements: [
      {
        id: 'rfid_tid',
        name: 'TID',
        icon: '🏷️',
        type: ElementType.RFID,
        defaultConfig: {
          tid: '387656779876543212345678',
          dataFormat: 'hex',
          startByte: 1,
          byteLength: 12,
          showLabel: true,
          label: 'TID:',
          textColor: '#000000',
          backgroundColor: '#ffffff',
          borderColor: '#cccccc'
        }
      },
      {
        id: 'rfid_epc',
        name: 'EPC',
        icon: '📊',
        type: ElementType.RFID,
        defaultConfig: {
          epc: '0123456789ABCDEF',
          dataFormat: 'hex',
          showLabel: true,
          label: 'EPC:'
        }
      },
      {
        id: 'rfid_userdata',
        name: '用户数据',
        icon: '📝',
        type: ElementType.RFID,
        defaultConfig: {
          userData: 'User Data Content',
          dataFormat: 'ascii',
          showLabel: true,
          label: 'User Data:'
        }
      }
    ]
  },
  {
    id: 'images',
    name: '图片',
    icon: '🖼️',
    elements: [
      {
        id: 'image',
        name: '图片',
        icon: '🖼️',
        type: ElementType.IMAGE,
        defaultConfig: {
          src: '',
          url: '',
          alt: '图片',
          preserveAspectRatio: true
        }
      }
    ]
  }
])

// RFID变量
const rfidVariables = ref([
  {
    id: 'rfid_mark',
    name: 'RFID 标记',
    icon: '🏷️',
    description: 'RFID标记字段',
    type: 'mark'
  },
  {
    id: 'epc',
    name: 'EPC',
    icon: '📊',
    description: '电子产品代码',
    type: 'epc'
  },
  {
    id: 'tid',
    name: 'TID',
    icon: '🏷️',
    description: '标签识别码',
    type: 'tid'
  },
  {
    id: 'user_data',
    name: 'User Data',
    icon: '📝',
    description: '用户数据区',
    type: 'user_data'
  }
])

// 计算属性
const filteredCategories = computed(() => {
  if (!searchKeyword.value) return elementCategories.value
  
  return elementCategories.value.map(category => ({
    ...category,
    elements: category.elements.filter((element) => 
      element.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      category.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  })).filter(category => category.elements.length > 0)
})

const showRfidVariables = computed(() => {
  return searchKeyword.value.toLowerCase().includes('rfid') || 
         searchKeyword.value.toLowerCase().includes('变量')
})

// 方法
const addElement = (elementConfig: any) => {
  const defaultConfig = {
    x: 10,
    y: 10,
    width: 50,
    height: 20,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: store.elementCount + 1,
    name: elementConfig.name,
    ...elementConfig.defaultConfig
  }
  
  store.addElement({
    type: elementConfig.type,
    ...defaultConfig
  })
}

const handleDragStart = (event: DragEvent, element: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'element',
      elementType: element.type,
      config: element.defaultConfig
    }))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const handleVariableDragStart = (event: DragEvent, variable: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'rfid-variable',
      variableType: variable.type,
      name: variable.name
    }))
    event.dataTransfer.effectAllowed = 'copy'
  }
}

const addRfidVariable = () => {
  // 打开RFID变量编辑器
  console.log('添加RFID变量')
  // TODO: 实现添加RFID变量逻辑
}
</script>

<style scoped>
@import '../css/elements-panel.scss';
</style>