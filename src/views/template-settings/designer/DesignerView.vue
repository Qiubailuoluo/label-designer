<template>
  <div class="designer-view">
    <!-- 顶部工具栏 -->
    <DesignerToolbar
      :config="canvasConfig"
      :template-name="templateName"
      :template-description="templateDescription"
      :is-saving="isSaving"
      @config-update="handleConfigUpdate"
      @name-change="handleNameChange"
      @description-change="handleDescriptionChange"
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
import { useUserStore } from '@/stores/user'
import DesignerToolbar from './components/Toolbar.vue'
import ElementsPanel from './components/ElementsPanel.vue'
import Canvas from './components/Canvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import { saveDesign, getDesign } from './api/designer-api'
import type { CanvasConfig, DesignElement, ElementType } from './types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 获取模板ID和名称
const templateId = computed(() => route.params.id as string || '')
const templateName = ref('新标签设计')
const templateDescription = ref('')

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

  // 加载状态
const isLoading = ref(false)
const isSaving = ref(false)

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
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    router.push('/login')
    return
  }
  
  if (!templateName.value.trim()) {
    alert('请输入模板名称')
    return
  }
  
  try {
    isSaving.value = true
    
    const designData = {
      id: templateId.value || undefined,
      name: templateName.value,
      description: templateDescription.value || '',
      userId: userStore.userInfo?.username || '',
      canvasConfig: canvasConfig.value,
      elements: elements.value,
      tags: ['RFID', '标签'],
      status: 'draft' as const,
      isPublic: false
    }
    
    const response = await saveDesign(designData)
    
    if (response.code === 200 && response.data) {
      // 保存成功
      alert('保存成功！')
      
      // 如果是从模板列表跳转过来的，更新URL中的ID
      if (!templateId.value && response.data.id) {
        router.replace({
          name: 'TemplateDesign',
          params: { id: response.data.id }
        })
      }
      
      // 返回模板设置页面
      router.push('/template-settings')
    } else {
      alert(`保存失败: ${response.msg}`)
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    alert(`保存失败: ${error.msg || '请稍后重试'}`)
  } finally {
    isSaving.value = false
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

// 添加description修改方法
const handleDescriptionChange = (newDescription: string) => {
  templateDescription.value = newDescription
}

// 加载模板数据
const loadTemplateData = async () => {
  if (!templateId.value) {
    // 创建新模板
    templateName.value = '新标签设计'
    templateDescription.value = ''
    canvasConfig.value = {
      width: 100,
      height: 60,
      dpi: 300,
      backgroundColor: '#ffffff',
      gridEnabled: true
    }
    elements.value = []
    return
  }
  
  try {
    isLoading.value = true
    
    const response = await getDesign(templateId.value)
    
    if (response.code === 200 && response.data) {
      const design = response.data
      
      // 检查权限
      if (design.userId !== userStore.userInfo?.username && !design.isPublic) {
        alert('您没有权限查看此模板')
        router.push('/template-settings')
        return
      }
      
      // 加载模板数据
      templateName.value = design.name
      templateDescription.value = design.description || ''
      canvasConfig.value = design.canvasConfig
      elements.value = design.elements || []
      
      console.log('加载模板数据成功:', design)
    } else {
      alert(`加载失败: ${response.msg}`)
      router.push('/template-settings')
    }
  } catch (error: any) {
    console.error('加载模板数据失败:', error)
    alert(`加载失败: ${error.msg || '请稍后重试'}`)
    router.push('/template-settings')
  } finally {
    isLoading.value = false
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