<template>
  <div class="practice-container">
    <div class="practice-header">
      <h1>题目练习</h1>
      <div class="filters">
        <el-select v-model="filters.subject_id" placeholder="选择科目" @change="fetchQuestions">
          <el-option label="全部科目" value="" />
          <el-option v-for="subject in subjects" :key="subject.id" :label="subject.display_name" :value="subject.id" />
        </el-select>
        <el-select v-model="filters.difficulty" placeholder="难度" @change="fetchQuestions">
          <el-option label="全部难度" value="" />
          <el-option label="简单" :value="1" />
          <el-option label="中等" :value="3" />
          <el-option label="困难" :value="5" />
        </el-select>
      </div>
    </div>

    <div class="questions-list" v-loading="loading">
      <div
        v-for="question in questions"
        :key="question.id"
        class="question-card"
        @click="$router.push(`/dashboard/practice/${question.id}`)"
      >
        <div class="question-header">
          <el-tag :type="getDifficultyType(question.difficulty)">
            {{ getDifficultyText(question.difficulty) }}
          </el-tag>
          <span class="question-type">{{ question.type }}</span>
        </div>
        <div class="question-content">
          {{ truncateText(question.content, 100) }}
        </div>
        <div class="question-footer">
          <span class="subject-name">{{ question.subject_name }}</span>
          <span class="estimated-time">约{{ Math.round(question.estimated_time / 60) }}分钟</span>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="total > 0"
      @current-change="handlePageChange"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { questionAPI, subjectAPI } from '../utils/api'

const loading = ref(true)
const questions = ref([])
const subjects = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({
  subject_id: '',
  difficulty: ''
})

const getDifficultyType = (difficulty) => {
  const types = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'danger' }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = { 1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难' }
  return texts[difficulty] || '中等'
}

const truncateText = (text, maxLength) => {
  return text?.length > maxLength ? text.substring(0, maxLength) + '...' : text || ''
}

const fetchQuestions = async () => {
  try {
    loading.value = true
    const params = { ...filters, page: currentPage.value, limit: pageSize.value }
    const response = await questionAPI.getQuestions(params)
    questions.value = response.questions
    total.value = response.pagination.total
  } catch (error) {
    ElMessage.error('获取题目失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchQuestions()
}

onMounted(async () => {
  try {
    const response = await subjectAPI.getSubjects()
    subjects.value = response.subjects
  } catch (error) {
    ElMessage.error('获取科目失败')
  }
  await fetchQuestions()
})
</script>

<style scoped>
.practice-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.filters {
  display: flex;
  gap: 12px;
}

.questions-list {
  display: grid;
  gap: 16px;
  margin-bottom: 30px;
}

.question-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-content {
  font-size: 16px;
  line-height: 1.5;
  color: #303133;
  margin-bottom: 16px;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>