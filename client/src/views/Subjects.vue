<template>
  <div class="subjects-container">
    <div class="subjects-header">
      <h1>科目学习</h1>
      <p>选择您想要学习的科目，开启知识探索之旅</p>
    </div>

    <div class="subjects-grid" v-loading="loading">
      <div
        v-for="subject in subjects"
        :key="subject.id"
        class="subject-card"
        :class="{
          active: subject.is_active,
          disabled: !subject.is_active
        }"
        @click="handleSubjectClick(subject)"
      >
        <div class="subject-header">
          <div class="subject-icon" :class="getSubjectTheme(subject.code)">
            <el-icon :size="48">
              <component :is="getSubjectIcon(subject.code)" />
            </el-icon>
          </div>
          <div class="subject-status">
            <el-tag v-if="subject.is_active" type="success" size="small">可学习</el-tag>
            <el-tag v-else type="info" size="small">即将开放</el-tag>
          </div>
        </div>

        <div class="subject-content">
          <h3>{{ subject.display_name }}</h3>
          <p>{{ subject.description }}</p>
          
          <div class="subject-progress">
            <div class="progress-stats">
              <span>学习进度</span>
              <span>{{ subject.user_progress.completion_rate }}%</span>
            </div>
            <el-progress
              :percentage="subject.user_progress.completion_rate"
              :stroke-width="8"
              :show-text="false"
              :color="getProgressColor(subject.user_progress.completion_rate)"
            />
            <div class="progress-details">
              <span>已完成 {{ subject.user_progress.learned_knowledge_points }}/{{ subject.user_progress.total_knowledge_points }} 知识点</span>
              <span>掌握度 {{ subject.user_progress.average_mastery }}%</span>
            </div>
          </div>
        </div>

        <div class="subject-actions">
          <el-button
            v-if="subject.is_active"
            type="primary"
            size="small"
            @click.stop="$router.push(`/dashboard/subjects/${subject.id}`)"
          >
            开始学习
          </el-button>
          <el-button
            v-else
            size="small"
            disabled
          >
            敬请期待
          </el-button>
          
          <el-button
            v-if="subject.is_active"
            link
            size="small"
            @click.stop="$router.push(`/dashboard/practice?subject_id=${subject.id}`)"
          >
            题目练习
          </el-button>
        </div>
      </div>
    </div>

    <!-- 学习建议 -->
    <div class="study-suggestions" v-if="suggestions.length > 0">
      <h2>学习建议</h2>
      <div class="suggestions-list">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="suggestion-item"
        >
          <div class="suggestion-icon">
            <el-icon :color="suggestion.color">
              <component :is="suggestion.icon" />
            </el-icon>
          </div>
          <div class="suggestion-content">
            <h4>{{ suggestion.title }}</h4>
            <p>{{ suggestion.description }}</p>
          </div>
          <el-button
            type="primary"
            text
            @click="handleSuggestionClick(suggestion)"
          >
            去学习
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { subjectAPI } from '../utils/api'
import {
  Operation,
  Lightning,
  Monitor,
  Orange,
  TrendCharts,
  Star,
  Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)
const subjects = ref([])

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

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) return '#F56C6C'
  if (percentage < 60) return '#E6A23C'
  if (percentage < 80) return '#409EFF'
  return '#67C23A'
}

// 学习建议
const suggestions = computed(() => {
  const result = []
  
  subjects.value.forEach(subject => {
    if (!subject.is_active) return
    
    const progress = subject.user_progress
    if (progress.completion_rate < 30) {
      result.push({
        id: `start-${subject.id}`,
        title: `开始学习${subject.display_name}`,
        description: '建议从基础知识点开始，循序渐进地学习',
        color: '#409EFF',
        icon: TrendCharts,
        subjectId: subject.id,
        action: 'start'
      })
    } else if (progress.average_mastery < 60) {
      result.push({
        id: `review-${subject.id}`,
        title: `加强${subject.display_name}练习`,
        description: '您的掌握程度还有提升空间，建议多做练习题',
        color: '#E6A23C',
        icon: Warning,
        subjectId: subject.id,
        action: 'practice'
      })
    } else if (progress.completion_rate > 80) {
      result.push({
        id: `advanced-${subject.id}`,
        title: `${subject.display_name}进阶学习`,
        description: '基础掌握良好，可以挑战更高难度的内容',
        color: '#67C23A',
        icon: Star,
        subjectId: subject.id,
        action: 'advanced'
      })
    }
  })
  
  return result.slice(0, 3) // 最多显示3个建议
})

// 处理科目点击
const handleSubjectClick = (subject) => {
  if (subject.is_active) {
    router.push(`/dashboard/subjects/${subject.id}`)
  } else {
    ElMessage.info('该科目即将开放，敬请期待！')
  }
}

// 处理建议点击
const handleSuggestionClick = (suggestion) => {
  switch (suggestion.action) {
    case 'start':
      router.push(`/dashboard/subjects/${suggestion.subjectId}`)
      break
    case 'practice':
      router.push(`/dashboard/practice?subject_id=${suggestion.subjectId}`)
      break
    case 'advanced':
      router.push(`/dashboard/subjects/${suggestion.subjectId}?difficulty=4`)
      break
  }
}

// 获取科目数据
const fetchSubjects = async () => {
  try {
    loading.value = true
    const response = await subjectAPI.getSubjects()
    subjects.value = response.subjects
  } catch (error) {
    ElMessage.error('获取科目信息失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSubjects()
})
</script>

<style scoped>
.subjects-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.subjects-header {
  text-align: center;
  margin-bottom: 40px;
}

.subjects-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
}

.subjects-header p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.subject-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.subject-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.subject-card.active:hover {
  border-color: #409EFF;
}

.subject-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subject-card.disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.subject-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.subject-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.math-theme {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.physics-theme {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.chemistry-theme {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.biology-theme {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.subject-content h3 {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.subject-content p {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

.subject-progress {
  margin-bottom: 20px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-stats span:first-child {
  font-size: 14px;
  color: #606266;
}

.progress-stats span:last-child {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.subject-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.study-suggestions {
  margin-top: 40px;
}

.study-suggestions h2 {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggestion-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.suggestion-icon {
  font-size: 32px;
  min-width: 32px;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.suggestion-content p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subjects-container {
    padding: 16px;
  }
  
  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .subject-card {
    padding: 20px;
  }
  
  .subjects-header h1 {
    font-size: 24px;
  }
  
  .subject-icon {
    width: 60px;
    height: 60px;
  }
  
  .subject-content h3 {
    font-size: 20px;
  }
  
  .subject-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .subject-actions .el-button {
    width: 100%;
  }
  
  .suggestion-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>