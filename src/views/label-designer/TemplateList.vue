<template>
  <div class="template-list">
    <div class="page-header">
      <div class="header-content">
        <h1>模板设置</h1>
        <button class="create-template-btn" @click="createTemplate">
          <span class="btn-icon">+</span> 创建模板
        </button>
      </div>
      <p class="page-desc">点击「创建模板」新建标签，或点击「编辑」修改已有模板。</p>
    </div>

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
              <button class="action-btn edit-btn" @click="editTemplate(template.id)">编辑</button>
              <button class="action-btn delete-btn" @click="deleteTemplate(template.id)">删除</button>
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

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">加载中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTemplateList, deleteTemplate as apiDeleteTemplate, type TemplateListItem } from './services/api'

const router = useRouter()
const templates = ref<TemplateListItem[]>([])
const loading = ref(false)

const loadTemplates = async () => {
  try {
    loading.value = true
    templates.value = await getTemplateList()
  } catch (e) {
    console.error(e)
    templates.value = []
    alert('加载模板列表失败：' + (e instanceof Error ? e.message : '请稍后重试'))
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const createTemplate = () => {
  router.push({ name: 'LabelDesigner' })
}

const editTemplate = (id: string) => {
  router.push({ name: 'LabelDesigner', params: { id } })
}

const deleteTemplate = async (id: string) => {
  if (!confirm('确定要删除这个模板吗？')) return
  try {
    await apiDeleteTemplate(id)
    templates.value = templates.value.filter((t) => t.id !== id)
    alert('模板删除成功')
  } catch (e) {
    console.error(e)
    alert('删除模板失败：' + (e instanceof Error ? e.message : '请稍后重试'))
  }
}

onMounted(loadTemplates)
</script>

<style scoped>
@import './css/list.css';
</style>
