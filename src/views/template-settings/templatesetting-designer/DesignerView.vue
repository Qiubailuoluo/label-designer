<template>
  <div class="designer-view">
    <!-- 顶部工具栏 -->
    <DesignerToolbar
      :config="canvasConfig"
      :template-name="templateName"
      @config-update="handleConfigUpdate"
      @name-change="handleNameChange"
      @save="handleSave"
      @back="handleBack"
    />
    
    <!-- 设计器主体 -->
    <div class="designer-main">
      <!-- 左侧元素面板 -->
      <ElementsPanel @add-element="handleAddElement" />
      
      <!-- 中间画布区域 -->
      <div class="canvas-container">
        <Canvas
          ref="canvasRef"
          :config="canvasConfig"
          :elements="elements"
          @element-select="handleElementSelect"
          @element-update="handleElementUpdate"
        />
      </div>
      
      <!-- 右侧属性面板 -->
      <PropertiesPanel
        v-if="selectedElement"
        :element="selectedElement"
        @element-update="handleElementUpdate"
        @element-delete="handleElementDelete"
      />
      <div v-else class="no-selection">
        <div class="placeholder">
          <span>请选择一个元素进行编辑</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DesignerToolbar from './components/Toolbar.vue'
import ElementsPanel from './components/ElementsPanel.vue'
import Canvas from './components/Canvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import type { CanvasConfig, DesignElement } from './types'
import type { TemplateSaveRequest, TemplateElement } from './services/types.ts'
import { ElementType } from './types'
import { apiService } from './services/api.ts'

const route = useRoute()
const router = useRouter()

// 获取模板ID和名称
const templateId = computed(() => route.params.id as string || '')
const templateName = ref('新标签设计')

// 画布配置
const canvasConfig = ref<CanvasConfig>({
  width: 100,
  height: 60,
  dpi: 300,
  backgroundColor: '#ffffff',
  gridEnabled: true
})

// 元素列表
const elements = ref<DesignElement[]>([])

// 选中的元素
const selectedElement = ref<DesignElement | null>(null)

// 画布引用
const canvasRef = ref<InstanceType<typeof Canvas> | null>(null)

// 处理配置更新
const handleConfigUpdate = (config: Partial<CanvasConfig>) => {
  canvasConfig.value = { ...canvasConfig.value, ...config }
  
  // 通知画布更新
  if (canvasRef.value) {
    canvasRef.value.updateConfig(canvasConfig.value)
  }
}

// 处理添加元素
const handleAddElement = (elementType: ElementType, preset: any) => {
  const element: DesignElement = {
    id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: elementType,
    name: preset.name,
    x: 10 + elements.value.length * 5,
    y: 10 + elements.value.length * 5,
    width: 50,
    height: 20,
    rotation: 0,
    opacity: 1,
    visible: true,
    zIndex: elements.value.length + 1,
    ...preset.defaultConfig
  } as DesignElement
  
  elements.value.push(element)
  
  // 自动选中新添加的元素
  selectedElement.value = element
  
  // 通知画布添加元素
  if (canvasRef.value) {
    canvasRef.value.addElement(element)
  }
}

// 处理元素选中
const handleElementSelect = (elementId: string | null) => {
  if (elementId === null) {
    selectedElement.value = null
    return
  }
  
  const element = elements.value.find(el => el.id === elementId)
  selectedElement.value = element || null
}

// 处理元素更新
const handleElementUpdate = (elementId: string, updates: Partial<DesignElement>) => {
  const index = elements.value.findIndex(el => el.id === elementId)
  if (index !== -1) {
    // 使用类型守卫确保类型安全的更新
    const element = elements.value[index]
    elements.value[index] = { ...element, ...updates } as DesignElement
    
    // 通知画布更新元素
    if (canvasRef.value) {
      canvasRef.value.updateElement(elementId, elements.value[index])
    }
  }
}

// 处理元素删除
const handleElementDelete = (elementId: string) => {
  const index = elements.value.findIndex(el => el.id === elementId)
  if (index !== -1) {
    elements.value.splice(index, 1)
    
    // 如果删除的是当前选中的元素，清空选中
    if (selectedElement.value?.id === elementId) {
      selectedElement.value = null
    }
    
    // 通知画布删除元素
    if (canvasRef.value) {
      canvasRef.value.removeElement(elementId)
    }
  }
}

// 保存设计
const handleSave = async () => {
  console.group('💾 开始保存模板操作')
  console.log('📝 当前模板信息:')
  console.log('  🆔 ID:', templateId.value)
  console.log('  📝 名称:', templateName.value)
  console.log('  📐 画布配置:', canvasConfig.value)
  console.log('  🔤 元素数量:', elements.value.length)
  console.log('  🕐 创建时间:', new Date().toISOString())
  
  try {
    // 准备设计数据 - 按照services/types.ts中TemplateSaveRequest接口要求的结构
    const saveRequest: TemplateSaveRequest = {
      id: templateId.value || undefined,
      name: templateName.value,
      description: 'RFID标签设计模板',
      width: canvasConfig.value.width,
      height: canvasConfig.value.height,
      elements: elements.value.map(element => ({
        id: element.id,
        type: element.type as any, // 类型转换以解决枚举不匹配问题
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        zIndex: element.zIndex
      })) as TemplateElement[],
      category: 'rfid_label'
    }
    
    console.log('📦 准备保存的数据:', saveRequest)
    console.log('💾 数据大小估算:', JSON.stringify(saveRequest).length, '字符')
    
    // 调用后端API保存模板
    console.log('🚀 开始调用后端API保存...')
    const response = await apiService.saveTemplate(saveRequest)
    
    console.log('✅ 后端保存成功')
    console.log('📥 后端响应:', response)
    
    // 保存成功提示
    alert('保存成功！')
    console.log('🎉 保存操作完成')
    
    // 返回模板设置页面
    handleBack()
  } catch (error) {
    console.error('💥 保存失败:', error)
    alert('保存失败，请重试')
  } finally {
    console.groupEnd()
  }
}

// 处理模板名称更改
const handleNameChange = (newName: string) => {
  templateName.value = newName
}

// 返回模板设置页面
const handleBack = () => {
  router.push('/template-settings')
}

// 加载模板数据
const loadTemplateData = () => {
  if (!templateId.value) return
  
  try {
    const designs = JSON.parse(localStorage.getItem('rfidDesigns') || '[]')
    const template = designs.find((d: any) => d.id === templateId.value)
    
    if (template) {
      // 加载模板数据
      templateName.value = template.name || '新标签设计'
      canvasConfig.value = {
        ...canvasConfig.value,
        ...template.canvasConfig
      }
      elements.value = template.elements || []
      
      console.log('加载模板数据成功:', template)
    } else {
      console.log('未找到模板数据，创建新模板')
    }
  } catch (error) {
    console.error('加载模板数据失败:', error)
  }
}

// 页面离开前提示保存
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (elements.value.length > 0) {
    e.preventDefault()
    e.returnValue = '您有未保存的设计，确定要离开吗？'
  }
}

// 初始化
onMounted(() => {
  loadTemplateData()
  
  // 添加页面离开提示
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 监听路由变化
watch(() => route.params.id, () => {
  loadTemplateData()
}, { immediate: true })
</script>

<style scoped>
@import './css/designer.scss';
</style>