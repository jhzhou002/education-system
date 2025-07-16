<template>
  <div class="subject-detail-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="subject" class="subject-content">
      <div class="subject-header">
        <el-button @click="$router.back()" icon="ArrowLeft" circle />
        <div class="subject-info">
          <div class="subject-icon" :class="getSubjectTheme(subject.code)">
            <el-icon :size="32">
              <component :is="getSubjectIcon(subject.code)" />
            </el-icon>
          </div>
          <div>
            <h1>{{ subject.display_name }}</h1>
            <p>{{ subject.description }}</p>
          </div>
        </div>
      </div>

      <el-row :gutter="20">
        <el-col :md="16">
          <div class="chapters-section">
            <h2>知识点章节</h2>
            <div class="chapters-tree">
              <div
                v-for="chapter in chapters"
                :key="chapter.id"
                class="chapter-item"
              >
                <h3>{{ chapter.title }}</h3>
                <p>{{ chapter.description }}</p>
                <el-button type="primary" @click="startChapter(chapter.id)">
                  开始学习
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
        
        <el-col :md="8">
          <div class="stats-panel">
            <h3>学习统计</h3>
            <div class="stat-item">
              <span>学习进度</span>
              <span>{{ stats.completion_rate || 0 }}%</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { subjectAPI } from '../utils/api'
import { Operation, Lightning, Monitor, Orange } from '@element-plus/icons-vue'

const route = useRoute()
const loading = ref(true)
const subject = ref(null)
const chapters = ref([])
const stats = ref({})

const getSubjectIcon = (code) => {
  const icons = { math: Operation, physics: Lightning, chemistry: Monitor, biology: Orange }
  return icons[code] || Operation
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

const startChapter = (chapterId) => {
  ElMessage.success('功能开发中...')
}

onMounted(async () => {
  try {
    const subjectId = route.params.id
    const [subjectRes, chaptersRes, statsRes] = await Promise.all([
      subjectAPI.getSubjectById(subjectId),
      subjectAPI.getSubjectChapters(subjectId),
      subjectAPI.getSubjectStats(subjectId)
    ])
    
    subject.value = subjectRes.subject
    chapters.value = chaptersRes.chapters
    stats.value = statsRes.stats
  } catch (error) {
    ElMessage.error('获取科目信息失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.subject-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.subject-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
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

.chapters-section, .stats-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chapter-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>