import api from '@/api'
import type {
  ApiResponse,
  SaveDesignRequest,
  SaveDesignResponse,
  GetDesignResponse,
  DesignListResponse,
  ExportDesignRequest,
  ExportDesignResponse
} from '../types/api-types'

// 保存设计
export const saveDesign = (data: SaveDesignRequest): Promise<ApiResponse<SaveDesignResponse>> => {
  return api.post('/design/save', data)
}

// 获取设计
export const getDesign = (id: string): Promise<ApiResponse<GetDesignResponse>> => {
  return api.get(`/design/${id}`)
}

// 获取设计列表
export const getDesignList = (params: {
  page?: number
  pageSize?: number
  keyword?: string
  tags?: string[]
}): Promise<ApiResponse<DesignListResponse>> => {
  return api.get('/design/list', { params })
}

// 删除设计
export const deleteDesign = (id: string): Promise<ApiResponse> => {
  return api.delete(`/design/${id}`)
}

// 导出设计
export const exportDesign = (data: ExportDesignRequest): Promise<ApiResponse<ExportDesignResponse>> => {
  return api.post('/design/export', data)
}

// 复制设计
export const copyDesign = (id: string): Promise<ApiResponse<SaveDesignResponse>> => {
  return api.post(`/design/${id}/copy`)
}

// 分享设计
export const shareDesign = (id: string, isPublic: boolean): Promise<ApiResponse> => {
  return api.post(`/design/${id}/share`, { isPublic })
}