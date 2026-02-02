import * as fabric from 'fabric'
import type { DesignElement } from '../types'
import { ElementType } from '../types'

// 毫米转像素
export const mmToPx = (mm: number, dpi: number = 300): number => {
  // 1英寸 = 25.4毫米, DPI = 每英寸像素数
  return (mm / 25.4) * dpi
}

// 像素转毫米
export const pxToMm = (px: number, dpi: number = 300): number => {
  return (px / dpi) * 25.4
}

// 创建文本元素
export const createTextElement = (config: any): fabric.Text => {
  return new fabric.Text(config.content || '文本', {
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    fontSize: config.fontSize || 12,
    fill: config.color || '#000000',
    fontFamily: config.fontFamily || 'Arial',
    textAlign: config.textAlign || 'left',
    fontWeight: config.bold ? 'bold' : 'normal',
    fontStyle: config.italic ? 'italic' : 'normal',
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top'
  })
}

// 创建矩形元素
export const createRectElement = (config: any): fabric.Rect => {
  return new fabric.Rect({
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    width: mmToPx(config.width || 50),
    height: mmToPx(config.height || 30),
    fill: config.fill || '#ffffff',
    stroke: config.stroke || '#000000',
    strokeWidth: config.strokeWidth || 1,
    rx: config.cornerRadius || 0,
    ry: config.cornerRadius || 0,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top'
  })
}

// 创建RFID元素（组）
export const createRfidElement = (config: any): fabric.Group => {
  const text = new fabric.Text(config.tid || 'TID: 387656779876543212345678', {
    left: 10,
    top: 10,
    fontSize: 12,
    fill: config.textColor || '#000000',
    fontFamily: 'Arial'
  })
  
  const background = new fabric.Rect({
    width: text.width! + 20,
    height: text.height! + 20,
    fill: config.bgColor || '#f0f0f0',
    stroke: '#cccccc',
    strokeWidth: 1
  })
  
  return new fabric.Group([background, text], {
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top'
  })
}

// 根据元素类型创建fabric对象
export const createFabricObject = (element: DesignElement, dpi: number = 300): fabric.Object => {
  // 将dpi添加到element配置中
  const elementWithDpi = { ...element, dpi };
  
  switch (element.type) {
    case ElementType.TEXT:
      return createTextElement(elementWithDpi)
    case ElementType.RECTANGLE:
      return createRectElement(elementWithDpi)
    case ElementType.RFID:
      return createRfidElement(elementWithDpi)
    default:
      // 处理其他类型如IMAGE、BARCODE等或作为文本元素处理
      return createTextElement(elementWithDpi)
  }
}
