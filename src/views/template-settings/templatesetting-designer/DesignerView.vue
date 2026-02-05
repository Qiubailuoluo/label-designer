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

// 添加加载状态标记，防止重复加载
let isLoadingTemplate = false

// 加载模板数据
const loadTemplateData = async () => {
  // 防止重复加载
  if (isLoadingTemplate) {
    console.log('🔄 模板数据正在加载中，跳过重复请求')
    return
  }
  
  // 如果没有模板ID，初始化为空白模板（创建模式）
  if (!templateId.value) {
    console.log('🆕 初始化空白模板（创建模式）')
    
    // 重置所有状态
    resetDesignerState()
    return
  }
  
  try {
    isLoadingTemplate = true
    console.log('📥 开始加载模板数据:', templateId.value)
    
    // 调用真实API加载模板
    const response = await apiService.loadTemplate(templateId.value)
    
    // 健壮性检查：确保响应数据结构正确
    if (!response || !response.data) {
      console.error('❌ 响应数据为空或格式不正确:', response)
      alert('加载模板数据失败：响应数据格式不正确')
      return
    }
    
    // 重置设计器状态
    resetDesignerState()
    
    // 根据后端实际返回的数据格式处理
    // 后端返回: response.data = { id, name, width, height, config, ... }
    // 而不是: response.data.template = { ... }
    const templateData = response.data
    
    // 设置模板基本信息
    templateName.value = templateData.name || '新标签设计'
    
    // 设置画布配置
    canvasConfig.value = {
      width: templateData.width || 100,
      height: templateData.height || 60,
      dpi: templateData.config?.canvas?.dpi || 300,
      backgroundColor: templateData.config?.canvas?.backgroundColor || '#ffffff',
      gridEnabled: true
    }
    
    // 处理元素数据
    const elementsArray = templateData.config?.elements || []
    if (Array.isArray(elementsArray)) {
      elements.value = elementsArray.map((element: any) => {
        // 类型映射：处理后端返回的不同类型标识
        let mappedType = element.type
        if (element.type === 'title') {
          mappedType = 'text' // 将title映射为text类型
        }
        
        const baseElement = {
          id: element.id,
          type: mappedType,
          name: element.name || element.type || '未命名元素',
          x: element.x || 0,
          y: element.y || 0,
          width: element.width || 50,
          height: element.height || 20,
          rotation: element.rotation || 0,
          opacity: element.opacity !== undefined ? element.opacity : 1,
          visible: element.visible !== undefined ? element.visible : true,
          zIndex: element.zIndex || 1
        }
        
        // 根据元素类型添加特定属性
        switch (mappedType) {
          case 'text':
          case 'title':
            return {
              ...baseElement,
              content: element.content || '',
              fontSize: element.fontSize || 12,
              fontFamily: element.fontFamily || 'Arial',
              fontWeight: element.fontWeight || 'normal',
              color: element.color || '#000000',
              textAlign: element.textAlign || 'left'
            } as any
            
          case 'barcode':
            return {
              ...baseElement,
              content: element.data || element.content || '',
              format: element.format || 'CODE128'
            } as any
            
          case 'qrCode':
            return {
              ...baseElement,
              content: element.content || ''
            } as any
            
          case 'rectangle':
            return {
              ...baseElement,
              fillColor: element.fillColor || '#ffffff',
              strokeColor: element.strokeColor || '#000000',
              strokeWidth: element.strokeWidth || 1
            } as any
            
          case 'circle':
            return {
              ...baseElement,
              fillColor: element.fillColor || '#ffffff',
              strokeColor: element.strokeColor || '#000000',
              strokeWidth: element.strokeWidth || 1
            } as any
            
          default:
            return baseElement as any
        }
      }) as DesignElement[]
    } else {
      console.warn('⚠️ 元素数据不是数组格式，使用空数组:', elementsArray)
      elements.value = []
    }
    
    console.log('✅ 模板数据加载成功:', {
      name: templateName.value,
      canvas: canvasConfig.value,
      elementsCount: elements.value.length,
      elementTypes: elements.value.map(e => e.type)
    })
    
    // 通知画布更新配置和元素
    if (canvasRef.value) {
      canvasRef.value.updateConfig(canvasConfig.value)
      
      // 延迟添加元素，确保画布已正确初始化
      setTimeout(() => {
        elements.value.forEach(element => {
          canvasRef.value?.addElement(element)
        })
      }, 100)
    }
  } catch (error) {
    console.error('💥 加载模板数据失败:', error)
    // 显示更友好的错误信息
    if (error instanceof TypeError && error.message.includes('Cannot read properties of undefined')) {
      alert('加载模板数据失败：后端返回的数据格式不正确，请检查后端接口实现')
    } else {
      alert('加载模板数据失败，请稍后重试')
    }
  } finally {
    isLoadingTemplate = false
  }
}

// 重置设计器状态的辅助函数
const resetDesignerState = () => {
  elements.value = []
  selectedElement.value = null
  
  // 重置画布配置为默认值
  canvasConfig.value = {
    width: 100,
    height: 60,
    dpi: 300,
    backgroundColor: '#ffffff',
    gridEnabled: true
  }
  
  // 通知画布清空
  if (canvasRef.value) {
    canvasRef.value.clearCanvas()
  }
  
  console.log('🧹 设计器状态已重置')
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
  // 添加页面离开提示
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 监听路由变化 - 添加防抖和状态检查
watch(() => route.params.id, (newId, oldId) => {
  // 只有当ID真正改变时才重新加载
  if (newId !== oldId) {
    console.log('🔄 路由参数变化:', { from: oldId, to: newId })
    loadTemplateData()
  }
}, { immediate: true })
</script>

<style scoped>
@import './css/designer.scss';
</style>