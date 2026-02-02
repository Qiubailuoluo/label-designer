import type { CanvasConfig, DesignElement } from '../types'

// API统一响应格式
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T | null
}

// 模板设计数据结构
export interface TemplateDesignData {
  id?: string
  name: string
  description?: string
  userId: string // 作者ID
  canvasConfig: CanvasConfig
  elements: DesignElement[]
  tags?: string[]
  thumbnail?: string // 缩略图URL
  version?: number // 版本号
  isPublic?: boolean // 是否公开
  status?: 'draft' | 'published' | 'archived' // 状态
}

// 保存设计请求
export interface SaveDesignRequest extends Omit<TemplateDesignData, 'id' | 'userId'> {
  id?: string // 更新时传，创建时不传
}

// 保存设计响应
export interface SaveDesignResponse {
  id: string
  name: string
  version: number
  createdAt: string
  updatedAt: string
}

// 获取设计详情响应
export interface GetDesignResponse extends TemplateDesignData {
  id: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    username: string
    nickname: string
  }
  viewCount: number
  downloadCount: number
  likeCount: number
}

// 设计列表项
export interface DesignListItem {
  id: string
  name: string
  description: string
  thumbnail: string
  userId: string
  username: string
  nickname: string
  tags: string[]
  elementCount: number
  viewCount: number
  downloadCount: number
  likeCount: number
  isPublic: boolean
  status: string
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

// 搜索参数
export interface SearchParams {
  page?: number
  pageSize?: number
  keyword?: string
  tags?: string[]
  userId?: string
  status?: string
  isPublic?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'downloadCount' | 'likeCount'
  sortOrder?: 'asc' | 'desc'
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

// 复制设计响应
export interface CopyDesignResponse {
  id: string
  name: string
  createdAt: string
}

// 批量操作请求
export interface BatchOperationRequest {
  ids: string[]
  operation: 'delete' | 'publish' | 'archive' | 'makePublic' | 'makePrivate'
}