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
  opacity: number  // 不透明度 0-1
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
export type DesignElement = TextElement | RectangleElement | RfidElement

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