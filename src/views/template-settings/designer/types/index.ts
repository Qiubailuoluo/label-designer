// 元素类型枚举
export enum ElementType {
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  IMAGE = 'image',
  BARCODE = 'barcode',
  RFID = 'rfid'
}

// 基础元素接口
export interface BaseElement {
  id: string
  type: ElementType
  name: string
  x: number        // 位置X (mm)
  y: number        // 位置Y (mm)
  width: number    // 宽度 (mm)
  height: number   // 高度 (mm)
  rotation: number // 旋转角度
  visible: boolean // 是否可见
  zIndex: number   // 层级
  dataField?: string // 数据字段名（可选）
}

// 文本元素
export interface TextElement extends BaseElement {
  type: ElementType.TEXT
  content: string
  fontSize: number
  fontFamily: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  bold: boolean
  italic: boolean
}

// 矩形元素
export interface RectangleElement extends BaseElement {
  type: ElementType.RECTANGLE
  fill: string      // 填充色
  stroke: string    // 边框色
  strokeWidth: number // 边框宽度
  cornerRadius: number // 圆角半径
}

// 条形码元素
export interface BarcodeElement extends BaseElement {
  type: ElementType.BARCODE
  content: string   // 条码内容
  format: string    // 条码格式
}

// RFID元素
export interface RfidElement extends BaseElement {
  type: ElementType.RFID
  tid: string       // TID值
  showLabel: boolean // 显示标签
  label: string     // 标签文本
  textColor: string // 文本颜色
  bgColor: string   // 背景色
}

// 元素联合类型
export type DesignElement = TextElement | RectangleElement | BarcodeElement | RfidElement

// 画布配置
export interface CanvasConfig {
  width: number      // 宽度 (mm)
  height: number     // 高度 (mm)
  dpi: number        // 分辨率
  backgroundColor: string // 背景色
  gridEnabled: boolean   // 是否显示网格
}

// 元素库中的预设元素
export interface ElementPreset {
  id: string
  name: string
  icon: string
  type: ElementType
  defaultConfig: Partial<DesignElement>
}

// 数据字段定义
export interface DataFieldDefinition {
  type: 'string' | 'number' | 'date' | 'barcode' | 'rfid'
  default?: any
  validation?: {
    required?: boolean
    maxLength?: number
    pattern?: string
  }
  source?: 'database' | 'input' | 'system' | 'rfid_reader'
}

// 模板配置
export interface TemplateConfig {
  canvas: {
    width: number
    height: number
    dpi: number
    backgroundColor: string
    unit: 'mm'
  }
  elements: DesignElement[]
  dataFields?: Record<string, DataFieldDefinition>
  printer?: {
    model?: string
    density?: number
    speed?: number
  }
  metadata?: {
    version: string
    description?: string
  }
}

// 模板保存请求
export interface TemplateSaveRequest {
  template: {
    id?: string
    name: string
    description?: string
    width: number
    height: number
    dpi: number
    category?: string
    config: TemplateConfig
  }
  options?: {
    overwrite?: boolean
    generatePreview?: boolean
  }
}