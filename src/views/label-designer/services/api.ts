/**
 * 新标签设计器 - 与后端模板接口对接
 * 复用现有 /api/templates 的请求格式，将本设计器的元素与画布配置映射过去
 */
import type { DesignElement, CanvasConfig } from '../types'

const BASE = 'http://localhost:8080/api'

//***************请求头处理***************
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken')
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

//***************请求处理***************
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

/** 将设计器元素转为后端 elements 数组的一项 */
function elementToBackend(el: DesignElement): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: el.id,
    type: el.type,
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

//***************请求参数类型-保存模板***************
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

//***************请求处理-保存模板***************
export async function saveTemplate(payload: SavePayload): Promise<{ id: string }> {
  const body = {
    template: {
      id: payload.id,
      name: payload.name,
      description: 'RFID标签设计模板',
      width: payload.config.width,
      height: payload.config.height,
      category: 'rfid_label',
      config: {
        metadata: { version: '1.0' },
        canvas: {
          width: payload.config.width,
          height: payload.config.height,
          dpi: payload.config.dpi,
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
  if (!res.ok) throw new Error(await res.text() || res.statusText)
  const data = await res.json()
  return { id: data?.data?.id ?? data?.id ?? payload.id ?? '' }
}

/** 后端返回的模板详情中的 config.elements 单项 */
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
  return { ...base, type: 'text', content: '', fontSize: 12, fontFamily: 'Arial', color: '#000', textAlign: 'left', bold: false, italic: false } as DesignElement
}

//***************请求参数类型-加载模板***************
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

//***************请求处理-加载模板***************
export async function loadTemplate(id: string): Promise<LoadedTemplate> {
  const res = await request(`${BASE}/templates/${id}`)
  if (!res.ok) throw new Error(await res.text() || res.statusText)
  const json = await res.json()
  const data = json?.data ?? json
  const config = data?.config ?? {}
  const canvas = config?.canvas ?? {}
  const elementsRaw = config?.elements ?? []
  const customVariableNames = Array.isArray(config?.customVariableNames) ? config.customVariableNames : []
  return {
    id: data?.id ?? id,
    name: data?.name ?? '未命名',
    width: Number(data?.width ?? canvas?.width ?? 100),
    height: Number(data?.height ?? canvas?.height ?? 60),
    config: {
      width: Number(data?.width ?? canvas?.width ?? 100),
      height: Number(data?.height ?? canvas?.height ?? 60),
      dpi: Number(canvas?.dpi ?? 300),
      backgroundColor: canvas?.backgroundColor ?? '#ffffff',
      gridEnabled: true,
    },
    elements: elementsRaw.map(backendElementToDesign),
    customVariableNames: customVariableNames.map((s: unknown) => String(s)),
  }
}

/** 模板列表项 */
export interface TemplateListItem {
  id: string
  name: string
  updatedAt: string
  createdAt: string
}

/** 获取模板列表 */
export async function getTemplateList(): Promise<TemplateListItem[]> {
  const res = await request(`${BASE}/templates`)
  if (!res.ok) throw new Error(await res.text() || res.statusText)
  const json = await res.json()
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
  if (!res.ok) throw new Error(await res.text() || res.statusText)
}
