import * as fabric from 'fabric'
import type { DesignElement } from '../types'
import { ElementType } from '../types'

// 毫米转像素
export const mmToPx = (mm: number, dpi: number = 300): number => {
  return (mm / 25.4) * dpi
}

// 像素转毫米
export const pxToMm = (px: number, dpi: number = 300): number => {
  return (px / dpi) * 25.4
}

// 创建文本元素
export const createTextElement = (config: any): fabric.Text => {
  const text = new fabric.Text(config.content || '文本', {
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
    originY: 'top',
    lockUniScaling: false, // 允许自由缩放
    lockScalingFlip: true, // 禁止翻转
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })

  // 存储元素ID
  text.set('elementId', config.id)
  text.set('type', ElementType.TEXT)

  return text
}

// 创建矩形元素
export const createRectElement = (config: any): fabric.Rect => {
  const rect = new fabric.Rect({
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
    originY: 'top',
    lockScalingY: false, // 允许垂直缩放
    lockScalingX: false, // 允许水平缩放
    lockScalingFlip: true, // 禁止翻转
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })

  rect.set('elementId', config.id)
  rect.set('type', ElementType.RECTANGLE)

  return rect
}

// 创建条形码元素
export const createBarcodeElement = (config: any): fabric.Group => {
  // 根据条码类型生成条码图案
  const barcodeContent = config.content || config.data || '123456789012'
  const format = config.format || 'CODE128'
  
  // 计算条码宽度和高度
  const barcodeWidth = mmToPx(config.width || 100)
  const barcodeHeight = mmToPx(config.height || 20)
  
  // 创建条码图案（简化版）
  const bars: fabric.Rect[] = []
  
  // 简单的条码生成逻辑：将内容转换为二进制，然后生成黑白条纹
  // 这里使用简化的算法，实际应用中应该使用专业的条码库
  const contentStr = barcodeContent.toString()
  const barCount = Math.min(contentStr.length * 2, 50) // 最多50个条纹
  
  const barWidth = barcodeWidth / barCount
  let xPosition = 0
  
  for (let i = 0; i < barCount; i++) {
    // 根据位置和内容决定条纹宽度和颜色
    const isBlack = (i % 3 === 0) || (contentStr.charCodeAt(i % contentStr.length) % 2 === 0)
    
    // 条纹宽度变化
    const width = barWidth * (0.5 + Math.sin(i * 0.5) * 0.3)
    
    const bar = new fabric.Rect({
      left: xPosition,
      top: 0,
      width: width,
      height: barcodeHeight,
      fill: isBlack ? '#000000' : '#ffffff',
      selectable: false, // 子元素不可选，避免点击问题
      hasControls: false,
      hasBorders: false,
      originX: 'left',
      originY: 'top'
    })
    
    bars.push(bar)
    xPosition += width
  }
  
  // 创建条码组
  const barcodeGroup = new fabric.Group(bars, {
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    selectable: true, // 组本身可选
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top',
    lockScalingFlip: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })
  
  barcodeGroup.set('elementId', config.id)
  barcodeGroup.set('type', ElementType.BARCODE)
  
  return barcodeGroup
}

// 创建二维码元素
export const createQrCodeElement = (config: any): fabric.Rect => {
  // 二维码暂时用矩形表示，后续可以替换为真正的二维码生成器
  const qrRect = new fabric.Rect({
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    width: mmToPx(config.width || 30),
    height: mmToPx(config.height || 30),
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 1,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top',
    lockScalingY: false,
    lockScalingX: false,
    lockScalingFlip: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })

  qrRect.set('elementId', config.id)
  qrRect.set('type', ElementType.QRCODE)

  return qrRect
}

// 创建圆形元素
export const createCircleElement = (config: any): fabric.Circle => {
  const circle = new fabric.Circle({
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    radius: mmToPx(Math.min(config.width, config.height) / 2 || 15),
    fill: config.fillColor || '#ffffff',
    stroke: config.strokeColor || '#000000',
    strokeWidth: config.strokeWidth || 1,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top',
    lockScalingFlip: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })

  circle.set('elementId', config.id)
  circle.set('type', ElementType.CIRCLE)

  return circle
}

// 创建RFID元素（组）
export const createRfidElement = (config: any): fabric.Group => {
  const textContent = config.showLabel 
    ? `${config.label || 'TID:'} ${config.tid || '387656779876543212345678'}`
    : config.tid || '387656779876543212345678'
  
  const text = new fabric.Text(textContent, {
    left: 10,
    top: 10,
    fontSize: 12,
    fill: config.textColor || '#000000',
    fontFamily: 'Arial',
    originX: 'left',
    originY: 'top'
  })
  
  const background = new fabric.Rect({
    width: text.width! + 20,
    height: text.height! + 20,
    fill: config.bgColor || '#f0f0f0',
    stroke: '#cccccc',
    strokeWidth: 1,
    originX: 'left',
    originY: 'top'
  })
  
  const group = new fabric.Group([background, text], {
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top',
    lockScalingY: false, // 允许垂直缩放
    lockScalingX: false, // 允许水平缩放
    lockScalingFlip: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })
  
  group.set('elementId', config.id)
  group.set('type', ElementType.RFID)
  
  return group
}

// 创建图片元素
export const createImageElement = (config: any): fabric.Image => {
  // 创建一个占位符图片，实际使用时需要从URL加载
  const image = new fabric.Image('', {
    left: mmToPx(config.x || 0),
    top: mmToPx(config.y || 0),
    width: mmToPx(config.width || 50),
    height: mmToPx(config.height || 50),
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top',
    lockScalingFlip: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })

  // 存储元素ID和类型
  image.set('elementId', config.id)
  image.set('type', ElementType.IMAGE)

  return image
}

// 创建线条元素
export const createLineElement = (config: any): fabric.Line => {
  const line = new fabric.Line([
    mmToPx(config.x1 || 0),
    mmToPx(config.y1 || 0),
    mmToPx(config.x2 || 50),
    mmToPx(config.y2 || 0)
  ], {
    stroke: config.stroke || '#000000',
    strokeWidth: config.strokeWidth || 1,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'left',
    originY: 'top',
    lockUniScaling: false, // 允许自由缩放
    lockScalingFlip: true, // 禁止翻转
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    cornerStyle: 'circle',
    cornerColor: '#2196f3',
    cornerSize: 8,
    transparentCorners: false
  })

  line.set('elementId', config.id)
  line.set('type', ElementType.LINE)

  return line
}

// 根据元素类型创建fabric对象
export const createFabricObject = (element: DesignElement, dpi: number = 300): fabric.Object => {
  const elementWithDpi = { ...element, dpi };
  
  switch (element.type) {
    case ElementType.TEXT:
      return createTextElement(elementWithDpi)
    case ElementType.RECTANGLE:
      return createRectElement(elementWithDpi)
    case ElementType.LINE:
      return createLineElement(elementWithDpi)
    case ElementType.BARCODE:
      return createBarcodeElement(elementWithDpi)
    case ElementType.QRCODE:
      return createQrCodeElement(elementWithDpi)
    case ElementType.CIRCLE:
      return createCircleElement(elementWithDpi)
    case ElementType.RFID:
      return createRfidElement(elementWithDpi)
    case ElementType.IMAGE:
      return createImageElement(elementWithDpi)
    default:
      // 处理未知类型，回退到文本元素
      console.warn(`⚠️ 未知元素类型: ${element.type}, 使用文本元素替代`)
      return createTextElement({ ...elementWithDpi, content: `[${element.type}] ${element.name || '未知元素'}` })
  }
}

// 更新fabric对象的属性（不重新创建对象）
export const updateFabricObject = (obj: fabric.Object, element: DesignElement, dpi: number = 300) => {
  // 基础属性
  obj.set({
    left: mmToPx(element.x, dpi),
    top: mmToPx(element.y, dpi),
    angle: element.rotation || 0,
    visible: element.visible !== false
  })
  
  // 根据类型更新特定属性
  switch (element.type) {
    case ElementType.TEXT:
      if (obj instanceof fabric.Text) {
        const textElement = element as any
        obj.set({
          text: textElement.content || '文本',
          fontSize: textElement.fontSize || 12,
          fill: textElement.color || '#000000',
          fontFamily: textElement.fontFamily || 'Arial',
          textAlign: textElement.textAlign || 'left',
          fontWeight: textElement.bold ? 'bold' : 'normal',
          fontStyle: textElement.italic ? 'italic' : 'normal'
        })
      }
      break
      
    case ElementType.RECTANGLE:
      if (obj instanceof fabric.Rect) {
        const rectElement = element as any
        obj.set({
          width: mmToPx(element.width, dpi),
          height: mmToPx(element.height, dpi),
          fill: rectElement.fill || '#ffffff',
          stroke: rectElement.stroke || '#000000',
          strokeWidth: rectElement.strokeWidth || 1,
          rx: rectElement.cornerRadius || 0,
          ry: rectElement.cornerRadius || 0
        })
      }
      break
      
    case ElementType.LINE:
      if (obj instanceof fabric.Line) {
        const lineElement = element as any
        obj.set({
          x1: mmToPx(lineElement.x1, dpi),
          y1: mmToPx(lineElement.y1, dpi),
          x2: mmToPx(lineElement.x2, dpi),
          y2: mmToPx(lineElement.y2, dpi),
          stroke: lineElement.stroke || '#000000',
          strokeWidth: lineElement.strokeWidth || 1
        })
      }
      break
      
    case ElementType.BARCODE:
      // 条码元素是组
      if (obj instanceof fabric.Group) {
        const barcodeElement = element as any
        // 更新基础尺寸
        obj.set({
          width: mmToPx(element.width, dpi),
          height: mmToPx(element.height, dpi)
        })
        
        // 如果有子元素，更新子元素的尺寸
        if (obj._objects && obj._objects.length > 0) {
          const barcodeWidth = mmToPx(element.width, dpi)
          const barcodeHeight = mmToPx(element.height, dpi)
          
          obj._objects.forEach((bar, index) => {
            if (bar instanceof fabric.Rect) {
              // 简单的条码更新逻辑
              const barCount = Math.min((barcodeElement.content || '').length * 2, 50)
              const barWidth = barcodeWidth / barCount
              const xPosition = index * barWidth
              
              bar.set({
                left: xPosition,
                top: 0,
                width: barWidth,
                height: barcodeHeight
              })
            }
          })
        }
      }
      break
      
    case ElementType.QRCODE:
      if (obj instanceof fabric.Rect) {
        obj.set({
          width: mmToPx(element.width, dpi),
          height: mmToPx(element.height, dpi),
          fill: '#000000',
          stroke: '#000000',
          strokeWidth: 1
        })
      }
      break
      
    case ElementType.CIRCLE:
      if (obj instanceof fabric.Circle) {
        const circleElement = element as any
        obj.set({
          radius: mmToPx(Math.min(element.width, element.height) / 2, dpi),
          fill: circleElement.fillColor || '#ffffff',
          stroke: circleElement.strokeColor || '#000000',
          strokeWidth: circleElement.strokeWidth || 1
        })
      }
      break
      
    case ElementType.RFID:
      if (obj instanceof fabric.Group) {
        const rfidElement = element as any
        const background = (obj as fabric.Group).item(0) as fabric.Rect
        const text = (obj as fabric.Group).item(1) as fabric.Text
        
        if (background && text) {
          const textContent = rfidElement.showLabel 
            ? `${rfidElement.label || 'TID:'} ${rfidElement.tid || '387656779876543212345678'}`
            : rfidElement.tid || '387656779876543212345678'
          
          text.set({
            text: textContent,
            fill: rfidElement.textColor || '#000000'
          })
          
          background.set({
            fill: rfidElement.bgColor || '#f0f0f0',
            width: text.width! + 20,
            height: text.height! + 20
          })
          
          // 更新组尺寸
          obj.set({
            width: text.width! + 20,
            height: text.height! + 20
          })
        }
      }
      break
      
    case ElementType.IMAGE:
      if (obj instanceof fabric.Image) {
        const imageElement = element as any
        obj.set({
          width: mmToPx(element.width, dpi),
          height: mmToPx(element.height, dpi)
        })
        
        // 如果有图片源，可以更新图片
        if (imageElement.src && imageElement.src !== '') {
          // 注意：实际图片加载需要异步处理，这里只设置基本属性
          // 实际应用中可能需要重新加载图片
        }
      }
      break
  }
  
  // 设置缩放为1，确保宽度/高度是实际值
  obj.set({
    scaleX: 1,
    scaleY: 1,
    width: mmToPx(element.width, dpi),
    height: mmToPx(element.height, dpi)
  })
  
  // 更新控制点和坐标
  obj.setCoords()
}

// 从fabric对象获取元素数据
export const getElementFromFabricObject = (obj: fabric.Object, dpi: number = 300): Partial<DesignElement> => {
  const elementId = obj.get('elementId')
  if (!elementId) return {}
  
  // 获取基本变换信息
  const left = obj.left || 0
  const top = obj.top || 0
  const width = obj.width || 0
  const height = obj.height || 0
  const scaleX = obj.scaleX || 1
  const scaleY = obj.scaleY || 1
  const actualWidth = width * scaleX
  const actualHeight = height * scaleY
  
  const updates: Partial<DesignElement> = {
    id: elementId,
    x: pxToMm(left, dpi),
    y: pxToMm(top, dpi),
    width: pxToMm(actualWidth, dpi),
    height: pxToMm(actualHeight, dpi),
    rotation: obj.angle || 0,
    visible: obj.visible !== false
  }
  
  // 根据类型获取特定属性
  const type = obj.get('type')
  switch (type) {
    case ElementType.TEXT:
      if (obj instanceof fabric.Text) {
        Object.assign(updates, {
          content: obj.text,
          fontSize: obj.fontSize,
          color: obj.fill,
          fontFamily: obj.fontFamily,
          textAlign: obj.textAlign,
          bold: obj.fontWeight === 'bold',
          italic: obj.fontStyle === 'italic'
        })
      }
      break
      
    case ElementType.RECTANGLE:
      if (obj instanceof fabric.Rect) {
        Object.assign(updates, {
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          cornerRadius: obj.rx || 0
        })
      }
      break
      
    case ElementType.LINE:
      if (obj instanceof fabric.Line) {
        Object.assign(updates, {
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          x1: pxToMm(obj.x1, dpi),
          y1: pxToMm(obj.y1, dpi),
          x2: pxToMm(obj.x2, dpi),
          y2: pxToMm(obj.y2, dpi)
        })
      }
      break
      
    case ElementType.BARCODE:
      // 条码元素是组，需要特殊处理
      if (obj instanceof fabric.Group) {
        // 简单的条码内容提取
        Object.assign(updates, {
          content: '123456789012', // 默认值，实际应该从配置中获取
          format: 'CODE128' // 默认格式
        })
      }
      break
      
    case ElementType.IMAGE:
      if (obj instanceof fabric.Image) {
        // 图片元素的src属性需要特殊处理
        Object.assign(updates, {
          src: obj.get('src') || ''
        })
      }
      break
      
    case ElementType.RFID:
      // RFID元素是组，需要通过group获取
      break
  }
  
  return updates
}