<template>
  <div class="progress-container">
    <div class="progress-header">
      <h1>学习进度</h1>
      <p>跟踪您的学习成果和知识掌握情况</p>
    </div>

    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :md="6">
          <div class="overview-card">
            <div class="card-icon">
              <el-icon color="#409EFF"><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ overallStats.learned_knowledge_points || 0 }}</div>
              <div class="card-label">已学知识点</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :md="6">
          <div class="overview-card">
            <div class="card-icon">
              <el-icon color="#67C23A"><Trophy /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ overallStats.average_mastery || 0 }}%</div>
              <div class="card-label">平均掌握度</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :md="6">
          <div class="overview-card">
            <div class="card-icon">
              <el-icon color="#E6A23C"><EditPen /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ overallStats.total_practice || 0 }}</div>
              <div class="card-label">练习题目</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :md="6">
          <div class="overview-card">
            <div class="card-icon">
              <el-icon color="#F56C6C"><Star /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ overallStats.accuracy_rate || 0 }}%</div>
              <div class="card-label">正确率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20">
      <el-col :md="16">
        <div class="progress-section">
          <h2>科目进度详情</h2>
          <div class="subject-progress-list" v-loading="loading">
            <div
              v-for="subject in subjectProgress"
              :key="subject.id"
              class="subject-progress-card"
            >
              <div class="subject-header">
                <div class="subject-info">
                  <div class="subject-icon" :class="getSubjectTheme(subject.code)">
                    <el-icon :size="32">
                      <component :is="getSubjectIcon(subject.code)" />
                    </el-icon>
                  </div>
                  <div>
                    <h3>{{ subject.display_name }}</h3>
                    <p>{{ subject.learned_knowledge_points }}/{{ subject.total_knowledge_points }} 知识点</p>
                  </div>
                </div>
                <div class="progress-circle">
                  <el-progress
                    type="circle"
                    :percentage="subject.completion_rate"
                    :width="80"
                  />
                </div>
              </div>
              
              <div class="progress-details">
                <div class="detail-item">
                  <span>掌握程度</span>
                  <el-progress
                    :percentage="subject.average_mastery"
                    :stroke-width="8"
                    :show-text="true"
                  />
                </div>
                <div class="detail-item">
                  <span>练习正确率</span>
                  <el-progress
                    :percentage="subject.accuracy_rate"
                    :stroke-width="8"
                    :show-text="true"
                    color="#67C23A"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      
      <el-col :md="8">
        <div class="stats-section">
          <h2>掌握程度分布</h2>
          <div class="mastery-distribution">
            <div
              v-for="category in masteryDistribution"
              :key="category.mastery_category"
              class="distribution-item"
            >
              <div class="category-info">
                <span class="category-name">{{ category.mastery_category }}</span>
                <span class="category-count">{{ category.count }}个</span>
              </div>
              <el-progress
                :percentage="getPercentage(category.count)"
                :stroke-width="12"
                :show-text="false"
                :color="getCategoryColor(category.mastery_category)"
              />
            </div>
          </div>
        </div>

        <div class="learning-path-section">
          <h2>学习路径建议</h2>
          <div class="path-recommendations">
            <div
              v-for="item in learningPath.recommended_next"
              :key="item.id"
              class="recommendation-item"
            >
              <div class="recommendation-content">
                <h4>{{ item.name }}</h4>
                <p>难度: {{ item.difficulty_level }}/5</p>
              </div>
              <el-button
                type="primary"
                size="small"
                @click="startLearning(item.id)"
              >
                开始学习
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { userAPI, progressAPI } from '../utils/api'
import {
  TrendCharts,
  Trophy,
  EditPen,
  Star,
  Calculator,
  Lightning,
  Cpu,
  Grape
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const loading = ref(true)
const overallStats = ref({})
const subjectProgress = ref([])
const masteryDistribution = ref([])
const learningPath = ref({ recommended_next: [] })

const getSubjectIcon = (code) => {
  const icons = {
    math: Calculator,
    physics: Lightning,
    chemistry: Cpu,
    biology: Grape
  }
  return icons[code] || Calculator
}

const getSubjectTheme = (code) => {
  const themes = {
    math: 'math-theme',
    physics: 'physics-theme',
    chemistry: 'chemistry-theme',
    biology: 'biology-theme'
  }
  return themes[code] || 'math-theme'
}

const totalKnowledgePoints = computed(() => {
  return subjectProgress.value.reduce((sum, subject) => sum + subject.total_knowledge_points, 0)
})

const getPercentage = (count) => {
  return totalKnowledgePoints.value > 0 ? Math.round((count / totalKnowledgePoints.value) * 100) : 0
}

const getCategoryColor = (category) => {
  const colors = {
    '未掌握': '#F56C6C',
    '初步掌握': '#E6A23C',
    '基本掌握': '#409EFF',
    '熟练掌握': '#67C23A'
  }
  return colors[category] || '#909399'
}

const startLearning = (knowledgePointId) => {
  ElMessage.success(`开始学习知识点 ${knowledgePointId}`)
}

onMounted(async () => {
  try {
    loading.value = true
    
    const [userStatsRes, distributionRes, pathRes] = await Promise.all([
      userAPI.getUserStats(authStore.user.id),
      progressAPI.getMasteryDistribution(),
      progressAPI.getLearningPath({ subject_id: 1 })
    ])
    
    overallStats.value = userStatsRes.stats.overall
    subjectProgress.value = userStatsRes.stats.subjects.map(subject => ({
      ...subject,
      code: getSubjectCode(subject.display_name)
    }))
    masteryDistribution.value = distributionRes.distribution.mastery_categories
    learningPath.value = pathRes.learning_path
    
  } catch (error) {
    ElMessage.error('获取学习进度失败')
  } finally {
    loading.value = false
  }
})

const getSubjectCode = (displayName) => {
  const codeMap = { '数学': 'math', '物理': 'physics', '化学': 'chemistry', '生物': 'biology' }
  return codeMap[displayName] || 'math'
}
</script>

<style scoped>
.progress-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.progress-header {
  text-align: center;
  margin-bottom: 30px;
}

.progress-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.progress-header p {
  color: #606266;
  font-size: 16px;
}

.overview-cards {
  margin-bottom: 30px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 48px;
  margin-right: 16px;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.progress-section, .stats-section, .learning-path-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-section h2, .stats-section h2, .learning-path-section h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.subject-progress-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.subject-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.subject-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.math-theme { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.physics-theme { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.chemistry-theme { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.biology-theme { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-item span {
  min-width: 80px;
  font-size: 14px;
  color: #606266;
}

.mastery-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-size: 14px;
  color: #303133;
}

.category-count {
  font-size: 12px;
  color: #909399;
}

.path-recommendations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.recommendation-content h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #303133;
}

.recommendation-content p {
  font-size: 12px;
  color: #909399;
  margin: 0;
}
</style>