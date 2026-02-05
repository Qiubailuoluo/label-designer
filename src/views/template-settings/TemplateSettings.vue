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
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from './templatesetting-designer/services/api.ts'

const router = useRouter()

interface TemplateItem {
  id: string
  name: string
  updatedAt: string
  createdAt: string
  elements: any[]
  canvasConfig: any
}

const templates = ref<TemplateItem[]>([])
const loading = ref(false)

// 加载模板数据 - 使用真实API
const loadTemplates = async () => {
  try {
    loading.value = true
    console.log('📥 开始加载模板列表...')
    
    // 调用真实API获取模板列表
    const response = await apiService.getTemplateList()
    
    // 根据新的API响应结构调整数据映射
    if (response && response.data && Array.isArray(response.data.list)) {
      templates.value = response.data.list.map((template: any) => ({
        id: template.template_id,
        name: template.template_name,
        updatedAt: template.create_time,
        createdAt: template.create_time,
        elements: [], // 实际元素数据需要单独加载
        canvasConfig: {
          width: 100, // 默认值
          height: 60, // 默认值
          dpi: 300,
          backgroundColor: '#ffffff',
          gridEnabled: true
        }
      }))
      console.log('✅ 模板列表加载成功，共', templates.value.length, '个模板')
    } else {
      console.warn('⚠️ API响应格式不符合预期:', response)
      templates.value = []
    }
  } catch (error) {
    console.error('💥 加载模板列表失败:', error)
    // 失败时显示错误提示，但仍显示空状态
    templates.value = []
    alert('加载模板列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 创建模板 - 跳转到设计器页面（不传递ID，用于创建新模板）
const createTemplate = () => {
  // 跳转到设计器页面，不传递ID参数（创建空模板）
  router.push({
    name: 'TemplateDesign',
    params: {} // 不传递id参数
  })
}

// 编辑模板 - 跳转到设计器页面
const editTemplate = (id: string) => {
  router.push({
    name: 'TemplateDesign',
    params: { id }
  })
}

// 删除模板 - 使用真实API
const deleteTemplate = async (id: string) => {
  if (confirm('确定要删除这个模板吗？')) {
    try {
      console.log('🗑️ 开始删除模板:', id)
      
      // 调用真实API删除模板
      await apiService.deleteTemplate(id)
      
      // 从本地列表中移除
      const index = templates.value.findIndex(t => t.id === id)
      if (index !== -1) {
        templates.value.splice(index, 1)
      }
      
      console.log('✅ 模板删除成功')
      alert('模板删除成功')
    } catch (error) {
      console.error('💥 删除模板失败:', error)
      alert('删除模板失败，请稍后重试')
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  background: white;
  padding: 20px 40px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>