// 画布配置
export interface CanvasConfig {
  id: string
  name: string
  width: number
  height: number
  dpi: number
  unit: 'mm' | 'px' | 'inch'
  backgroundColor: string
  gridEnabled: boolean
  gridSize: number
  createdAt: string
  updatedAt: string
}

// 设计器状态
export interface DesignerState {
  canvasConfig: CanvasConfig
  selectedElementId: string | null
  isSaving: boolean
  lastSavedAt: string | null
}

// 导出选项
export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf'
  quality: number
  scale: number
  includeMargins: boolean
}