/**
 * 新标签设计器 - Fabric 画布工具
 * 只做两件事：元素 → Fabric 对象；Fabric 对象 → 更新差量（由父组件合并到唯一数据源）
 */
import * as fabric from 'fabric'
import type { DesignElement, CanvasConfig } from '../types'
import type { TextElement, RectElement, LineElement, EllipseElement } from '../types'

const DPI = 300

export function mmToPx(mm: number, dpi: number = DPI): number {
  return (mm / 25.4) * dpi
}

export function pxToMm(px: number, dpi: number = DPI): number {
  return (px / dpi) * 25.4
}

/** 几何数值统一保留最多两位小数，避免浮点误差与回退问题 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

const defaultOpts = {
  selectable: true,
  hasControls: true,
  hasBorders: true,
  originX: 'left' as const,
  originY: 'top' as const,
  lockScalingFlip: true,
  cornerStyle: 'circle' as const,
  cornerColor: '#2196f3',
  cornerSize: 8,
  transparentCorners: false,
}

function setElementMeta(obj: fabric.Object, id: string, type: string) {
  obj.set('elementId', id)
  obj.set('elementType', type)
}

/** 对文本类对象按目标像素宽高设置 scale，使拖拽/属性面板修改的宽高在重画时生效 */
function applyTextSize(obj: fabric.Object, targetW: number, targetH: number) {
  const nw = (obj.width ?? 0) as number
  const nh = (obj.height ?? 0) as number
  if (targetW > 0 && targetH > 0 && nw > 0 && nh > 0) {
    obj.set({ scaleX: targetW / nw, scaleY: targetH / nh })
  }
}

/** 异步加载图片并返回 Fabric 图片对象，用于替换画布上的图片占位 */
export function loadImageObject(
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  dpi: number,
  elementId: string
): Promise<fabric.Object> {
  const FabricImage = (fabric as any).FabricImage ?? (fabric as any).Image
  if (!FabricImage || !FabricImage.fromURL) {
    return Promise.reject(new Error('FabricImage.fromURL not available'))
  }
  return FabricImage.fromURL(src, { crossOrigin: 'anonymous' }).then((img: fabric.Object) => {
    const iw = (img as any).width ?? 1
    const ih = (img as any).height ?? 1
    const scaleX = w / iw
    const scaleY = h / ih
    img.set({
      left: x,
      top: y,
      angle,
      scaleX,
      scaleY,
      ...defaultOpts,
    })
    setElementMeta(img, elementId, 'image')
    img.set('src', src)
    return img
  })
}

export function createFabricObject(element: DesignElement, dpi: number): fabric.Object {
  const x = mmToPx(element.x, dpi)
  const y = mmToPx(element.y, dpi)
  const w = mmToPx(element.width, dpi)
  const h = mmToPx(element.height, dpi)
  const angle = element.rotation ?? 0

  switch (element.type) {
    case 'text': {
      const el = element as TextElement
      const text = new fabric.Text(el.content || '文本', {
        left: x,
        top: y,
        fontSize: el.fontSize ?? 12,
        fill: el.color ?? '#000000',
        fontFamily: el.fontFamily ?? 'Arial',
        textAlign: el.textAlign ?? 'left',
        fontWeight: el.bold ? 'bold' : 'normal',
        fontStyle: el.italic ? 'italic' : 'normal',
        ...defaultOpts,
      })
      setElementMeta(text, element.id, 'text')
      applyTextSize(text, w, h)
      return text
    }

    case 'rectangle': {
      const el = element as RectElement
      const rect = new fabric.Rect({
        left: x,
        top: y,
        width: w,
        height: h,
        angle,
        fill: el.fill ?? '#ffffff',
        stroke: el.stroke ?? '#000000',
        strokeWidth: el.strokeWidth ?? 1,
        rx: el.cornerRadius ?? 0,
        ry: el.cornerRadius ?? 0,
        ...defaultOpts,
      })
      setElementMeta(rect, element.id, 'rectangle')
      return rect
    }

    case 'line': {
      const el = element as LineElement
      const endX = x + mmToPx(element.width, dpi) * Math.cos((angle * Math.PI) / 180)
      const endY = y + mmToPx(element.width, dpi) * Math.sin((angle * Math.PI) / 180)
      const line = new fabric.Line([x, y, endX, endY], {
        stroke: el.stroke ?? '#000000',
        strokeWidth: el.strokeWidth ?? 1,
        ...defaultOpts,
      })
      setElementMeta(line, element.id, 'line')
      return line
    }

    case 'ellipse': {
      const el = element as EllipseElement
      const ellipse = new fabric.Ellipse({
        left: x,
        top: y,
        rx: w / 2,
        ry: h / 2,
        angle,
        fill: el.fill ?? '#ffffff',
        stroke: el.stroke ?? '#000000',
        strokeWidth: el.strokeWidth ?? 1,
        ...defaultOpts,
      })
      setElementMeta(ellipse, element.id, 'ellipse')
      return ellipse
    }

    case 'variable': {
      const v = element as any
      const displayText = [v.label ?? '', v.sampleValue ?? ''].filter(Boolean).join(' ') || element.type
      const text = new fabric.Text(String(displayText), {
        left: x,
        top: y,
        fontSize: 10,
        fill: '#333',
        ...defaultOpts,
      })
      setElementMeta(text, element.id, 'variable')
      applyTextSize(text, w, h)
      return text
    }

    case 'barcode': {
      const v = element as any
      const text = new fabric.Text(String(v.content || 'barcode'), {
        left: x,
        top: y,
        fontSize: 10,
        fill: '#333',
        ...defaultOpts,
      })
      setElementMeta(text, element.id, 'barcode')
      applyTextSize(text, w, h)
      return text
    }

    case 'image': {
      const placeholder = new fabric.Rect({
        left: x,
        top: y,
        width: w,
        height: h,
        angle,
        fill: 'transparent',
        stroke: '#ccc',
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        ...defaultOpts,
      })
      setElementMeta(placeholder, element.id, 'image')
      return placeholder
    }

    default:
      return createFabricObject({ ...(element as Record<string, unknown>), type: 'text', content: '未支持的类型' } as TextElement, dpi)
  }
}

/**
 * 从 Fabric 对象读回用户在画布上的修改（位置、尺寸、旋转及可读的类型属性）
 * @param geometryOnly 为 true 时只返回几何（x,y,width,height,rotation 等），不返回内容/样式，用于 flush 时避免覆盖右侧刚改的内容
 */
export function getUpdatesFromFabricObject(obj: fabric.Object, dpi: number, geometryOnly = false): Partial<DesignElement> {
  const id = obj.get('elementId')
  const type = obj.get('elementType')
  if (!id || !type) return {}

  const left = (obj.left ?? 0) as number
  const top = (obj.top ?? 0) as number
  const angle = (obj.angle ?? 0) as number
  const scaleX = (obj.scaleX ?? 1) as number
  const scaleY = (obj.scaleY ?? 1) as number
  let width = (obj.width ?? 0) as number
  let height = (obj.height ?? 0) as number
  if (obj instanceof fabric.Line) {
    const left = (obj.left ?? 0) as number
    const top = (obj.top ?? 0) as number
    const angle = (obj.angle ?? 0) as number
    const w = (obj.width ?? 0) as number
    const h = (obj.height ?? 0) as number
    const scaleX = (obj.scaleX ?? 1) as number
    const scaleY = (obj.scaleY ?? 1) as number
    const lenPx = Math.sqrt((w * scaleX) ** 2 + (h * scaleY) ** 2)
    const rad = (angle * Math.PI) / 180
    const startX = left - (lenPx / 2) * Math.cos(rad)
    const startY = top - (lenPx / 2) * Math.sin(rad)
    const lineUpdates: Partial<DesignElement> = {
      id,
      x: round2(pxToMm(startX, dpi)),
      y: round2(pxToMm(startY, dpi)),
      width: round2(pxToMm(lenPx, dpi)),
      height: 0,
      rotation: round2(angle),
    }
    if (obj instanceof fabric.Line) {
      ;(lineUpdates as any).stroke = obj.stroke
      ;(lineUpdates as any).strokeWidth = obj.strokeWidth ?? 1
    }
    return lineUpdates
  }

  const actualW = width * scaleX
  const actualH = height * scaleY
  const updates: Partial<DesignElement> = {
    id,
    x: round2(pxToMm(left, dpi)),
    y: round2(pxToMm(top, dpi)),
    width: round2(pxToMm(actualW, dpi)),
    height: round2(pxToMm(actualH, dpi)),
    rotation: round2(angle),
  }
  if (geometryOnly) return updates

  if (type === 'text' && obj instanceof fabric.Text) {
    Object.assign(updates, {
      content: obj.text,
      fontSize: obj.fontSize,
      color: obj.fill,
      fontFamily: obj.fontFamily,
      textAlign: obj.textAlign,
      bold: obj.fontWeight === 'bold',
      italic: obj.fontStyle === 'italic',
    })
  }
  if (type === 'rectangle' && obj instanceof fabric.Rect) {
    Object.assign(updates, {
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      cornerRadius: obj.rx ?? 0,
    })
  }
  if (type === 'ellipse' && obj instanceof fabric.Ellipse) {
    const rx = (obj.rx ?? 0) as number
    const ry = (obj.ry ?? 0) as number
    Object.assign(updates, {
      width: round2(pxToMm(rx * 2 * scaleX, dpi)),
      height: round2(pxToMm(ry * 2 * scaleY, dpi)),
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
    })
  }
  if ((type === 'variable' || type === 'barcode') && obj instanceof fabric.Text) {
    if (type === 'variable') {
      const s = (obj.text ?? '') as string
      const colonIdx = s.indexOf(':')
      Object.assign(updates, {
        label: colonIdx >= 0 ? s.slice(0, colonIdx + 1) : s,
        sampleValue: colonIdx >= 0 ? s.slice(colonIdx + 1).trim() : '',
      })
    } else {
      Object.assign(updates, { content: (obj.text ?? '') as string })
    }
  }
  if (type === 'image' && obj instanceof fabric.Object) {
    const src = obj.get('src')
    ;(updates as Record<string, unknown>).src = typeof src === 'string' ? src : ''
  }

  return updates
}
