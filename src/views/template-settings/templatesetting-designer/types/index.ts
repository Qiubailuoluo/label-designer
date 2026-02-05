// 元素类型枚举
export enum ElementType {
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  LINE = 'line',
  IMAGE = 'image',
  BARCODE = 'barcode',
  QRCODE = 'qrCode',
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

// 线条元素
export interface LineElement extends BaseElement {
  type: ElementType.LINE
  stroke: string    // 线条颜色
  strokeWidth: number // 线条宽度
  x1: number        // 起点X (mm)
  y1: number        // 起点Y (mm)
  x2: number        // 终点X (mm)
  y2: number        // 终点Y (mm)
}

// 条形码元素
export interface BarcodeElement extends BaseElement {
  type: ElementType.BARCODE
  content: string
  format: string
  data?: string
}

// 二维码元素
export interface QrCodeElement extends BaseElement {
  type: ElementType.QRCODE
  content: string
}

// 圆形元素
export interface CircleElement extends BaseElement {
  type: ElementType.CIRCLE
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

// RFID元素
export interface RfidElement extends BaseElement {
  type: ElementType.RFID
  tid: string
  showLabel: boolean
  label: string
  textColor: string
  bgColor: string
}

// 图片元素
export interface ImageElement extends BaseElement {
  type: ElementType.IMAGE
  src: string
  alt?: string
}

// 元素联合类型
export type DesignElement = TextElement | RectangleElement | CircleElement | LineElement | BarcodeElement | QrCodeElement | RfidElement | ImageElement

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

// 模板元素接口（用于API通信）
export interface TemplateElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
}

// 模板保存请求
export interface TemplateSaveRequest {
  id?: string
  name: string
  description?: string
  width: number
  height: number
  elements: TemplateElement[]
  category?: string
}