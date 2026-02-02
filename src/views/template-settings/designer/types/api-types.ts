import { CanvasConfig } from './designer'
import { DesignElement } from './elements'
import { ElementType } from './elements'

// API响应体
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T | null
}

// 保存设计请求
export interface SaveDesignRequest {
  id?: string
  name: string
  description?: string
  canvasConfig: CanvasConfig
  elements: DesignElement[]
  tags?: string[]
  isPublic?: boolean
}

// 保存设计响应
export interface SaveDesignResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

// 获取设计响应
export interface GetDesignResponse {
  id: string
  name: string
  description: string
  canvasConfig: CanvasConfig
  elements: DesignElement[]
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

// 设计列表项
export interface DesignListItem {
  id: string
  name: string
  description: string
  thumbnail: string
  tags: string[]
  elementCount: number
  createdAt: string
  updatedAt: string
}

// 设计列表响应
export interface DesignListResponse {
  items: DesignListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 导出设计请求
export interface ExportDesignRequest {
  designId: string
  format: 'png' | 'jpg' | 'svg' | 'pdf'
  quality?: number
  scale?: number
  includeMargins?: boolean
  backgroundColor?: string
}

// 导出设计响应
export interface ExportDesignResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}