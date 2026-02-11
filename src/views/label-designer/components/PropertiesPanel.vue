<template>
  <div class="properties-panel">
    <div class="panel-header">
      <span class="title">属性</span>
    </div>
    <template v-if="!element">
      <div class="no-selection">
        <p>未选定项目</p>
        <p class="hint">选择设计表面上的一个或多个项目，以编辑其属性。</p>
      </div>
    </template>
    <template v-else>
      <div class="props-body">
        <div class="prop-group">
          <label>名称</label>
          <input :value="element.name" @input="emitUpdate('name', ($event.target as HTMLInputElement).value)" class="prop-input" />
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <label>X (mm)</label>
            <input type="number" step="0.01" :value="round2(element.x)" @input="emitUpdate('x', round2(numberVal($event)))" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>Y (mm)</label>
            <input type="number" step="0.01" :value="round2(element.y)" @input="emitUpdate('y', round2(numberVal($event)))" class="prop-input" />
          </div>
        </div>
        <div class="prop-row" v-if="element.type !== 'barcode' || !isBarcodeQR">
          <div class="prop-group">
            <label>宽 (mm)</label>
            <input type="number" step="0.01" :value="round2(element.width)" @input="emitUpdate('width', round2(numberVal($event)))" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>高 (mm)</label>
            <input type="number" step="0.01" :value="round2(element.height)" @input="emitUpdate('height', round2(numberVal($event)))" class="prop-input" />
          </div>
        </div>
        <div class="prop-group" v-else>
          <label>尺寸 (mm)</label>
          <input type="number" step="0.01" :value="round2(element.width)" @input="emitQRSize(round2(numberVal($event)))" class="prop-input" />
          <p class="prop-hint">QR 码为正方形，宽高一致</p>
        </div>
        <div class="prop-group">
          <label>旋转 (°)</label>
          <input type="number" :value="round2(element.rotation)" @input="emitUpdate('rotation', round2(numberVal($event)))" class="prop-input" min="0" max="360" />
        </div>

        <template v-if="element.type === 'text'">
          <div class="prop-group">
            <label>绑定变量</label>
            <select :value="getCurrentDataField()" @change="emitUpdate('dataField', ($event.target as HTMLSelectElement).value)" class="prop-select">
              <option v-for="opt in bindVariableOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p class="prop-hint">绑定后打印时用 Excel 列替换；不绑定则使用下方固定内容</p>
          </div>
          <div class="prop-group">
            <label>内容</label>
            <input :value="(element as any).content" @input="emitUpdate('content', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>字体</label>
            <select :value="(element as any).fontFamily" @change="emitUpdate('fontFamily', ($event.target as HTMLSelectElement).value)" class="prop-select">
              <option v-for="f in textFontOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
            <p class="prop-hint">ZEBRA 字体对应打印机 ZPL ^A 指令</p>
          </div>
          <div class="prop-row">
            <div class="prop-group">
              <label>字号</label>
              <input type="number" :value="(element as any).fontSize" @input="emitUpdate('fontSize', numberVal($event))" class="prop-input" min="1" max="200" />
            </div>
            <div class="prop-group">
              <label>颜色</label>
              <input type="color" :value="(element as any).color" @input="emitUpdate('color', ($event.target as HTMLInputElement).value)" class="prop-color" />
            </div>
          </div>
          <div class="prop-group">
            <label>对齐</label>
            <select :value="(element as any).textAlign" @change="emitUpdate('textAlign', ($event.target as HTMLSelectElement).value)" class="prop-select">
              <option value="left">左</option>
              <option value="center">中</option>
              <option value="right">右</option>
            </select>
          </div>
          <div class="prop-group checkboxes">
            <label><input type="checkbox" :checked="(element as any).bold" @change="emitUpdate('bold', ($event.target as HTMLInputElement).checked)" /> 粗体</label>
            <label><input type="checkbox" :checked="(element as any).italic" @change="emitUpdate('italic', ($event.target as HTMLInputElement).checked)" /> 斜体</label>
          </div>
        </template>

        <template v-if="element.type === 'rectangle'">
          <div class="prop-group">
            <label>填充</label>
            <input type="color" :value="(element as any).fill" @input="emitUpdate('fill', ($event.target as HTMLInputElement).value)" class="prop-color" />
          </div>
          <div class="prop-group">
            <label>边框</label>
            <input type="color" :value="(element as any).stroke" @input="emitUpdate('stroke', ($event.target as HTMLInputElement).value)" class="prop-color" />
          </div>
          <div class="prop-group">
            <label>边框宽</label>
            <input type="number" :value="(element as any).strokeWidth" @input="emitUpdate('strokeWidth', numberVal($event))" class="prop-input" min="0" />
          </div>
        </template>

        <template v-if="element.type === 'line'">
          <div class="prop-group">
            <label>颜色</label>
            <input type="color" :value="(element as any).stroke" @input="emitUpdate('stroke', ($event.target as HTMLInputElement).value)" class="prop-color" />
          </div>
          <div class="prop-group">
            <label>线宽</label>
            <input type="number" :value="(element as any).strokeWidth" @input="emitUpdate('strokeWidth', numberVal($event))" class="prop-input" min="0" />
          </div>
        </template>

        <template v-if="element.type === 'variable'">
          <div class="prop-group">
            <label>绑定变量</label>
            <select :value="(element as any).dataField" @change="emitUpdate('dataField', ($event.target as HTMLSelectElement).value)" class="prop-select">
              <option v-for="opt in bindVariableOptionsRequired" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="prop-group">
            <label>标签</label>
            <input :value="(element as any).label" @input="emitUpdate('label', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>示例值</label>
            <input :value="(element as any).sampleValue" @input="emitUpdate('sampleValue', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
        </template>

        <template v-if="element.type === 'barcode'">
          <div class="prop-group">
            <label>绑定变量</label>
            <select :value="(element as any).dataField ?? ''" @change="emitUpdate('dataField', ($event.target as HTMLSelectElement).value || undefined)" class="prop-select">
              <option v-for="opt in bindVariableOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p class="prop-hint">绑定后打印时用 Excel 列替换条码内容；不绑定则使用下方内容</p>
          </div>
          <div class="prop-group">
            <label>内容</label>
            <input :value="(element as any).content" @input="emitUpdate('content', ($event.target as HTMLInputElement).value)" class="prop-input" />
          </div>
          <div class="prop-group">
            <label>格式</label>
            <select :value="(element as any).format" @change="onBarcodeFormatChange(($event.target as HTMLSelectElement).value)" class="prop-select">
              <option v-for="opt in barcodeFormatOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <p class="prop-hint">QR 在设计器中显示为二维码；ZPL 输出 ^BQ（QR）或 ^BC（Code 128）</p>
          </div>
        </template>

        <template v-if="element.type === 'image'">
          <div class="prop-group">
            <label>上传图片</label>
            <input
              type="file"
              accept="image/*"
              class="prop-file"
              @change="onImageFileChange"
            />
            <p v-if="(element as any).src" class="prop-hint">已设置图片，可拖拽调整大小</p>
          </div>
        </template>

        <div class="prop-actions">
          <button type="button" class="btn-delete" @click="emitDelete">删除元素</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DesignElement } from '../types'

const BINDABLE_VARIABLE_OPTIONS = ['EPC', 'TID', 'User Data'] as const

/** 文本字体：ZEBRA 对应 ZPL ^A 字体代号 0/D/E */
const textFontOptions = [
  { value: 'ZEBRA 0', label: 'ZEBRA 0（默认）' },
  { value: 'ZEBRA SimSun', label: 'ZEBRA SimSun（宋体）' },
  { value: 'ZEBRA Swiss Unicode', label: 'ZEBRA Swiss Unicode' },
  { value: 'Microsoft YaHei', label: 'Microsoft YaHei（仅设计器）' },
  { value: 'Arial', label: 'Arial（仅设计器）' },
]

/** 条码/二维码格式：Code 128 与 QR 对应 ZPL ^BC / ^BQ */
const barcodeFormatOptions = [
  { value: 'CODE128', label: 'Code 128' },
  { value: 'QR', label: 'QR 二维码' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'EAN13', label: 'EAN-13' },
]

const props = defineProps<{
  element: DesignElement | null
  customVariableNames?: string[]
}>()

/** 绑定变量下拉选项：空（不绑定）+ 用户变量 + RFID（用于文本、条码） */
const bindVariableOptions = computed(() => {
  const custom = props.customVariableNames ?? []
  return [
    { value: '', label: '不绑定' },
    ...custom.map((n) => ({ value: n, label: n })),
    ...BINDABLE_VARIABLE_OPTIONS.map((n) => ({ value: n, label: n })),
  ]
})

/** 变量元素用：必须选一项，无“不绑定” */
const bindVariableOptionsRequired = computed(() => {
  const custom = props.customVariableNames ?? []
  return [
    ...custom.map((n) => ({ value: n, label: n })),
    ...BINDABLE_VARIABLE_OPTIONS.map((n) => ({ value: n, label: n })),
  ]
})

/** 当前条码是否为 QR（QR 码强制正方形） */
const isBarcodeQR = computed(() => {
  if (!props.element || props.element.type !== 'barcode') return false
  const f = ((props.element as any).format ?? '').toUpperCase().replace(/\s/g, '')
  return f === 'QR' || f === 'QRCODE'
})

function getCurrentDataField(): string {
  if (!props.element) return ''
  const el = props.element as { dataField?: string }
  return el.dataField ?? ''
}

const emit = defineEmits<{
  update: [id: string, updates: Partial<DesignElement>]
  delete: [id: string]
}>()

function numberVal(e: Event): number {
  const v = (e.target as HTMLInputElement).value
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function round2(n: number | undefined): number {
  if (n == null || !Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function emitUpdate(key: string, value: unknown) {
  if (!props.element) return
  emit('update', props.element.id, { [key]: value } as Partial<DesignElement>)
}

/** QR 码尺寸：宽高同时更新为同一值 */
function emitQRSize(sizeMm: number) {
  if (!props.element) return
  emit('update', props.element.id, { width: sizeMm, height: sizeMm } as Partial<DesignElement>)
}

/** 条码格式变更：若改为 QR 则强制宽高一致为正方形 */
function onBarcodeFormatChange(format: string) {
  if (!props.element) return
  const f = format.toUpperCase().replace(/\s/g, '')
  const isQR = f === 'QR' || f === 'QRCODE'
  if (isQR) {
    const side = Math.max(props.element.width ?? 0, props.element.height ?? 0)
    emit('update', props.element.id, { format, width: side, height: side } as Partial<DesignElement>)
  } else {
    emitUpdate('format', format)
  }
}

function emitDelete() {
  if (!props.element) return
  if (confirm('确定删除该元素？')) emit('delete', props.element.id)
}

function onImageFileChange(e: Event) {
  const input = (e.target as HTMLInputElement)
  const file = input.files?.[0]
  if (!file || !props.element) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    emit('update', props.element!.id, { src: dataUrl } as Partial<DesignElement>)
  }
  reader.readAsDataURL(file)
  input.value = ''
}
</script>

<style scoped>
@import '../css/properties-panel.css';
</style>
