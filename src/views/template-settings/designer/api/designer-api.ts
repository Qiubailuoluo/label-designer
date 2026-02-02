import api from './index'
import type {
  ApiResponse,
  SaveDesignRequest,
  SaveDesignResponse,
  GetDesignResponse,
  DesignListResponse,
  SearchParams,
  ExportDesignRequest,
  ExportDesignResponse,
  CopyDesignResponse,
  BatchOperationRequest
} from './types'

// 保存/更新设计
export const saveDesign = (data: SaveDesignRequest): Promise<ApiResponse<SaveDesignResponse>> => {
  return api.post('/design/save', data)
}

// 获取设计详情
export const getDesign = (id: string): Promise<ApiResponse<GetDesignResponse>> => {
  return api.get(`/design/${id}`)
}

// 获取我的设计列表
export const getMyDesigns = (params: SearchParams = {}): Promise<ApiResponse<DesignListResponse>> => {
  return api.get('/design/my', { params })
}

// 获取公开设计列表
export const getPublicDesigns = (params: SearchParams = {}): Promise<ApiResponse<DesignListResponse>> => {
  return api.get('/design/public', { params })
}

// 搜索设计
export const searchDesigns = (params: SearchParams = {}): Promise<ApiResponse<DesignListResponse>> => {
  return api.get('/design/search', { params })
}

// 删除设计
export const deleteDesign = (id: string): Promise<ApiResponse> => {
  return api.delete(`/design/${id}`)
}

// 批量删除设计
export const batchDeleteDesigns = (ids: string[]): Promise<ApiResponse> => {
  return api.post('/design/batch-delete', { ids })
}

// 复制设计
export const copyDesign = (id: string, newName?: string): Promise<ApiResponse<CopyDesignResponse>> => {
  return api.post(`/design/${id}/copy`, { newName })
}

// 导出设计
export const exportDesign = (data: ExportDesignRequest): Promise<ApiResponse<ExportDesignResponse>> => {
  return api.post('/design/export', data)
}

// 更新设计状态
export const updateDesignStatus = (id: string, status: string): Promise<ApiResponse> => {
  return api.put(`/design/${id}/status`, { status })
}

// 更新设计公开状态
export const updateDesignVisibility = (id: string, isPublic: boolean): Promise<ApiResponse> => {
  return api.put(`/design/${id}/visibility`, { isPublic })
}

// 添加标签
export const addTags = (id: string, tags: string[]): Promise<ApiResponse> => {
  return api.post(`/design/${id}/tags`, { tags })
}

// 移除标签
export const removeTags = (id: string, tags: string[]): Promise<ApiResponse> => {
  return api.delete(`/design/${id}/tags`, { data: { tags } })
}

// 生成缩略图
export const generateThumbnail = (id: string): Promise<ApiResponse<{ thumbnail: string }>> => {
  return api.post(`/design/${id}/thumbnail`)
}

// 批量操作
export const batchOperation = (data: BatchOperationRequest): Promise<ApiResponse> => {
  return api.post('/design/batch-operation', data)
}

// 获取设计统计
export const getDesignStats = (): Promise<ApiResponse<{
  total: number
  published: number
  draft: number
  archived: number
  public: number
  private: number
}>> => {
  return api.get('/design/stats')
}