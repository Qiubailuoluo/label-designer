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
            <td class="update-time">{{ formatDate(template.updatedAt) }}</td>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface TemplateItem {
  id: string
  name: string
  updatedAt: string
  createdAt: string
  elements: any[]
  canvasConfig: any
}

const templates = ref<TemplateItem[]>([
  // 示例数据
  {
    id: 'template_1',
    name: 'RFID标签模板1',
    updatedAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:30:00Z',
    elements: [],
    canvasConfig: {
      width: 100,
      height: 50,
      dpi: 300,
      backgroundColor: '#ffffff',
      gridEnabled: true
    }
  },
  {
    id: 'template_2',
    name: 'RFID标签模板2',
    updatedAt: '2024-01-16T14:20:00Z',
    createdAt: '2024-01-16T14:20:00Z',
    elements: [],
    canvasConfig: {
      width: 80,
      height: 40,
      dpi: 300,
      backgroundColor: '#ffffff',
      gridEnabled: true
    }
  }
])

// 加载模板数据
const loadTemplates = () => {
  const savedTemplates = localStorage.getItem('rfidDesigns')
  if (savedTemplates) {
    try {
      const parsedTemplates = JSON.parse(savedTemplates)
      if (Array.isArray(parsedTemplates)) {
        templates.value = parsedTemplates
      }
    } catch (error) {
      console.error('加载模板数据失败:', error)
    }
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 创建模板 - 跳转到设计器页面
const createTemplate = () => {
  // 生成新的模板ID
  const newTemplateId = `template_${Date.now()}`
  
  // 跳转到设计器页面，传递新的模板ID
  router.push({
    name: 'TemplateDesign',
    params: { id: newTemplateId }
  })
}

// 编辑模板 - 跳转到设计器页面
const editTemplate = (id: string) => {
  router.push({
    name: 'TemplateDesign',
    params: { id }
  })
}

// 删除模板
const deleteTemplate = (id: string) => {
  if (confirm('确定要删除这个模板吗？')) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value.splice(index, 1)
      
      // 保存到本地存储
      localStorage.setItem('rfidDesigns', JSON.stringify(templates.value))
    }
  }
}

// 初始化
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
@import './css/template-settings.css';
</style>