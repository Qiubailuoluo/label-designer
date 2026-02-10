/**
 * 连接打印 - 与浏览器扩展通信的桥接层
 * 页面通过 postMessage 与扩展 content script 交互，扩展再请求本地打印服务。
 * 部署在云服务器时，需用户安装扩展并运行本地打印服务。
 */

export const BRIDGE_SOURCE_PAGE = 'connect-print-page'
export const BRIDGE_SOURCE_EXTENSION = 'connect-print-extension'

const DEFAULT_TIMEOUT_MS = 30000
const BATCH_TIMEOUT_MS = 300000

export interface PrinterItem {
  id: string
  name: string
  address?: string
}

export interface AddConnectionPayload {
  connectionType: 'usb' | 'tcp'
  config: {
    usb: { port: string; vendor: string }
    tcp: { host: string; port: string; timeout: number }
  }
}

function genId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function sendRequest<T>(
  type: string,
  payload?: unknown,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const requestId = genId()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler)
      reject(new Error('扩展响应超时，请确认已安装打印扩展并开启本地打印服务'))
    }, timeoutMs)

    const handler = (e: MessageEvent) => {
      if (e.source !== window || e.data?.source !== BRIDGE_SOURCE_EXTENSION || e.data?.requestId !== requestId) return
      window.removeEventListener('message', handler)
      clearTimeout(timer)
      if (e.data.success) resolve(e.data.data as T)
      else reject(new Error(e.data.error || '扩展返回错误'))
    }
    window.addEventListener('message', handler)
    window.postMessage(
      {
        source: BRIDGE_SOURCE_PAGE,
        type,
        requestId,
        payload: payload ?? undefined,
      },
      '*'
    )
  })
}

/** 检测扩展是否注入并响应（PING），超时 5 秒 */
export function isExtensionAvailable(): Promise<boolean> {
  return sendRequest<boolean>('PING', undefined, 5000).then(
    () => true,
    () => false
  )
}

/** 获取打印机列表（含扩展从本地服务拉取的列表） */
export function getPrinters(): Promise<PrinterItem[]> {
  return sendRequest<PrinterItem[]>('GET_PRINTERS')
}

/** 添加连接（USB/TCP）为打印机，加入列表 */
export function addConnection(payload: AddConnectionPayload): Promise<PrinterItem> {
  return sendRequest<PrinterItem>('ADD_CONNECTION', payload)
}

/** 发送单条 ZPL 到指定打印机；系统打印机（id 以 win_ 开头）时需传 printerName */
export function printZPL(printerId: string, zpl: string, printerName?: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
  const payload: { printerId: string; zpl: string; printerName?: string } = { printerId, zpl }
  if (printerName) payload.printerName = printerName
  return sendRequest<void>('PRINT_ZPL', payload, timeoutMs)
}

/** 批量发送多条 ZPL；系统打印机时需传 printerName。批量耗时长，使用更长超时。 */
export function printZPLBatch(printerId: string, zplList: string[], printerName?: string, timeoutMs = BATCH_TIMEOUT_MS): Promise<void> {
  const payload: { printerId: string; zplList: string[]; printerName?: string } = { printerId, zplList }
  if (printerName) payload.printerName = printerName
  return sendRequest<void>('PRINT_ZPL_BATCH', payload, timeoutMs)
}
