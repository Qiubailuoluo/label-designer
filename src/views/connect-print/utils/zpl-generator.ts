/**
 * ZPL（Zebra Programming Language）生成器
 * 根据标签设计器模板（画布配置 + 元素）生成完整 ZPL 指令。
 * - EPC/TID/User Data：由打印机从 RFID 标签读取，生成 ^RFR + ^FN 指令。
 * - 其他变量（变量1、条码等）：输出占位符 {{变量名}}，批量打印时用 Excel 替换。
 * 图片支持生成 ^GF 图形指令（需异步预生成 imageZPLCache）。
 */
import type { DesignElement, CanvasConfig } from '@/views/label-designer/types'
import type { TextElement, RectElement, LineElement, EllipseElement, BarcodeElement, VariableElement, ImageElement } from '@/views/label-designer/types'

/** 占位符格式：{{变量名}}，批量打印时替换为实际值 */
export const VARIABLE_PLACEHOLDER_PREFIX = '{{'
export const VARIABLE_PLACEHOLDER_SUFFIX = '}}'

/** 条码占位符名前缀，第一个条码=条码，第二个=条码_2 */
export const BARCODE_PLACEHOLDER_BASE = '条码'

/** 由 RFID 读取的变量，不从 Excel 绑定；ZPL 中生成 ^RFR 读取指令 */
export const RFID_FIELD_NAMES = ['EPC', 'TID', 'User Data'] as const

export function isRfidField(dataField: string): boolean {
  return RFID_FIELD_NAMES.includes(dataField as (typeof RFID_FIELD_NAMES)[number])
}

/** RFID 类型对应的 ZPL ^RFR 内存码与 ^FN 编号：E=EPC, H=TID, U=User */
const RFID_ZPL_MAP: Record<string, { rfr: string; fn: number }> = {
  EPC: { rfr: 'E', fn: 1 },
  TID: { rfr: 'H', fn: 2 },
  'User Data': { rfr: 'U', fn: 3 },
}

/** 设计器字体名 -> ZPL ^A 字体代号（0=默认, D=SimSun/宋体, E=Swiss Unicode） */
export const ZPL_FONT_MAP: Record<string, string> = {
  'ZEBRA 0': '0',
  'ZEBRA SimSun': 'D',
  'ZEBRA Swiss Unicode': 'E',
}

function getZPLFontCode(fontFamily: string | undefined): string {
  if (!fontFamily) return '0'
  return ZPL_FONT_MAP[fontFamily] ?? '0'
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

/** 从模板元素中收集所有可填入的变量名：绑定变量的文本、variable、条码的 dataField */
export function collectFillableVariables(elements: DesignElement[]): string[] {
  const list: string[] = []
  let barcodeIndex = 0
  for (const el of sortElements(elements)) {
    if (el.type === 'text') {
      const dataField = (el as TextElement).dataField
      if (dataField && !list.includes(dataField)) list.push(dataField)
    } else if (el.type === 'variable') {
      const dataField = (el as VariableElement).dataField ?? 'TID'
      if (!list.includes(dataField)) list.push(dataField)
    } else if (el.type === 'barcode') {
      const dataField = (el as BarcodeElement).dataField
      if (dataField && !list.includes(dataField)) list.push(dataField)
      else if (!dataField) {
        const key = barcodeIndex === 0 ? BARCODE_PLACEHOLDER_BASE : `${BARCODE_PLACEHOLDER_BASE}_${barcodeIndex}`
        barcodeIndex++
        if (!list.includes(key)) list.push(key)
      }
    }
  }
  return list
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
  if (rfidUsed.size > 0) {
    parts.push('^RS8')
    if (rfidUsed.has('EPC')) parts.push('^RFR,E,0,24,1^FN1^FS')
    if (rfidUsed.has('TID')) parts.push('^RFR,H,0,12,1^FN2^FS')
    if (rfidUsed.has('User Data')) parts.push('^RFR,U,0,32,1^FN3^FS')
  }

  let barcodeIndex = 0
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
        const fontCode = getZPLFontCode(t.fontFamily)
        const aCmd = `^A${fontCode}N,${fontHeight},${fontWidth}`
        if (t.dataField && isRfidField(t.dataField)) {
          const fn = RFID_ZPL_MAP[t.dataField]?.fn ?? 1
          parts.push(`^FO${x},${y}^RO${rot}${aCmd}^FN${fn}^FS`)
        } else if (t.dataField && usePlaceholder) {
          parts.push(`^FO${x},${y}^RO${rot}${aCmd}^FD${VARIABLE_PLACEHOLDER_PREFIX}${t.dataField}${VARIABLE_PLACEHOLDER_SUFFIX}^FS`)
        } else {
          const content = (t.content ?? '').trim() || ' '
          parts.push(`^FO${x},${y}^RO${rot}${aCmd}^FD${escapeFieldData(content)}^FS`)
        }
        break
      }
      case 'variable': {
        const v = el as VariableElement
        const field = (v.dataField ?? 'TID') as string
        const fontSize = 12
        const fontHeight = Math.max(10, Math.round((fontSize / 72) * dpi))
        const fontWidth = Math.round(fontHeight * 0.6)
        const fontCode = getZPLFontCode((v as unknown as { fontFamily?: string }).fontFamily)
        const aCmd = `^A${fontCode}N,${fontHeight},${fontWidth}`
        if (isRfidField(field)) {
          const fn = RFID_ZPL_MAP[field]?.fn ?? 2
          parts.push(`^FO${x},${y}^RO${rot}${aCmd}^FN${fn}^FS`)
        } else if (usePlaceholder) {
          parts.push(`^FO${x},${y}^RO${rot}${aCmd}^FD${VARIABLE_PLACEHOLDER_PREFIX}${field}${VARIABLE_PLACEHOLDER_SUFFIX}^FS`)
        } else {
          parts.push(`^FO${x},${y}^RO${rot}${aCmd}^FD${escapeFieldData(v.sampleValue ?? '')}^FS`)
        }
        break
      }
      case 'barcode': {
        const b = el as BarcodeElement
        const format = (b.format ?? 'CODE128').toUpperCase().replace(/\s/g, '')
        const isQR = format === 'QR' || format === 'QRCODE'
        if (isQR) {
          const data = usePlaceholder
            ? (b.dataField
                ? `${VARIABLE_PLACEHOLDER_PREFIX}${b.dataField}${VARIABLE_PLACEHOLDER_SUFFIX}`
                : (barcodeIndex === 0 ? `${VARIABLE_PLACEHOLDER_PREFIX}${BARCODE_PLACEHOLDER_BASE}${VARIABLE_PLACEHOLDER_SUFFIX}` : `${VARIABLE_PLACEHOLDER_PREFIX}${BARCODE_PLACEHOLDER_BASE}_${barcodeIndex}${VARIABLE_PLACEHOLDER_SUFFIX}`))
            : (b.content ?? '').trim() || '0'
          if (!b.dataField && !usePlaceholder) barcodeIndex++
          const escaped = usePlaceholder ? data : escapeFieldData(data)
          const mag = Math.max(1, Math.min(10, Math.round(Math.min(wEl, hEl) / 20)))
          parts.push(`^FO${x},${y}^RO${rot}^BQN,2,${mag},Q^FDMM,${escaped}^FS`)
        } else {
          const barHeight = Math.max(20, hEl)
          if (b.dataField && isRfidField(b.dataField)) {
            const fn = RFID_ZPL_MAP[b.dataField]?.fn ?? 1
            const bc = format === 'CODE39' || format === 'CODE39' ? 'B3N' : 'BCN'
            parts.push(`^FO${x},${y}^RO${rot}^BY2,2,${barHeight}^${bc}^FD^FN${fn}^FS`)
          } else {
            const barKey = b.dataField || (barcodeIndex === 0 ? BARCODE_PLACEHOLDER_BASE : `${BARCODE_PLACEHOLDER_BASE}_${barcodeIndex}`)
            if (!b.dataField) barcodeIndex++
            const data = usePlaceholder
              ? `${VARIABLE_PLACEHOLDER_PREFIX}${barKey}${VARIABLE_PLACEHOLDER_SUFFIX}`
              : (b.content ?? '').trim() || '0'
            const escaped = usePlaceholder ? data : escapeFieldData(data)
            const bc = format === 'CODE39' ? 'B3N' : 'BCN'
            parts.push(`^FO${x},${y}^RO${rot}^BY2,2,${barHeight}^${bc}^FD${escaped}^FS`)
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
