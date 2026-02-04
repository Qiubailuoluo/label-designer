// 模板元素基础类型
export interface TemplateElement {
  id: string
  type: 'text' | 'image' | 'barcode' | 'qrCode' | 'rectangle' | 'circle'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  zIndex?: number
}

// 文本元素
export interface TextElement extends TemplateElement {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  color: string
  textAlign: 'left' | 'center' | 'right'
}

// 图片元素
export interface ImageElement extends TemplateElement {
  type: 'image'
  src: string
  alt?: string
}

// 条形码元素
export interface BarcodeElement extends TemplateElement {
  type: 'barcode'
  content: string
  format: string
}

// 二维码元素
export interface QrCodeElement extends TemplateElement {
  type: 'qrCode'
  content: string
}

// 矩形元素
export interface RectangleElement extends TemplateElement {
  type: 'rectangle'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
}

// 圆形元素
export interface CircleElement extends TemplateElement {
  type: 'circle'
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
}

// 模板保存请求
export interface TemplateSaveRequest {
  id?: string
  name: string
  width: number
  height: number
  elements: TemplateElement[]
  category?: string
  description?: string
}

// 模板信息
export interface TemplateInfo {
  id: string
  name: string
  width: number
  height: number
  category?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// 模板列表响应
export interface TemplateListResponse {
  templates: TemplateInfo[]
  total: number
}