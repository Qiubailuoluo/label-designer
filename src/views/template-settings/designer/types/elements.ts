// 基础元素类型
export enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  RECTANGLE = 'rectangle',
  LINE = 'line',
  BARCODE = 'barcode',
  QRCODE = 'qrcode',
  RFID = 'rfid',
  ELLIPSE = 'ellipse'
}

// 文本对齐方式
export enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify'
}

// 字体样式
export enum FontWeight {
  NORMAL = 'normal',
  BOLD = 'bold',
  BOLDER = 'bolder',
  LIGHTER = 'lighter'
}

export enum FontStyle {
  NORMAL = 'normal',
  ITALIC = 'italic',
  OBLIQUE = 'oblique'
}

// 边框样式
export enum BorderStyle {
  SOLID = 'solid',
  DASHED = 'dashed',
  DOTTED = 'dotted',
  DOUBLE = 'double',
  NONE = 'none'
}

// 元素基础接口
export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  zIndex: number
  name: string
  createdAt: string
  updatedAt: string
}

// 文本元素
export interface TextElement extends BaseElement {
  type: ElementType.TEXT
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: FontWeight
  fontStyle: FontStyle
  color: string
  backgroundColor: string
  textAlign: TextAlign
  lineHeight: number
  letterSpacing: number
  underline: boolean
  strikethrough: boolean
  maxLength?: number
}

// 图片元素
export interface ImageElement extends BaseElement {
  type: ElementType.IMAGE
  src: string
  url: string
  alt: string
  preserveAspectRatio: boolean
  brightness: number
  contrast: number
  saturation: number
  blur: number
}

// 矩形元素
export interface RectangleElement extends BaseElement {
  type: ElementType.RECTANGLE
  fill: string
  stroke: string
  strokeWidth: number
  strokeStyle: BorderStyle
  cornerRadius: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
}

// 线条元素
export interface LineElement extends BaseElement {
  type: ElementType.LINE
  stroke: string
  strokeWidth: number
  strokeStyle: BorderStyle
  startArrow: boolean
  endArrow: boolean
  dashArray: number[]
}

// 条形码元素
export interface BarcodeElement extends BaseElement {
  type: ElementType.BARCODE
  value: string
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'QRCODE'
  backgroundColor: string
  lineColor: string
  margin: number
  width: number
  height: number
  displayValue: boolean
  textAlign: TextAlign
  fontColor: string
  fontSize: number
}

// RFID元素
export interface RfidElement extends BaseElement {
  type: ElementType.RFID
  tid: string
  epc: string
  userData: string
  dataFormat: 'hex' | 'ascii'
  startByte: number
  byteLength: number
  selectByte: number
  selectBlock: number
  preview: string
  textColor: string
  backgroundColor: string
  borderColor: string
  showLabel: boolean
  label: string
}

// 元素联合类型
export type DesignElement = 
  | TextElement 
  | ImageElement 
  | RectangleElement 
  | LineElement 
  | BarcodeElement 
  | RfidElement
  | any  // 其他元素类型

// 元素分组
export interface ElementGroup {
  id: string
  name: string
  icon: string
  elements: {
    id: string
    name: string
    icon: string
    type: ElementType
    defaultConfig: Partial<DesignElement>
  }[]
}