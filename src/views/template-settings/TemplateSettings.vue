<template>
  <div class="template-settings">
    <!-- 页面标题和创建按钮 -->
    <div class="page-header">
      <div class="header-content">
        <h1>模板设置</h1>
        <button class="create-template-btn" @click="createTemplate">
          <span class="btn-icon">+</span> 创建模板
        </button>
      </div>
    </div>

    <!-- 模板列表表格 -->
    <div class="template-table-container">
      <table class="template-table">
        <thead>
          <tr>
            <th>模板名称</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="template in templates" :key="template.id">
            <td class="template-name">
              <div class="name-wrapper">
                <span class="template-icon">🏷️</span>
                {{ template.name }}
              </div>
            </td>
            <td class="update-time">{{ template.updateTime }}</td>
            <td class="actions">
              <button class="action-btn edit-btn" @click="editTemplate(template.id)">
                编辑
              </button>
              <button class="action-btn delete-btn" @click="deleteTemplate(template.id)">
                删除
              </button>
            </td>
          </tr>
          <tr v-if="templates.length === 0">
            <td colspan="3" class="empty-state">
              <div class="empty-content">
                <div class="empty-icon">📁</div>
                <p>暂无模板，点击"创建模板"开始创建</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 创建模板对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="create-dialog">
        <div class="dialog-header">
          <h2>创建新模板</h2>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="templateName">模板名称</label>
            <input
              v-model="newTemplate.name"
              type="text"
              id="templateName"
              placeholder="请输入模板名称"
              @keyup.enter="confirmCreate"
            />
          </div>
          <div class="form-group">
            <label for="templateType">模板类型</label>
            <select v-model="newTemplate.type" id="templateType">
              <option value="rfid">RFID标签</option>
              <option value="normal">普通标签</option>
              <option value="barcode">条形码标签</option>
            </select>
          </div>
          <div class="form-group">
            <label for="templateWidth">宽度 (mm)</label>
            <input
              v-model.number="newTemplate.width"
              type="number"
              id="templateWidth"
              placeholder="100"
              min="10"
              max="500"
            />
          </div>
          <div class="form-group">
            <label for="templateHeight">高度 (mm)</label>
            <input
              v-model.number="newTemplate.height"
              type="number"
              id="templateHeight"
              placeholder="50"
              min="10"
              max="500"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeDialog">取消</button>
          <button class="confirm-btn" @click="confirmCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

// 模板数据
interface TemplateItem {
  id: number
  name: string
  updateTime: string
  type?: string
  width?: number
  height?: number
}

const templates = ref<TemplateItem[]>([
  {
    id: 1,
    name: 'RFID标签模板1',
    updateTime: '2026-02-01 10:30',
    type: 'rfid',
    width: 100,
    height: 50
  },
  {
    id: 2,
    name: 'RFID标签模板2',
    updateTime: '2026-02-02 14:15',
    type: 'rfid',
    width: 80,
    height: 40
  }
])

// 创建模板相关
const showCreateDialog = ref(false)
const newTemplate = reactive({
  name: '',
  type: 'rfid',
  width: 100,
  height: 50
})

const createTemplate = () => {
  // 重置表单
  newTemplate.name = ''
  newTemplate.type = 'rfid'
  newTemplate.width = 100
  newTemplate.height = 50
  showCreateDialog.value = true
}

const closeDialog = () => {
  showCreateDialog.value = false
}

const confirmCreate = () => {
  if (!newTemplate.name.trim()) {
    alert('请输入模板名称')
    return
  }

  const newId = templates.value.length > 0 
    ? Math.max(...templates.value.map(t => t.id)) + 1 
    : 1

  const now = new Date()
  const formattedTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const newTemplateItem = {
    id: newId,
    name: newTemplate.name,
    updateTime: formattedTime,
    type: newTemplate.type,
    width: newTemplate.width,
    height: newTemplate.height
  }

  templates.value.unshift(newTemplateItem)

  showCreateDialog.value = false
  
  // 使用 query 传递 id，避免 params 问题
  router.push({ 
    name: 'Designer',
    query: { id: newId }, // 改用 query 传递 id
    state: { template: newTemplateItem } // 保留模板信息
  })
}

const editTemplate = (id: number) => {
  const template = templates.value.find(t => t.id === id)
  if (template) {
    alert(`编辑模板: ${template.name}`)
    // 实际项目中这里应该打开编辑对话框
  }
}

const deleteTemplate = (id: number) => {
  if (confirm('确定要删除这个模板吗？')) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value.splice(index, 1)
    }
  }
}
</script>

<style scoped>
@import './css/template-settings.css';
</style>