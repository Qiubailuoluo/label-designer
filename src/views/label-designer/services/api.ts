/**
 * 标签设计器 - 模板 API
 * 与后端 /api/templates 对接：保存/加载/列表/删除。
 * 请求自动附带 localStorage 中的 accessToken；401/403 时清除并跳转登录。
 */
import type { DesignElement, CanvasConfig } from '../types'

/** 后端 API 根路径，可按环境配置 */
const BASE = 'http://localhost:8080/api'

/** 请求头：Content-Type + 可选 Authorization */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken')
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/** 发起请求，自动附带认证头；401/403 时清除 token 并跳转登录 */
async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as object) } })
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userInfo')
    window.location.href = '/login'
    throw new Error('认证失败，请重新登录')
  }
  return res
}

/** 解析响应体：HTTP 非 2xx 或业务 code !== 200 时抛出，携带后端返回的 msg */
async function parseResponse(res: Response): Promise<any> {
  const text = await res.text()
  let data: any = null
  try {
    if (text) data = JSON.parse(text)
  } catch {
    // 非 JSON 时用原文
  }
  if (!res.ok) {
    const msg = data?.msg ?? data?.message ?? (text || res.statusText)
    throw new Error(String(msg))
  }
  if (data != null && typeof data.code === 'number' && data.code !== 200) {
    throw new Error(String(data.msg ?? data.message ?? '请求失败'))
  }
  return data
}

/** 将设计器元素转为后端 elements 数组的一项 */
function elementToBackend(el: DesignElement): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: el.id,
    type: el.type,
    name: el.name ?? el.type,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation ?? 0,
    zIndex: el.zIndex ?? 1,
  }
  if (el.type === 'text') {
    base.content = (el as any).content ?? ''
    base.fontSize = (el as any).fontSize ?? 12
    base.fontFamily = (el as any).fontFamily ?? 'Arial'
    base.color = (el as any).color ?? '#000000'
    base.textAlign = (el as any).textAlign ?? 'left'
    base.bold = (el as any).bold
    base.italic = (el as any).italic
    if ((el as any).dataField != null && (el as any).dataField !== '') base.dataField = (el as any).dataField
  }
  if (el.type === 'rectangle') {
    base.fill = (el as any).fill
    base.stroke = (el as any).stroke
    base.strokeWidth = (el as any).strokeWidth
    base.cornerRadius = (el as any).cornerRadius
  }
  if (el.type === 'line') {
    base.stroke = (el as any).stroke
    base.strokeWidth = (el as any).strokeWidth
  }
  if (el.type === 'ellipse') {
    base.fill = (el as any).fill
    base.stroke = (el as any).stroke
    base.strokeWidth = (el as any).strokeWidth
  }
  if (el.type === 'barcode') {
    base.content = (el as any).content
    base.format = (el as any).format
    if ((el as any).dataField != null && (el as any).dataField !== '') base.dataField = (el as any).dataField
  }
  if (el.type === 'variable') {
    base.dataField = (el as any).dataField
    base.label = (el as any).label
    base.sampleValue = (el as any).sampleValue
  }
  return base
}

/** 保存模板请求体 */
export interface SavePayload {
  id?: string
  name: string
  width: number
  height: number
  config: CanvasConfig
  elements: DesignElement[]
  /** 用户自定义变量名列表（如 变量1、变量2），随模板保存 */
  customVariableNames?: string[]
}

/** 保存模板（新建或覆盖），返回模板 id。width/height/dpi/orientation 仅在 template 下，canvas 不再重复。 */
export async function saveTemplate(payload: SavePayload): Promise<{ id: string }> {
  const body = {
    template: {
      id: payload.id,
      name: payload.name,
      description: 'RFID标签设计模板',
      width: payload.config.width,
      height: payload.config.height,
      dpi: payload.config.dpi,
      orientation: payload.config.orientation ?? 'portrait',
      category: 'rfid_label',
      config: {
        metadata: { version: '1.0' },
        canvas: {
          backgroundColor: payload.config.backgroundColor ?? '#ffffff',
          unit: 'mm',
        },
        elements: payload.elements.map(elementToBackend),
        customVariableNames: payload.customVariableNames ?? [],
        dataFields: {},
        printer: { model: 'Zebra ZT410', density: 8, speed: 4 },
      },
    },
    options: { overwrite: false, generatePreview: true, testPrint: false },
    context: { userId: localStorage.getItem('userId') || 'unknown', clientId: 'web_client' },
  }
  const res = await request(`${BASE}/templates/save`, { method: 'POST', body: JSON.stringify(body) })
  const data = await parseResponse(res)
  return { id: data?.data?.id ?? data?.id ?? payload.id ?? '' }
}

/** 将后端 config.elements 单项转换为设计器 DesignElement */
function backendElementToDesign(el: any): DesignElement {
  const base = {
    id: String(el.id ?? `el_${Date.now()}`),
    type: (el.type === 'title' ? 'text' : el.type) as DesignElement['type'],
    name: el.name ?? el.type ?? '未命名',
    x: Number(el.x ?? 0),
    y: Number(el.y ?? 0),
    width: Number(el.width ?? 50),
    height: Number(el.height ?? 20),
    rotation: Number(el.rotation ?? 0),
    zIndex: Number(el.zIndex ?? 1),
    visible: true,
  }
  if (base.type === 'text') {
    return {
      ...base,
      type: 'text',
      content: el.content ?? '',
      fontSize: Number(el.fontSize ?? 12),
      fontFamily: el.fontFamily ?? 'Arial',
      color: el.color ?? '#000000',
      textAlign: (el.textAlign ?? 'left') as 'left' | 'center' | 'right',
      bold: !!el.bold,
      italic: !!el.italic,
      dataField: el.dataField != null && el.dataField !== '' ? String(el.dataField) : undefined,
    } as DesignElement
  }
  if (base.type === 'rectangle') {
    return {
      ...base,
      type: 'rectangle',
      fill: el.fill ?? '#ffffff',
      stroke: el.stroke ?? '#000000',
      strokeWidth: Number(el.strokeWidth ?? 1),
      cornerRadius: Number(el.cornerRadius ?? 0),
    } as DesignElement
  }
  if (base.type === 'line') {
    return {
      ...base,
      type: 'line',
      stroke: el.stroke ?? '#000000',
      strokeWidth: Number(el.strokeWidth ?? 1),
    } as DesignElement
  }
  if (base.type === 'ellipse') {
    return {
      ...base,
      type: 'ellipse',
      fill: el.fill ?? '#ffffff',
      stroke: el.stroke ?? '#000000',
      strokeWidth: Number(el.strokeWidth ?? 1),
    } as DesignElement
  }
  if (base.type === 'barcode') {
    return {
      ...base,
      type: 'barcode',
      content: el.content ?? el.data ?? '',
      format: el.format ?? 'CODE128',
      dataField: el.dataField != null && el.dataField !== '' ? String(el.dataField) : undefined,
    } as DesignElement
  }
  if (base.type === 'variable') {
    return {
      ...base,
      type: 'variable',
      dataField: String(el.dataField ?? 'TID'),
      label: el.label ?? 'TID:',
      sampleValue: el.sampleValue ?? '',
    } as DesignElement
  }
  return { ...base, type: 'text', content: '', fontSize: 12, fontFamily: 'ZEBRA 0', color: '#000', textAlign: 'left', bold: false, italic: false } as DesignElement
}

/** 加载模板接口返回的数据结构 */
export interface LoadedTemplate {
  id: string
  name: string
  width: number
  height: number
  config: CanvasConfig
  elements: DesignElement[]
  /** 用户自定义变量名列表（如 变量1、变量2） */
  customVariableNames: string[]
}

/** 根据 id 加载模板详情（config + elements + customVariableNames） */
export async function loadTemplate(id: string): Promise<LoadedTemplate> {
  const res = await request(`${BASE}/templates/${id}`)
  const json = await parseResponse(res)
  const data = json?.data ?? json
  // 兼容 data 即模板 或 data.template 嵌套一层
  const template = data?.template ?? data
  const config = template?.config ?? {}
  const canvas = config?.canvas ?? {}
  const elementsRaw = config?.elements ?? []
  const customVariableNames = Array.isArray(config?.customVariableNames) ? config.customVariableNames : []
  const width = Number(template?.width ?? canvas?.width ?? 100)
  const height = Number(template?.height ?? canvas?.height ?? 60)
  const orientation = (template?.orientation ?? canvas?.orientation ?? config?.orientation ?? 'portrait') as 'portrait' | 'landscape'
  // 后端可能把 dpi 放在模板根、config 或 config.canvas，按优先级依次回退
  const dpi = Number(template?.dpi ?? config?.dpi ?? canvas?.dpi ?? 300)
  return {
    id: template?.id ?? id,
    name: template?.name ?? '未命名',
    width,
    height,
    config: {
      width,
      height,
      dpi,
      backgroundColor: canvas?.backgroundColor ?? '#ffffff',
      gridEnabled: true,
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
    },
    elements: elementsRaw.map(backendElementToDesign),
    customVariableNames: customVariableNames.map((s: unknown) => String(s)),
  }
}

/** 模板列表中的单项 */
export interface TemplateListItem {
  id: string
  name: string
  updatedAt: string
  createdAt: string
}

/** 获取模板列表 */
export async function getTemplateList(): Promise<TemplateListItem[]> {
  const res = await request(`${BASE}/templates`)
  const json = await parseResponse(res)
  const data = json?.data ?? json
  const list = Array.isArray(data?.list) ? data.list : []
  return list.map((t: any) => ({
    id: t.template_id ?? t.id,
    name: t.template_name ?? t.name ?? '未命名',
    updatedAt: t.create_time ?? t.updatedAt ?? '',
    createdAt: t.create_time ?? t.createdAt ?? '',
  }))
}

/** 删除模板 */
export async function deleteTemplate(id: string): Promise<void> {
  const res = await request(`${BASE}/templates/${id}`, { method: 'DELETE' })
  await parseResponse(res)
}
