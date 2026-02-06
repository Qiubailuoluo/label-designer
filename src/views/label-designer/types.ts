/**
 * 新标签设计器 - 单一数据源类型定义
 * 所有元素共用的基础字段 + 按 type 的扩展字段
 */

export type ElementType = 'text' | 'rectangle' | 'line' | 'ellipse' | 'barcode' | 'image' | 'variable'

/** 画布配置 */
export interface CanvasConfig {
  width: number   // mm
  height: number  // mm
  dpi: number
  backgroundColor: string
  gridEnabled?: boolean
}

/** 基础元素（所有元素必有） */
export interface BaseElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  visible: boolean
}

/** 文本 */
export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  bold: boolean
  italic: boolean
}

/** 矩形 */
export interface RectElement extends BaseElement {
  type: 'rectangle'
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
}

/** 直线：用 width 表示长度，rotation 表示角度 */
export interface LineElement extends BaseElement {
  type: 'line'
  stroke: string
  strokeWidth: number
}

/** 椭圆 */
export interface EllipseElement extends BaseElement {
  type: 'ellipse'
  fill: string
  stroke: string
  strokeWidth: number
}

/** 条码 */
export interface BarcodeElement extends BaseElement {
  type: 'barcode'
  content: string
  format: string
}

/** 图片 */
export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  alt?: string
}

/** 变量（RFID 等动态数据） */
export interface VariableElement extends BaseElement {
  type: 'variable'
  dataField: 'EPC' | 'TID' | 'User Data'
  label: string
  sampleValue: string
}

export type DesignElement =
  | TextElement
  | RectElement
  | LineElement
  | EllipseElement
  | BarcodeElement
  | ImageElement
  | VariableElement

/** 创建新元素时的默认配置（按类型） */
export interface ElementDefaults {
  text: Partial<Omit<TextElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
  rectangle: Partial<Omit<RectElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
  line: Partial<Omit<LineElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
  ellipse: Partial<Omit<EllipseElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
  barcode: Partial<Omit<BarcodeElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
  image: Partial<Omit<ImageElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
  variable: Partial<Omit<VariableElement, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'visible'>>
}
