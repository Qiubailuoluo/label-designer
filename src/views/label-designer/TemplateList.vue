<template>
  <div class="template-list">
    <div class="page-header">
      <div class="header-content">
        <h1>模板设置</h1>
        <el-button type="primary" @click="createTemplate">
          <el-icon><Plus /></el-icon>
          创建模板
        </el-button>
      </div>
      <p class="page-desc">点击「创建模板」新建标签，或点击「编辑」修改已有模板。</p>
    </div>

    <div class="template-table-container">
      <el-table :data="templates" stripe style="width: 100%">
        <el-table-column prop="name" label="模板名称" min-width="200">
          <template #default="{ row }">
            <span class="template-icon">🏷️</span>
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editTemplate(row.id)">编辑</el-button>
            <el-button type="danger" link @click="deleteTemplate(row.id)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无模板，点击「创建模板」开始创建" />
        </template>
      </el-table>
    </div>

    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 模板列表页：展示模板表（名称、更新时间），支持创建、编辑、删除；编辑跳转至设计器 /label-designer/design/:id
 */
import { Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
    ElMessage.error('加载模板列表失败：' + (e instanceof Error ? e.message : '请稍后重试'))
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
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await apiDeleteTemplate(id)
    templates.value = templates.value.filter((t) => t.id !== id)
    ElMessage.success('模板删除成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('删除模板失败：' + (e instanceof Error ? e.message : '请稍后重试'))
  }
}

onMounted(loadTemplates)
</script>

<style scoped>
@import './css/list.css';
</style>
