<template>
  <div class="connect-print">
    <!-- 左侧：本地打印机（固定） -->
    <aside class="left-printer-sidebar">
      <div class="panel-header">
        <h3>本地打印机</h3>
        <div class="search-box">
          <input
            v-model="printerSearch"
            type="text"
            placeholder="搜索打印机名称..."
          />
        </div>
      </div>
      <div class="printer-list">
        <div v-if="localPrinters.length === 0" class="empty-printers">
          <span class="empty-icon">🖨️</span>
          <p>暂无打印机</p>
          <p class="hint">请确保已安装打印插件并点击「刷新打印机列表」获取本地打印机</p>
        </div>
        <div
          v-for="p in filteredPrinters"
          :key="p.id"
          class="printer-item"
          :class="{ active: selectedPrinter?.id === p.id }"
          @click="selectPrinter(p)"
        >
          <span class="printer-icon">🖨️</span>
          <div class="printer-info">
            <span class="printer-name">{{ p.name }}</span>
            <span v-if="p.address" class="printer-address">{{ p.address }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主内容 -->
    <div class="right-content">
      <!-- 顶部：连接信息 -->
      <section class="connection-bar">
        <h2 class="section-title">连接信息</h2>
        <div class="connection-form">
          <div class="connection-type">
            <label>连接方式</label>
            <div class="type-options">
              <label class="radio-label">
                <input v-model="connectionType" type="radio" value="usb" />
                <span>USB</span>
              </label>
              <label class="radio-label">
                <input v-model="connectionType" type="radio" value="tcp" />
                <span>TCP/IP（内网打印机）</span>
              </label>
            </div>
          </div>

          <div v-if="connectionType === 'usb'" class="config-row config-usb">
            <div class="field">
              <label>设备/端口</label>
              <input v-model="config.usb.port" type="text" placeholder="例如：COM3、/dev/usb/lp0" />
            </div>
            <div class="field">
              <label>厂商/型号（可选）</label>
              <input v-model="config.usb.vendor" type="text" placeholder="可选" />
            </div>
          </div>

          <div v-if="connectionType === 'tcp'" class="config-row config-tcp">
            <div class="field">
              <label>IP 地址</label>
              <input v-model="config.tcp.host" type="text" placeholder="例如：192.168.1.100" />
            </div>
            <div class="field">
              <label>端口</label>
              <input v-model="config.tcp.port" type="text" placeholder="9100" />
            </div>
            <div class="field">
              <label>超时（秒）</label>
              <input v-model.number="config.tcp.timeout" type="number" placeholder="5" min="1" />
            </div>
          </div>

          <div class="connection-actions">
            <button type="button" class="btn-primary" @click="applyConnection">应用连接</button>
            <button type="button" class="btn-secondary" @click="refreshPrinters">刷新打印机列表</button>
          </div>
        </div>
      </section>

      <!-- 选择模板（复用模板设置接口） -->
      <section class="template-section">
        <h3 class="subsection-title">选择模板</h3>
        <div class="template-toolbar">
          <select
            v-model="selectedTemplateId"
            class="template-select"
            @change="onTemplateChange"
          >
            <option value="">请选择模板</option>
            <option v-for="t in templateList" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
          <button type="button" class="btn-secondary btn-sm" @click="loadTemplateList">
            刷新列表
          </button>
        </div>
        <p v-if="selectedTemplateId && templateVariables.length > 0" class="template-hint">
          当前模板可填变量：{{ templateVariables.join('、') }}
        </p>
        <p v-else-if="selectedTemplateId" class="template-hint text-muted">
          该模板暂无变量占位
        </p>
      </section>

      <!-- 批量填入变量：Excel 导入 + 表头/数据左侧，可填变量右侧，中间右侧留空 -->
      <section class="batch-vars-section">
        <h3 class="subsection-title">批量填入变量</h3>
        <div class="batch-toolbar">
          <label class="btn-secondary file-label">
            <input
              ref="excelInputRef"
              type="file"
              accept=".xlsx,.xls"
              class="file-input"
              @change="onExcelFileChange"
            />
            导入 Excel
          </label>
          <span v-if="excelFileName" class="file-name">{{ excelFileName }}</span>
        </div>

        <div class="batch-grid">
          <!-- 左侧：表头 + 对应数据 -->
          <div class="batch-left">
            <div class="batch-left-header">Excel 表头 / 数据</div>
            <div class="batch-left-body">
              <div v-if="excelHeaders.length === 0" class="empty-data">
                <p>请先导入 Excel 文件</p>
              </div>
              <div v-else class="data-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th v-for="h in excelHeaders" :key="h" class="th-cell">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in excelRows" :key="ri">
                      <td v-for="h in excelHeaders" :key="h" class="td-cell">
                        {{ row[h] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 右侧：可填入的变量 -->
          <div class="batch-right">
            <div class="batch-right-header">可填入的变量</div>
            <div class="batch-right-body">
              <div v-if="templateVariables.length === 0" class="empty-vars">
                <p>请先选择模板，模板中的变量将显示在此</p>
              </div>
              <ul v-else class="var-list">
                <li v-for="v in templateVariables" :key="v" class="var-item">{{ v }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 列绑定：每个可填变量选择对应的 Excel 列 -->
        <div v-if="templateVariables.length > 0 && excelHeaders.length > 0" class="binding-section">
          <h4 class="zpl-section-title">列绑定</h4>
          <p class="simulate-desc">将模板中的可填变量与 Excel 表头列绑定，用于替换 ZPL 占位符。</p>
          <div class="binding-table-wrap">
            <table class="binding-table">
              <thead>
                <tr>
                  <th>变量名</th>
                  <th>绑定 Excel 列</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="varName in templateVariables" :key="varName">
                  <td class="binding-var-name">{{ varName }}</td>
                  <td>
                    <select
                      :value="variableToColumn[varName] || ''"
                      class="binding-select"
                      @change="onBindingChange(varName, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="">— 不绑定 —</option>
                      <option v-for="h in excelHeaders" :key="h" :value="h">{{ h }}</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 生成的 ZPL：放在 Excel 展示区下方 -->
        <div class="zpl-section">
          <h4 class="zpl-section-title">生成的 ZPL</h4>
          <div class="zpl-area">
            <template v-if="currentTemplateZPL">
              <textarea
                :value="currentTemplateZPL"
                class="zpl-textarea"
                readonly
                spellcheck="false"
              />
              <button type="button" class="btn-secondary btn-sm copy-zpl-btn" @click="copyZPL">
                复制 ZPL
              </button>
            </template>
            <p v-else class="text-muted">选择模板后将根据设计生成 ZPL 指令（变量、条码均为可填变量，占位符用 Excel 数据替换）</p>
          </div>
        </div>

        <!-- 模拟数据：用列绑定 + 所选 Excel 行替换占位符，展示实际将发送的 ZPL -->
        <div class="zpl-section simulate-section">
          <h4 class="zpl-section-title">模拟数据</h4>
          <p class="simulate-desc">根据上方「列绑定」与所选行，将占位符替换为 Excel 数据，用于预览实际发送的 ZPL。</p>
          <div class="simulate-toolbar">
            <label class="simulate-row-label">
              使用第
              <select v-model.number="simulateRowIndex" class="simulate-row-select">
                <option v-for="(_, idx) in excelRows" :key="idx" :value="idx">
                  {{ idx + 1 }} 行
                </option>
                <option v-if="excelRows.length === 0" :value="0">—</option>
              </select>
              行数据
            </label>
          </div>
          <div class="zpl-area">
            <template v-if="currentTemplateZPL && excelRows.length > 0">
              <textarea
                :value="simulatedZPL"
                class="zpl-textarea"
                readonly
                spellcheck="false"
              />
              <button type="button" class="btn-secondary btn-sm copy-zpl-btn" @click="copySimulatedZPL">
                复制模拟 ZPL
              </button>
            </template>
            <p v-else-if="currentTemplateZPL && excelRows.length === 0" class="text-muted">
              请先导入 Excel，即可用表头对应列的数据替换占位符并预览
            </p>
            <p v-else class="text-muted">请先选择模板并导入 Excel 后查看模拟数据</p>
          </div>
        </div>
      </section>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import {
  getTemplateList,
  loadTemplate,
  type TemplateListItem,
  type LoadedTemplate,
} from '@/views/label-designer/services/api'
import {
  templateToZPL,
  collectFillableVariables,
  buildImageZPLCache,
  substituteVariables,
} from './utils/zpl-generator'

type ConnectionType = 'usb' | 'tcp'

interface PrinterItem {
  id: string
  name: string
  address?: string
}

const connectionType = ref<ConnectionType>('tcp')
const config = reactive({
  usb: { port: '', vendor: '' },
  tcp: { host: '192.168.1.100', port: '9100', timeout: 5 },
})

const printerSearch = ref('')
const localPrinters = ref<PrinterItem[]>([])
const selectedPrinter = ref<PrinterItem | null>(null)

const templateList = ref<TemplateListItem[]>([])
const selectedTemplateId = ref('')
const loadedTemplate = ref<LoadedTemplate | null>(null)
const templateVariables = ref<string[]>([])
const currentTemplateZPL = ref('')
const loading = ref(false)
/** 模拟数据使用的 Excel 行索引（0-based） */
const simulateRowIndex = ref(0)
/** 变量名 → Excel 列名（表头）的绑定 */
const variableToColumn = reactive<Record<string, string>>({})

const excelInputRef = ref<HTMLInputElement | null>(null)
const excelFileName = ref('')
const excelHeaders = ref<string[]>([])
const excelRows = ref<Record<string, string | number>[]>([])

const filteredPrinters = computed(() => {
  const q = printerSearch.value.trim().toLowerCase()
  if (!q) return localPrinters.value
  return localPrinters.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.address && p.address.toLowerCase().includes(q))
  )
})

/** 模拟数据：用列绑定 + 所选 Excel 行替换 ZPL 占位符后的结果 */
const simulatedZPL = computed(() => {
  const zpl = currentTemplateZPL.value
  if (!zpl) return ''
  const rows = excelRows.value
  if (!rows.length) return zpl
  const idx = Math.min(simulateRowIndex.value, rows.length - 1)
  const row = rows[idx]
  if (!row) return zpl
  const vars: Record<string, string | number> = {}
  for (const varName of templateVariables.value) {
    const col = variableToColumn[varName]
    if (col && col.trim() && col in row) vars[varName] = row[col]
  }
  return substituteVariables(zpl, vars)
})

async function loadTemplateList() {
  try {
    loading.value = true
    templateList.value = await getTemplateList()
  } catch (e) {
    console.error(e)
    templateList.value = []
    alert('加载模板列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function onBindingChange(varName: string, columnName: string) {
  variableToColumn[varName] = columnName
}

async function onTemplateChange() {
  const id = selectedTemplateId.value
  if (!id) {
    loadedTemplate.value = null
    templateVariables.value = []
    currentTemplateZPL.value = ''
    Object.keys(variableToColumn).forEach((k) => { variableToColumn[k] = '' })
    return
  }
  try {
    loading.value = true
    loadedTemplate.value = await loadTemplate(id)
    const t = loadedTemplate.value
    templateVariables.value = collectFillableVariables(t.elements)
    const imageZPLCache = await buildImageZPLCache(t.elements, t.config)
    currentTemplateZPL.value = templateToZPL(t.config, t.elements, {
      variablePlaceholder: true,
      imageZPLCache,
    })
  } catch (e) {
    console.error(e)
    loadedTemplate.value = null
    templateVariables.value = []
    currentTemplateZPL.value = ''
    alert('加载模板详情失败')
  } finally {
    loading.value = false
  }
}

function applyConnection() {
  if (connectionType.value === 'usb') {
    console.log('应用 USB 连接', config.usb)
  } else {
    console.log('应用 TCP 连接', config.tcp)
  }
}

function refreshPrinters() {
  localPrinters.value = []
  console.log('刷新打印机列表（需配合插件实现）')
}

function selectPrinter(p: PrinterItem) {
  selectedPrinter.value = p
}

function copyZPL() {
  const zpl = currentTemplateZPL.value
  if (!zpl) return
  navigator.clipboard.writeText(zpl).then(
    () => alert('ZPL 已复制到剪贴板'),
    () => alert('复制失败，请手动选择文本框内容复制')
  )
}

function copySimulatedZPL() {
  const zpl = simulatedZPL.value
  if (!zpl) return
  navigator.clipboard.writeText(zpl).then(
    () => alert('模拟 ZPL 已复制到剪贴板'),
    () => alert('复制失败，请手动选择文本框内容复制')
  )
}

function onExcelFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  excelFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = ev.target?.result
      if (!data) return
      const wb = XLSX.read(data, { type: 'binary' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      if (!firstSheet) {
        excelHeaders.value = []
        excelRows.value = []
        return
      }
      const json: unknown[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      if (json.length === 0) {
        excelHeaders.value = []
        excelRows.value = []
        return
      }
      const first = json[0] as Record<string, string | number>
      const headers = Object.keys(first)
      const rows = json.map((row) => ({ ...(row as Record<string, string | number>) }))
      excelHeaders.value = headers
      excelRows.value = rows
    } catch (err) {
      console.error(err)
      alert('解析 Excel 失败，请检查文件格式')
      excelHeaders.value = []
      excelRows.value = []
    }
  }
  reader.readAsBinaryString(file)
  input.value = ''
}

onMounted(loadTemplateList)
</script>

<style scoped>
@import './css/connect-print.css';
</style>
