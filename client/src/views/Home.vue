<template>
  <div class="home-container">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <div class="welcome-text">
          <h1>欢迎回来，{{ authStore.user?.nickname || authStore.user?.username }}！</h1>
          <p>继续您的学习之旅，探索知识的海洋</p>
        </div>
        <div class="banner-image">
          <el-icon size="120" color="#667eea"><Reading /></el-icon>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon color="#67C23A"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overallStats.learned_knowledge_points || 0 }}</div>
              <div class="stat-label">已学知识点</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon color="#409EFF"><EditPen /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overallStats.total_practice || 0 }}</div>
              <div class="stat-label">练习题目</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon color="#E6A23C"><Trophy /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overallStats.accuracy_rate || 0 }}%</div>
              <div class="stat-label">正确率</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon color="#F56C6C"><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overallStats.average_mastery || 0 }}%</div>
              <div class="stat-label">平均掌握度</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：科目进度和推荐题目 -->
      <el-col :xs="24" :md="16">
        <!-- 科目学习进度 -->
        <div class="content-card">
          <div class="card-header">
            <h3>科目学习进度</h3>
            <el-button type="primary" link @click="$router.push('/dashboard/subjects')">
              查看全部
            </el-button>
          </div>
          <div class="subjects-progress" v-loading="subjectsLoading">
            <div
              v-for="subject in subjects"
              :key="subject.id"
              class="subject-progress-item"
              @click="$router.push(`/dashboard/subjects/${subject.id}`)"
            >
              <div class="subject-info">
                <div class="subject-icon" :class="getSubjectTheme(subject.code)">
                  <el-icon :size="24">
                    <component :is="getSubjectIcon(subject.code)" />
                  </el-icon>
                </div>
                <div class="subject-details">
                  <h4>{{ subject.display_name }}</h4>
                  <p>{{ subject.user_progress.learned_knowledge_points }}/{{ subject.user_progress.total_knowledge_points }} 知识点</p>
                </div>
              </div>
              <div class="progress-info">
                <el-progress
                  :percentage="subject.user_progress.completion_rate"
                  :stroke-width="8"
                  :show-text="false"
                />
                <span class="progress-text">{{ subject.user_progress.completion_rate }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 推荐题目 -->
        <div class="content-card">
          <div class="card-header">
            <h3>为您推荐</h3>
            <el-button type="primary" link @click="$router.push('/dashboard/practice')">
              更多练习
            </el-button>
          </div>
          <div class="recommended-questions" v-loading="questionsLoading">
            <div
              v-for="question in recommendedQuestions"
              :key="question.id"
              class="question-item"
              @click="$router.push(`/dashboard/practice/${question.id}`)"
            >
              <div class="question-info">
                <el-tag :type="getDifficultyType(question.difficulty)" size="small">
                  {{ getDifficultyText(question.difficulty) }}
                </el-tag>
                <span class="question-type">{{ question.type }}</span>
                <span class="subject-name">{{ question.subject_name }}</span>
              </div>
              <div class="question-content">
                {{ truncateText(question.content, 80) }}
              </div>
              <div class="question-meta">
                <span class="estimated-time">
                  <el-icon><Clock /></el-icon>
                  {{ Math.round(question.estimated_time / 60) }}分钟
                </span>
              </div>
            </div>
            
            <el-empty v-if="recommendedQuestions.length === 0" description="暂无推荐题目" />
          </div>
        </div>
      </el-col>

      <!-- 右侧：学习计划和最近活动 -->
      <el-col :xs="24" :md="8">
        <!-- 今日学习计划 -->
        <div class="content-card">
          <div class="card-header">
            <h3>今日学习计划</h3>
          </div>
          <div class="study-plan">
            <div class="plan-item">
              <el-checkbox v-model="planItems.math">数学：二次函数练习</el-checkbox>
              <span class="plan-time">30分钟</span>
            </div>
            <div class="plan-item">
              <el-checkbox v-model="planItems.physics">物理：牛顿定律复习</el-checkbox>
              <span class="plan-time">25分钟</span>
            </div>
            <div class="plan-item">
              <el-checkbox v-model="planItems.chemistry">化学：元素周期表</el-checkbox>
              <span class="plan-time">20分钟</span>
            </div>
          </div>
        </div>

        <!-- 学习日历 -->
        <div class="content-card">
          <div class="card-header">
            <h3>学习日历</h3>
          </div>
          <el-calendar v-model="calendarValue" class="study-calendar">
            <template #date-cell="{ data }">
              <div class="calendar-day">
                <span>{{ data.day.split('-')[2] }}</span>
                <div v-if="hasStudyRecord(data.day)" class="study-dot"></div>
              </div>
            </template>
          </el-calendar>
        </div>

        <!-- 最近答题记录 -->
        <div class="content-card">
          <div class="card-header">
            <h3>最近答题</h3>
          </div>
          <div class="recent-answers" v-loading="answersLoading">
            <div
              v-for="answer in recentAnswers"
              :key="answer.id"
              class="answer-item"
            >
              <div class="answer-result">
                <el-icon :color="answer.is_correct ? '#67C23A' : '#F56C6C'">
                  <Check v-if="answer.is_correct" />
                  <Close v-else />
                </el-icon>
              </div>
              <div class="answer-content">
                <div class="answer-question">{{ truncateText(answer.content, 40) }}</div>
                <div class="answer-meta">
                  <span>{{ answer.subject_name }}</span>
                  <span>{{ formatTime(answer.created_at) }}</span>
                </div>
              </div>
              <div class="answer-score">{{ answer.score }}分</div>
            </div>
            
            <el-empty v-if="recentAnswers.length === 0" description="暂无答题记录" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { subjectAPI, questionAPI, userAPI } from '../utils/api'
import {
  Reading,
  TrendCharts,
  EditPen,
  Trophy,
  Star,
  Operation,
  Lightning,
  Monitor,
  Orange,
  Clock,
  Check,
  Close
} from '@element-plus/icons-vue'

const authStore = useAuthStore()

// 响应式数据
const subjects = ref([])
const subjectsLoading = ref(true)
const recommendedQuestions = ref([])
const questionsLoading = ref(true)
const recentAnswers = ref([])
const answersLoading = ref(true)
const overallStats = ref({})
const calendarValue = ref(new Date())

const planItems = reactive({
  math: false,
  physics: false,
  chemistry: false
})

// 获取科目图标
const getSubjectIcon = (code) => {
  const icons = {
    math: Operation,
    physics: Lightning,
    chemistry: Monitor,
    biology: Orange
  }
  return icons[code] || Operation
}

// 获取科目主题
const getSubjectTheme = (code) => {
  const themes = {
    math: 'math-theme',
    physics: 'physics-theme',
    chemistry: 'chemistry-theme',
    biology: 'biology-theme'
  }
  return themes[code] || 'math-theme'
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  const types = {
    1: 'success',
    2: 'info',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  }
  return types[difficulty] || 'info'
}

// 获取难度文本
const getDifficultyText = (difficulty) => {
  const texts = {
    1: '简单',
    2: '较易',
    3: '中等',
    4: '较难',
    5: '困难'
  }
  return texts[difficulty] || '中等'
}

// 截断文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 检查是否有学习记录
const hasStudyRecord = (date) => {
  // 这里应该从实际数据中检查
  return Math.random() > 0.7 // 模拟数据
}

// 获取科目数据
const fetchSubjects = async () => {
  try {
    subjectsLoading.value = true
    const response = await subjectAPI.getSubjects()
    subjects.value = response.subjects
  } catch (error) {
    ElMessage.error('获取科目信息失败')
  } finally {
    subjectsLoading.value = false
  }
}

// 获取推荐题目
const fetchRecommendedQuestions = async () => {
  try {
    questionsLoading.value = true
    const response = await questionAPI.getRecommendedQuestions(authStore.user.id, { limit: 5 })
    recommendedQuestions.value = response.questions
  } catch (error) {
    console.error('获取推荐题目失败:', error)
  } finally {
    questionsLoading.value = false
  }
}

// 获取用户统计信息
const fetchUserStats = async () => {
  try {
    const response = await userAPI.getUserStats(authStore.user.id)
    overallStats.value = response.stats.overall
    recentAnswers.value = response.stats.recent_answers
  } catch (error) {
    console.error('获取用户统计失败:', error)
  } finally {
    answersLoading.value = false
  }
}

onMounted(() => {
  fetchSubjects()
  fetchRecommendedQuestions()
  fetchUserStats()
})
</script>

<style scoped>
.home-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-text h1 {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.welcome-text p {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.banner-image {
  opacity: 0.8;
}

.stats-cards {
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
}

.stat-icon {
  font-size: 48px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.main-content {
  gap: 20px;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.subjects-progress {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subject-progress-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subject-progress-item:hover {
  border-color: #409eff;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.2);
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subject-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.subject-details h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.subject-details p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 120px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.recommended-questions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-item:hover {
  border-color: #409eff;
  background: #f8f9fa;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.question-type,
.subject-name {
  font-size: 12px;
  color: #909399;
}

.question-content {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.question-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.estimated-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.study-plan {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.plan-time {
  font-size: 12px;
  color: #909399;
}

.study-calendar {
  margin-top: 16px;
}

.calendar-day {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.study-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: #67c23a;
  border-radius: 50%;
}

.recent-answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.answer-result {
  font-size: 18px;
}

.answer-content {
  flex: 1;
}

.answer-question {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.answer-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 8px;
}

.answer-score {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 16px;
  }
  
  .welcome-banner {
    padding: 24px;
  }
  
  .banner-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .welcome-text h1 {
    font-size: 24px;
  }
  
  .banner-image {
    margin-top: 16px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .content-card {
    padding: 16px;
  }
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 40px;
  padding: 0;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f2f5;
}
</style>