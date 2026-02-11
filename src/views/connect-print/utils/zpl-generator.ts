/**
 * ZPL（Zebra Programming Language）生成器
 * 根据标签设计器模板（画布配置 + 元素）生成完整 ZPL 指令。
 *
 * 变量与 RFID 语义：
 * - EPC/TID/User Data：表示**从 RFID 标签读取**该存储区的内容，并在用户设定的模板位置**打印读到的值**，
 *   不是打印固定文字 "EPC"/"TID"/"User Data"。ZPL 中通过 ^RFR 读取到 ^FN1/^FN2/^FN3，再在 ^FT x,y 处用 ^FNn 输出。
 * - 打印 ^FNn 时**不使用** ^FH\^CI28/^CI27（UTF-8），以免把标签数据当 UTF-8 解析导致乱码；标签读出的数据多为单字节或 hex，用打印机默认编码即可。
 * - 其他变量（变量1、条码等）：输出占位符 {{变量名}}，批量打印时用 Excel 替换。
 *
 * 图片支持生成 ^GF 图形指令（需异步预生成 imageZPLCache）。
 * 官方参考：https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands.html
 * 若真机测试与预期不符，请根据 docs/zpl-command-reference.md 反馈正确格式以便修改。
 */
import type { DesignElement, CanvasConfig } from '@/views/label-designer/types'
import type { TextElement, RectElement, LineElement, EllipseElement, BarcodeElement, VariableElement, ImageElement } from '@/views/label-designer/types'

/** 占位符格式：{{变量名}}，批量打印时替换为实际值 */
export const VARIABLE_PLACEHOLDER_PREFIX = '{{'
export const VARIABLE_PLACEHOLDER_SUFFIX = '}}'

/** 条码占位符名前缀，第一个条码=条码，第二个=条码_2 */
export const BARCODE_PLACEHOLDER_BASE = '条码'

/** 由 RFID 读取的变量：打印机从标签读取该存储区内容，在模板位置打印读到的值；不从 Excel 绑定 */
export const RFID_FIELD_NAMES = ['EPC', 'TID', 'User Data'] as const

export function isRfidField(dataField: string): boolean {
  return RFID_FIELD_NAMES.includes(dataField as (typeof RFID_FIELD_NAMES)[number])
}

/**
 * RFID 读取：按成功示例约定
 * - TID：^FN1^RFR,H,0,12,2^FS（H=内存, 起始块0, 长度12, 参数2）
 * - EPC：^FN2^RFR,H,2,16,1^FS（H=内存, 起始块2, 长度16, 参数1）
 * - User Data：^FN3^RFR,U,0,32,1^FS（U=User 内存）
 * 顺序：先 ^FT x,y ^A0N ^FNn ^FS 定义打印位置，再 ^FNn^RFR,...^FS 读取到该字段
 */
const RFID_ZPL_MAP: Record<string, { fn: number; rfr: string }> = {
  TID: { fn: 1, rfr: 'H,0,12,2' },
  EPC: { fn: 2, rfr: 'H,2,16,1' },
  'User Data': { fn: 3, rfr: 'U,0,32,1' },
}

/**
 * 设计器字体名 -> ZPL 文本字体指令（对齐官方示例）
 * - ZEBRA 0: ^A0N,h,w（内置默认字体）
 * - ZEBRA SimSun: ^A@N,h,w,SIMSUN.TTF（按字体文件名调用）
 * - ZEBRA Swiss Unicode: ^A@N,h,w,TT0003M_（Zebra Unicode 字体）
 * 参考：^FT + ^A0N / ^A@N,h,w,字体名 + ^FH\\^CI28 ^FD...^FS^CI27
 */
export const ZPL_FONT_MAP: Record<string, string> = {
  'ZEBRA 0': '0',
  'ZEBRA SimSun': 'D',
  'ZEBRA Swiss Unicode': 'E',
}

/** 返回 ZPL 字体指令：^A0N,h,w 或 ^A@N,h,w,字体文件名 */
function getZPLFontCommand(fontFamily: string | undefined, fontHeight: number, fontWidth: number): string {
  const code = !fontFamily ? '0' : ZPL_FONT_MAP[fontFamily] ?? '0'
  if (code === '0') return `^A0N,${fontHeight},${fontWidth}`
  if (code === 'D') return `^A@N,${fontHeight},${fontWidth},SIMSUN.TTF`
  if (code === 'E') return `^A@N,${fontHeight},${fontWidth},TT0003M_`
  return `^A0N,${fontHeight},${fontWidth}`
}

export function mmToDots(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}

/** 在 ^FD...^FS 中需转义：\ -> \\ ，^ -> _（ZPL 规定） */
function escapeFieldData(s: string): string {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\^/g, '_')
}

/** 旋转 ZPL 方向：N R I B 对应 0 90 180 270 */
function rotationToZPL(deg: number): 'N' | 'R' | 'I' | 'B' {
  const n = ((Math.round(deg) % 360) + 360) % 360
  if (n >= 315 || n < 45) return 'N'
  if (n >= 45 && n < 135) return 'R'
  if (n >= 135 && n < 225) return 'I'
  return 'B'
}

/** 按 zIndex 与 y、x 排序，保证输出顺序稳定 */
function sortElements(elements: DesignElement[]): DesignElement[] {
  return [...elements]
    .filter((el) => el.visible !== false)
    .sort((a, b) => {
      const za = a.zIndex ?? 0
      const zb = b.zIndex ?? 0
      if (za !== zb) return za - zb
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })
}

/** 从模板元素中收集所有可填入的变量名：仅包含已绑定 dataField 的文本、variable、条码（未绑定条码用属性 content，不列入变量） */
export function collectFillableVariables(elements: DesignElement[]): string[] {
  const list: string[] = []
  for (const el of sortElements(elements)) {
    if (el.type === 'text') {
      const dataField = (el as TextElement).dataField
      if (dataField && !list.includes(dataField)) list.push(dataField)
    } else if (el.type === 'variable') {
      const dataField = (el as VariableElement).dataField
      if (dataField && !list.includes(dataField)) list.push(dataField)
    } else if (el.type === 'barcode') {
      const dataField = (el as BarcodeElement).dataField
      if (dataField && !list.includes(dataField)) list.push(dataField)
      /* 无 dataField 的条码使用属性中的 content 固定值，不加入可填变量列表 */
    }
  }
  return list
}

/** 变量名 → 显示名（取首个绑定该变量的元素的 name，用于连接打印等界面） */
export function getVariableDisplayNames(elements: DesignElement[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const el of sortElements(elements)) {
    let dataField: string | undefined
    if (el.type === 'text') dataField = (el as TextElement).dataField
    else if (el.type === 'variable') dataField = (el as VariableElement).dataField
    else if (el.type === 'barcode') dataField = (el as BarcodeElement).dataField
    if (dataField && !(dataField in map)) map[dataField] = el.name ?? dataField
  }
  return map
}

/** 根据模板生成完整 ZPL（条码也使用占位符；图片需传入 imageZPLCache） */
export function templateToZPL(
  config: CanvasConfig,
  elements: DesignElement[],
  options?: {
    variablePlaceholder?: boolean
    /** 图片元素的 ZPL ^GF 片段，key=element.id；无则该图片输出注释 */
    imageZPLCache?: Record<string, string>
  }
): string {
  const dpi = config.dpi ?? 203
  const usePlaceholder = options?.variablePlaceholder !== false
  const imageZPLCache = options?.imageZPLCache ?? {}
  const w = mmToDots(config.width, dpi)
  const h = mmToDots(config.height, dpi)

  const parts: string[] = []
  parts.push('^XA')
  parts.push('^PW' + w)
  parts.push('^LL' + h)
  parts.push('^LH0,0')

  const sorted = sortElements(elements)
  const rfidUsed = new Set<string>()
  for (const el of sorted) {
    const df = (el as { dataField?: string }).dataField
    if (df && isRfidField(df)) rfidUsed.add(df)
  }
  if (rfidUsed.size > 0) parts.push('^RS8')

  for (const el of sorted) {
    const x = mmToDots(el.x, dpi)
    const y = mmToDots(el.y, dpi)
    const wEl = mmToDots(el.width, dpi)
    const hEl = mmToDots(el.height, dpi)
    const rot = rotationToZPL(el.rotation ?? 0)

    switch (el.type) {
      case 'text': {
        const t = el as TextElement
        const fontSize = t.fontSize ?? 12
        const fontHeight = Math.max(10, Math.round((fontSize / 72) * dpi))
        const fontWidth = Math.round(fontHeight * 0.6)
        const aCmd = getZPLFontCommand(t.fontFamily, fontHeight, fontWidth)
        const rotCmd = rot === 'N' ? '' : `^RO${rot}`
        const fdPrefix = '^FH\\^CI28'
        const fdSuffix = '^FS^CI27'
        if (t.dataField && isRfidField(t.dataField)) {
          const info = RFID_ZPL_MAP[t.dataField]
          if (info) {
            parts.push(`^FT${x},${y}${rotCmd}${aCmd}^FN${info.fn}^FS`)
            parts.push(`^FN${info.fn}^RFR,${info.rfr}^FS`)
          }
        } else if (t.dataField && usePlaceholder) {
          parts.push(`^FT${x},${y}${rotCmd}${aCmd}${fdPrefix}^FD${VARIABLE_PLACEHOLDER_PREFIX}${t.dataField}${VARIABLE_PLACEHOLDER_SUFFIX}${fdSuffix}`)
        } else {
          const content = (t.content ?? '').trim() || ' '
          parts.push(`^FT${x},${y}${rotCmd}${aCmd}${fdPrefix}^FD${escapeFieldData(content)}${fdSuffix}`)
        }
        break
      }
      case 'variable': {
        const v = el as VariableElement
        const field = (v.dataField ?? '') as string
        const fontSize = 12
        const fontHeight = Math.max(10, Math.round((fontSize / 72) * dpi))
        const fontWidth = Math.round(fontHeight * 0.6)
        const aCmd = getZPLFontCommand((v as unknown as { fontFamily?: string }).fontFamily, fontHeight, fontWidth)
        const rotCmd = rot === 'N' ? '' : `^RO${rot}`
        const fdPrefix = '^FH\\^CI28'
        const fdSuffix = '^FS^CI27'
        if (field && isRfidField(field)) {
          const info = RFID_ZPL_MAP[field]
          if (info) {
            parts.push(`^FT${x},${y}${rotCmd}${aCmd}^FN${info.fn}^FS`)
            parts.push(`^FN${info.fn}^RFR,${info.rfr}^FS`)
          }
        } else if (field && usePlaceholder) {
          parts.push(`^FT${x},${y}${rotCmd}${aCmd}${fdPrefix}^FD${VARIABLE_PLACEHOLDER_PREFIX}${field}${VARIABLE_PLACEHOLDER_SUFFIX}${fdSuffix}`)
        } else {
          parts.push(`^FT${x},${y}${rotCmd}${aCmd}${fdPrefix}^FD${escapeFieldData(v.sampleValue ?? '')}${fdSuffix}`)
        }
        break
      }
      case 'barcode': {
        const b = el as BarcodeElement
        const format = (b.format ?? 'CODE128').toUpperCase().replace(/\s/g, '')
        const isQR = format === 'QR' || format === 'QRCODE'
        if (isQR) {
          const data = b.dataField && usePlaceholder
            ? `${VARIABLE_PLACEHOLDER_PREFIX}${b.dataField}${VARIABLE_PLACEHOLDER_SUFFIX}`
            : (b.content ?? '').trim() || '0'
          const escaped = usePlaceholder && b.dataField ? data : escapeFieldData(data)
          const mag = Math.max(1, Math.min(10, Math.round(Math.min(wEl, hEl) / 20)))
          parts.push(`^FO${x},${y}^RO${rot}^BQN,2,${mag},Q^FDMM,${escaped}^FS`)
        } else {
          const barHeight = Math.max(20, hEl)
          if (b.dataField && isRfidField(b.dataField)) {
            const info = RFID_ZPL_MAP[b.dataField]
            if (info) {
              parts.push(`^FN${info.fn}^RFR,${info.rfr}^FS`)
              const bcParams = format === 'CODE39' ? `B3N,N,${barHeight},Y,N` : `BCN,${barHeight},Y,N,N,A`
              parts.push(`^FO${x},${y}^RO${rot}^BY2,2^${bcParams}^FD^FN${info.fn}^FS`)
            }
          } else {
            const data = b.dataField && usePlaceholder
              ? `${VARIABLE_PLACEHOLDER_PREFIX}${b.dataField}${VARIABLE_PLACEHOLDER_SUFFIX}`
              : (b.content ?? '').trim() || '0'
            const escaped = usePlaceholder && b.dataField ? data : escapeFieldData(data)
            const bcParams = format === 'CODE39' ? `B3N,N,${barHeight},Y,N` : `BCN,${barHeight},Y,N,N,A`
            parts.push(`^FO${x},${y}^RO${rot}^BY2,2^${bcParams}^FD${escaped}^FS`)
          }
        }
        break
      }
      case 'rectangle': {
        const r = el as RectElement
        const thickness = Math.max(1, mmToDots(r.strokeWidth ?? 1, dpi))
        parts.push(`^FO${x},${y}^RO${rot}^GB${wEl},${hEl},${thickness}^FS`)
        break
      }
      case 'line': {
        const l = el as LineElement
        const thickness = Math.max(1, mmToDots(l.strokeWidth ?? 1, dpi))
        const lineLen = Math.round(Math.sqrt(wEl * wEl + hEl * hEl))
        if (lineLen <= 0) break
        if (Math.abs(hEl) < 2) {
          parts.push(`^FO${x},${y}^RO${rot}^GB${wEl},${thickness},${thickness}^FS`)
        } else if (Math.abs(wEl) < 2) {
          parts.push(`^FO${x},${y}^RO${rot}^GB${thickness},${hEl},${thickness}^FS`)
        } else {
          parts.push(`^FO${x},${y}^GD${lineLen},${thickness}^FS`)
        }
        break
      }
      case 'ellipse': {
        const e = el as EllipseElement
        const thickness = Math.max(1, mmToDots(e.strokeWidth ?? 1, dpi))
        parts.push(`^FO${x},${y}^RO${rot}^GE${wEl},${hEl},${thickness}^FS`)
        break
      }
      case 'image': {
        const imgEl = el as ImageElement
        const cached = imgEl.src ? imageZPLCache[imgEl.id] : ''
        if (cached) {
          parts.push(`^FO${x},${y}^RO${rot}^GFA,${cached}^FS`)
        } else {
          parts.push(`^FO${x},${y}^RO${rot}^FD(Image: ${imgEl.src ? 'load failed or not cached' : 'no src'})^FS`)
        }
        break
      }
      default:
        break
    }
  }

  parts.push('^XZ')
  return parts.join('\n')
}

/**
 * 将图片转为 ZPL ^GFA 图形数据（1bpp 黑白，hex 编码）。
 * 返回的字符串为 ^GFA 后的参数部分，不含 ^FO/^FS，调用方拼成 ^FO x,y ^RO R ^GFA,... ^FS
 * 格式：^GFA,compression,total_bytes,bytes_per_row,total_bytes,hexdata
 */
export function imageToZPLGraphic(
  src: string,
  widthMm: number,
  heightMm: number,
  dpi: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const widthDots = Math.max(1, mmToDots(widthMm, dpi))
        const heightDots = Math.max(1, mmToDots(heightMm, dpi))
        const canvas = document.createElement('canvas')
        canvas.width = widthDots
        canvas.height = heightDots
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2d not available'))
          return
        }
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, widthDots, heightDots)
        ctx.drawImage(img, 0, 0, widthDots, heightDots)
        const imageData = ctx.getImageData(0, 0, widthDots, heightDots)
        const data = imageData.data
        const bytesPerRow = Math.ceil(widthDots / 8)
        const totalBytes = bytesPerRow * heightDots
        const bits: number[] = []
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255
          const black = a < 128 || gray < 0.5 ? 1 : 0
          bits.push(black)
        }
        const bytes: number[] = []
        for (let row = 0; row < heightDots; row++) {
          for (let col = 0; col < bytesPerRow; col++) {
            let byte = 0
            for (let b = 0; b < 8; b++) {
              const idx = row * widthDots + col * 8 + b
              if (idx < bits.length && bits[idx]) byte |= 1 << (7 - b)
            }
            bytes.push(byte)
          }
        }
        const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
        resolve(`0,${totalBytes},${bytesPerRow},${totalBytes},${hex}`)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

/**
 * 为模板中所有图片元素生成 ZPL 缓存（用于 templateToZPL 的 imageZPLCache）
 */
export async function buildImageZPLCache(
  elements: DesignElement[],
  config: CanvasConfig
): Promise<Record<string, string>> {
  const dpi = config.dpi ?? 203
  const cache: Record<string, string> = {}
  for (const el of elements) {
    if (el.type !== 'image') continue
    const img = el as ImageElement
    if (!img.src) continue
    try {
      const gfa = await imageToZPLGraphic(img.src, img.width, img.height, dpi)
      cache[img.id] = gfa
    } catch {
      // 单张失败不影响其他
    }
  }
  return cache
}

/** 将 ZPL 中的占位符 {{变量名}} 替换为 vars 中的值，生成一条可发送的 ZPL */
export function substituteVariables(zpl: string, vars: Record<string, string | number>): string {
  return zpl.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const k = key.trim()
    if (k in vars) return escapeFieldData(String(vars[k]))
    return ''
  })
}

/** 从模板 ZPL + Excel 行数组，生成多条 ZPL（每条对应一行数据替换占位符） */
export function batchZPLFromRows(
  zplTemplate: string,
  rows: Record<string, string | number>[],
  columnToVariable: Record<string, string>
): string[] {
  return rows.map((row) => {
    const vars: Record<string, string | number> = {}
    for (const [col, varName] of Object.entries(columnToVariable)) {
      if (col in row) vars[varName] = row[col]
    }
    return substituteVariables(zplTemplate, vars)
  })
}

/**
 * 写入 RFID：按成功示例 EPC 写入 ^RFW,H,1,12^FD...^FS（H, 块1, 12 字）。
 * TID 为出厂设置不允许修改，一般不写入；User Data 无示例，用 U,0,len,1。
 */
export function buildRfidWriteZPL(writes: { field: 'EPC' | 'TID' | 'User Data'; value: string }[]): string {
  if (writes.length === 0) return ''
  const parts: string[] = []
  for (const w of writes) {
    const value = String(w.value || '').replace(/\s/g, '').toUpperCase()
    if (!value) continue
    if (w.field === 'EPC') {
      parts.push(`^RFW,H,1,12^FD${value}^FS`)
    } else if (w.field === 'User Data') {
      const lenWords = Math.max(1, Math.min(Math.ceil(value.length / 4), 64))
      parts.push(`^RFW,U,0,${lenWords},1^FD${value}^FS`)
    }
  }
  return parts.join('\n')
}

/**
 * 在已有 ZPL 的 ^XA 之后插入「写入 RFID」片段（若有），再接原 ZPL 的 ^PW 等。
 * 用于：先写 EPC/TID/User Data，再读并打印。
 */
export function injectRfidWriteIntoZPL(zpl: string, writeZPL: string): string {
  if (!writeZPL || !zpl.includes('^XA')) return zpl
  const afterXA = zpl.indexOf('^XA') + 3
  const head = zpl.slice(0, afterXA)
  const rest = zpl.slice(afterXA)
  return head + '\n' + writeZPL + '\n' + rest
}
