<template>
  <div class="properties-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <h3>属性</h3>
      <div class="panel-subtitle" v-if="selectedElement">
        {{ elementTitle }}
      </div>
    </div>
    
    <!-- 无选中时的提示 -->
    <div v-if="!selectedElement" class="no-selection">
      <div class="empty-icon">📋</div>
      <p>请选择一个元素进行编辑</p>
    </div>
    
    <!-- 选中元素时的属性编辑 -->
    <div v-else class="properties-content">
      <!-- 基础属性 -->
      <div class="property-section">
        <div class="section-header">
          <span class="section-title">基础属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label class="property-label">名称</label>
            <input
              v-model="selectedElement.name"
              type="text"
              class="property-input"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="property-label">位置 X</label>
            <input
              v-model.number="selectedElement.x"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="property-unit">mm</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">位置 Y</label>
            <input
              v-model.number="selectedElement.y"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="property-unit">mm</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">宽度</label>
            <input
              v-model.number="selectedElement.width"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="property-unit">mm</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">高度</label>
            <input
              v-model.number="selectedElement.height"
              type="number"
              class="property-input"
              @change="updateElement"
            />
            <span class="property-unit">mm</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">旋转</label>
            <input
              v-model.number="selectedElement.rotation"
              type="number"
              class="property-input"
              min="0"
              max="360"
              @change="updateElement"
            />
            <span class="property-unit">°</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">不透明度</label>
            <input
              v-model.number="selectedElement.opacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="property-slider"
              @change="updateElement"
            />
            <span class="property-value">{{ (selectedElement.opacity * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- 文本属性 -->
      <div v-if="selectedElement.type === 'text'" class="property-section">
        <div class="section-header">
          <span class="section-title">文本属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label class="property-label">内容</label>
            <textarea
              v-model="selectedElement.content"
              class="property-textarea"
              rows="3"
              @change="updateElement"
            ></textarea>
          </div>
          
          <div class="property-row">
            <label class="property-label">字体大小</label>
            <input
              v-model.number="selectedElement.fontSize"
              type="number"
              class="property-input"
              min="1"
              max="200"
              @change="updateElement"
            />
            <span class="property-unit">pt</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">字体颜色</label>
            <input
              v-model="selectedElement.color"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="property-label">背景色</label>
            <input
              v-model="selectedElement.backgroundColor"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="property-label">字体</label>
            <select
              v-model="selectedElement.fontFamily"
              class="property-select"
              @change="updateElement"
            >
              <option value="Microsoft YaHei">微软雅黑</option>
              <option value="SimSun">宋体</option>
              <option value="SimHei">黑体</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
          
          <div class="property-row">
            <label class="property-label">对齐方式</label>
            <div class="button-group">
              <button
                v-for="align in textAlignOptions"
                :key="align.value"
                class="align-btn"
                :class="{ active: selectedElement.textAlign === align.value }"
                @click="setTextAlign(align.value)"
                :title="align.label"
              >
                {{ align.icon }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- RFID属性 -->
      <div v-if="selectedElement.type === 'rfid'" class="property-section">
        <div class="section-header">
          <span class="section-title">RFID - {{ selectedElement.label }}</span>
        </div>
        
        <!-- 变量列表 -->
        <div class="rfid-variables">
          <div class="variables-header">
            <h4>变量列表</h4>
            <button class="add-variable-btn" @click="addRfidVariable">
              + 添加新变量
            </button>
          </div>
          
          <div class="variables-list">
            <div 
              v-for="variable in rfidVariables"
              :key="variable.id"
              class="variable-item"
              @click="selectRfidVariable(variable)"
            >
              <div class="variable-icon">{{ variable.icon }}</div>
              <div class="variable-name">{{ variable.name }}</div>
            </div>
          </div>
        </div>
        
        <!-- TID属性 -->
        <div v-if="selectedElement.label === 'TID:'" class="property-group">
          <div class="property-row">
            <label class="property-label">TID值</label>
            <input
              v-model="selectedElement.tid"
              type="text"
              class="property-input"
              placeholder="387656779876543212345678"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="property-label">数据格式</label>
            <select
              v-model="selectedElement.dataFormat"
              class="property-select"
              @change="updateElement"
            >
              <option value="hex">16进制编码字符串</option>
              <option value="ascii">ASCII编码字符串</option>
            </select>
          </div>
          
          <div class="property-row">
            <label class="property-label">数据字段说明</label>
            <div class="property-desc">
              数据字段内容可以包含最多 24 个十六进制字符 (0-F)。
            </div>
          </div>
          
          <!-- 预览 -->
          <div class="property-row">
            <label class="property-label">预览</label>
            <div class="rfid-preview">
              {{ selectedElement.tid || '????????????' }}
            </div>
          </div>
          
          <!-- 数据抽取 -->
          <div class="property-section">
            <div class="section-header">
              <span class="section-title">数据抽取</span>
            </div>
            
            <div class="property-group">
              <div class="property-row">
                <label class="property-label">选择字节(S)</label>
                <input
                  v-model.number="selectedElement.selectByte"
                  type="number"
                  class="property-input"
                  min="0"
                  max="255"
                  @change="updateElement"
                />
              </div>
              
              <div class="property-row">
                <label class="property-label">选择块(B)</label>
                <input
                  v-model.number="selectedElement.selectBlock"
                  type="number"
                  class="property-input"
                  min="0"
                  max="255"
                  @change="updateElement"
                />
              </div>
              
              <div class="data-extraction">
                <div class="extraction-header">
                  <span>起始字节(T)</span>
                  <span>字节长度(L)</span>
                </div>
                <div class="extraction-values">
                  <input
                    v-model.number="selectedElement.startByte"
                    type="number"
                    class="extraction-input"
                    min="1"
                    @change="updateElement"
                  />
                  <input
                    v-model.number="selectedElement.byteLength"
                    type="number"
                    class="extraction-input"
                    min="1"
                    max="24"
                    @change="updateElement"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 样式设置 -->
        <div class="property-section">
          <div class="section-header">
            <span class="section-title">样式设置</span>
          </div>
          
          <div class="property-group">
            <div class="property-row">
              <label class="property-label">文本颜色</label>
              <input
                v-model="selectedElement.textColor"
                type="color"
                class="property-color"
                @change="updateElement"
              />
            </div>
            
            <div class="property-row">
              <label class="property-label">背景色</label>
              <input
                v-model="selectedElement.backgroundColor"
                type="color"
                class="property-color"
                @change="updateElement"
              />
            </div>
            
            <div class="property-row">
              <label class="property-label">边框颜色</label>
              <input
                v-model="selectedElement.borderColor"
                type="color"
                class="property-color"
                @change="updateElement"
              />
            </div>
            
            <div class="property-row">
              <label class="property-label">显示标签</label>
              <input
                v-model="selectedElement.showLabel"
                type="checkbox"
                class="property-checkbox"
                @change="updateElement"
              />
            </div>
            
            <div v-if="selectedElement.showLabel" class="property-row">
              <label class="property-label">标签文本</label>
              <input
                v-model="selectedElement.label"
                type="text"
                class="property-input"
                @change="updateElement"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 矩形属性 -->
      <div v-if="selectedElement.type === 'rectangle'" class="property-section">
        <div class="section-header">
          <span class="section-title">矩形属性</span>
        </div>
        
        <div class="property-group">
          <div class="property-row">
            <label class="property-label">填充色</label>
            <input
              v-model="selectedElement.fill"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="property-label">边框颜色</label>
            <input
              v-model="selectedElement.stroke"
              type="color"
              class="property-color"
              @change="updateElement"
            />
          </div>
          
          <div class="property-row">
            <label class="property-label">边框宽度</label>
            <input
              v-model.number="selectedElement.strokeWidth"
              type="number"
              class="property-input"
              min="0"
              max="10"
              @change="updateElement"
            />
            <span class="property-unit">px</span>
          </div>
          
          <div class="property-row">
            <label class="property-label">边框样式</label>
            <select
              v-model="selectedElement.strokeStyle"
              class="property-select"
              @change="updateElement"
            >
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
              <option value="double">双线</option>
              <option value="none">无边框</option>
            </select>
          </div>
          
          <div class="property-row">
            <label class="property-label">圆角半径</label>
            <input
              v-model.number="selectedElement.cornerRadius"
              type="number"
              class="property-input"
              min="0"
              max="100"
              @change="updateElement"
            />
            <span class="property-unit">px</span>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="property-section actions-section">
        <div class="property-group">
          <button class="action-btn apply-btn" @click="applyChanges">
            应用更改
          </button>
          <button class="action-btn delete-btn" @click="deleteSelectedElement">
            删除元素
          </button>
          <button class="action-btn lock-btn" @click="toggleLock">
            {{ selectedElement.locked ? '解锁' : '锁定' }}
          </button>
          <button class="action-btn visibility-btn" @click="toggleVisibility">
            {{ selectedElement.visible ? '隐藏' : '显示' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDesignerStore } from '../stores/designer-store'
import { TextAlign } from '../types/elements'

const store = useDesignerStore()

// 计算属性
const selectedElement = computed(() => store.selectedElement)
const elementTitle = computed(() => {
  if (!selectedElement.value) return ''
  return `${selectedElement.value.type.toUpperCase()} - ${selectedElement.value.name}`
})

// 文本对齐选项
const textAlignOptions = ref([
  { value: TextAlign.LEFT, label: '左对齐', icon: '⇤' },
  { value: TextAlign.CENTER, label: '居中', icon: '☰' },
  { value: TextAlign.RIGHT, label: '右对齐', icon: '⇥' },
  { value: TextAlign.JUSTIFY, label: '两端对齐', icon: '⇔' }
])

// RFID变量
const rfidVariables = ref([
  { id: 'rfid_mark', name: 'RFID 标记', icon: '🏷️', type: 'mark' },
  { id: 'epc', name: 'EPC', icon: '📊', type: 'epc' },
  { id: 'tid', name: 'TID', icon: '🏷️', type: 'tid' },
  { id: 'user_data', name: 'User Data', icon: '📝', type: 'user_data' }
])

// 方法
const updateElement = () => {
  if (selectedElement.value) {
    store.updateElement(selectedElement.value.id, { ...selectedElement.value })
  }
}

const setTextAlign = (align: TextAlign) => {
  if (selectedElement.value && selectedElement.value.type === 'text') {
    store.updateElement(selectedElement.value.id, { textAlign: align })
  }
}

const deleteSelectedElement = () => {
  if (selectedElement.value) {
    store.deleteElement(selectedElement.value.id)
  }
}

const toggleLock = () => {
  if (selectedElement.value) {
    store.updateElement(selectedElement.value.id, { 
      locked: !selectedElement.value.locked 
    })
  }
}

const toggleVisibility = () => {
  if (selectedElement.value) {
    store.updateElement(selectedElement.value.id, { 
      visible: !selectedElement.value.visible 
    })
  }
}

const applyChanges = () => {
  updateElement()
  // 可以添加一些反馈，比如显示"已应用更改"
}

const addRfidVariable = () => {
  console.log('添加RFID变量')
  // TODO: 实现添加RFID变量逻辑
}

const selectRfidVariable = (variable: any) => {
  console.log('选择RFID变量:', variable)
  // TODO: 实现选择RFID变量逻辑
}
</script>

<style scoped>
@import '../css/properties-panel.scss';
</style>