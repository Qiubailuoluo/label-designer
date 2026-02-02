import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { CanvasConfig, DesignerState, ExportOptions } from '../types/designer'
import type { DesignElement, ElementType } from '../types/elements'
import { saveDesign, getDesign, exportDesign } from '../api/designer-api'

export const useDesignerStore = defineStore('designer', () => {
  // 状态
  const canvasConfig = ref<CanvasConfig>({
    id: '',
    name: '新标签',
    width: 100,
    height: 50,
    dpi: 300,
    unit: 'mm',
    backgroundColor: '#ffffff',
    gridEnabled: true,
    gridSize: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const elements = ref<DesignElement[]>([])
  const selectedElementId = ref<string | null>(null)
  const isSaving = ref(false)
  const lastSavedAt = ref<string | null>(null)
  const currentDesignId = ref<string | null>(null)

  // 计算属性
  const selectedElement = computed(() => {
    return elements.value.find(el => el.id === selectedElementId.value) || null
  })

  const elementCount = computed(() => elements.value.length)
  const hasChanges = computed(() => {
    // 简化：如果元素数量变化或画布配置变化，则认为有变更
    return elements.value.length > 0 || lastSavedAt.value === null
  })

  // 操作方法
  const updateCanvasConfig = (config: Partial<CanvasConfig>) => {
    canvasConfig.value = {
      ...canvasConfig.value,
      ...config,
      updatedAt: new Date().toISOString()
    }
  }

  const addElement = (element: Omit<DesignElement, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const newElement: DesignElement = {
      ...element,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    } as DesignElement
    
    elements.value.push(newElement)
    selectedElementId.value = newElement.id
    return newElement.id
  }

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index !== -1) {
      elements.value[index] = {
        ...elements.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  const deleteElement = (id: string) => {
    const index = elements.value.findIndex(el => el.id === id)
    if (index !== -1) {
      elements.value.splice(index, 1)
      if (selectedElementId.value === id) {
        selectedElementId.value = null
      }
    }
  }

  const selectElement = (id: string | null) => {
    selectedElementId.value = id
  }

  const clearElements = () => {
    elements.value = []
    selectedElementId.value = null
  }

  const moveElement = (id: string, deltaX: number, deltaY: number) => {
    const element = elements.value.find(el => el.id === id)
    if (element) {
      element.x += deltaX
      element.y += deltaY
      element.updatedAt = new Date().toISOString()
    }
  }

  const resizeElement = (id: string, width: number, height: number) => {
    const element = elements.value.find(el => el.id === id)
    if (element) {
      element.width = width
      element.height = height
      element.updatedAt = new Date().toISOString()
    }
  }

  // API操作
  const saveCurrentDesign = async (name?: string) => {
    try {
      isSaving.value = true
      
      const designData = {
        id: currentDesignId.value || undefined,
        name: name || canvasConfig.value.name,
        canvasConfig: canvasConfig.value,
        elements: elements.value,
        tags: []
      }

      const response = await saveDesign(designData)
      
      if (response.code === 200 && response.data) {
        currentDesignId.value = response.data.id
        lastSavedAt.value = new Date().toISOString()
        return { success: true, id: response.data.id }
      } else {
        return { success: false, error: response.msg }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.msg || '保存失败，请稍后再试' 
      }
    } finally {
      isSaving.value = false
    }
  }

  const loadDesign = async (id: string) => {
    try {
      const response = await getDesign(id)
      
      if (response.code === 200 && response.data) {
        const design = response.data
        currentDesignId.value = design.id
        canvasConfig.value = design.canvasConfig
        elements.value = design.elements
        lastSavedAt.value = design.updatedAt
        return { success: true }
      } else {
        return { success: false, error: response.msg }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.msg || '加载失败，请稍后再试' 
      }
    }
  }

  const exportCurrentDesign = async (options: ExportOptions) => {
    if (!currentDesignId.value) {
      return { success: false, error: '请先保存设计' }
    }

    try {
      const exportData = {
        designId: currentDesignId.value,
        format: options.format,
        quality: options.quality,
        scale: options.scale,
        includeMargins: options.includeMargins,
        backgroundColor: canvasConfig.value.backgroundColor
      }

      const response = await exportDesign(exportData)
      
      if (response.code === 200 && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, error: response.msg }
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.msg || '导出失败，请稍后再试' 
      }
    }
  }

  const resetDesign = () => {
    currentDesignId.value = null
    canvasConfig.value = {
      id: '',
      name: '新标签',
      width: 100,
      height: 50,
      dpi: 300,
      unit: 'mm',
      backgroundColor: '#ffffff',
      gridEnabled: true,
      gridSize: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    elements.value = []
    selectedElementId.value = null
    lastSavedAt.value = null
  }

  return {
    // 状态
    canvasConfig,
    elements,
    selectedElementId,
    isSaving,
    lastSavedAt,
    currentDesignId,

    // 计算属性
    selectedElement,
    elementCount,
    hasChanges,

    // 操作方法
    updateCanvasConfig,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    clearElements,
    moveElement,
    resizeElement,

    // API操作
    saveCurrentDesign,
    loadDesign,
    exportCurrentDesign,
    resetDesign
  }
})