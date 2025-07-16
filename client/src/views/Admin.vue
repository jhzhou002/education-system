<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>管理后台</h1>
      <p>教师和管理员专用功能</p>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="AI题目生成" name="generate">
        <div class="generate-section">
          <el-form :model="generateForm" label-width="120px">
            <el-form-item label="科目">
              <el-select v-model="generateForm.subject_id" @change="loadKnowledgePoints">
                <el-option v-for="subject in subjects" :key="subject.id" :label="subject.display_name" :value="subject.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="知识点">
              <el-select v-model="generateForm.knowledge_point_ids" multiple placeholder="请选择知识点">
                <el-option 
                  v-for="kp in knowledgePoints" 
                  :key="kp.id" 
                  :label="kp.name" 
                  :value="kp.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="题目类型">
              <el-select v-model="generateForm.question_type">
                <el-option label="单选题" value="单选" />
                <el-option label="多选题" value="多选" />
                <el-option label="填空题" value="填空" />
                <el-option label="解答题" value="解答" />
                <el-option label="证明题" value="证明" />
              </el-select>
            </el-form-item>
            <el-form-item label="难度等级">
              <el-select v-model="generateForm.difficulty">
                <el-option label="简单" :value="1" />
                <el-option label="较易" :value="2" />
                <el-option label="中等" :value="3" />
                <el-option label="较难" :value="4" />
                <el-option label="困难" :value="5" />
              </el-select>
            </el-form-item>
            <el-form-item label="生成数量">
              <el-input-number v-model="generateForm.count" :min="1" :max="10" />
            </el-form-item>
            <el-form-item label="特殊要求">
              <el-input v-model="generateForm.special_requirements" type="textarea" placeholder="可选：特殊要求或注意事项" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateQuestions" :loading="generating" :disabled="!generateForm.knowledge_point_ids.length">
                生成题目
              </el-button>
            </el-form-item>
          </el-form>
          
          <!-- 生成结果展示 -->
          <div v-if="generatedQuestions.length > 0" class="generated-results">
            <h3>生成的题目</h3>
            <div v-for="(question, index) in generatedQuestions" :key="index" class="question-preview">
              <div class="question-header">
                <span class="question-number">第 {{ index + 1 }} 题</span>
                <el-tag>{{ question.type }}</el-tag>
                <el-rate v-model="question.difficulty" disabled show-score />
              </div>
              <div class="question-content" v-html="question.content"></div>
              <div v-if="question.options && question.options.length" class="question-options">
                <div v-for="option in question.options" :key="option" class="option">{{ option }}</div>
              </div>
              <div class="question-answer">
                <strong>答案：</strong>{{ Array.isArray(question.answer) ? question.answer.join(', ') : question.answer }}
              </div>
              <div class="question-analysis">
                <strong>解析：</strong>{{ question.analysis }}
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <div class="users-section">
          <el-table :data="users" v-loading="usersLoading">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="real_name" label="真实姓名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="role" label="角色" />
            <el-table-column prop="grade" label="年级" />
            <el-table-column prop="created_at" label="注册时间" />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { aiAPI, userAPI, subjectAPI } from '../utils/api'

const authStore = useAuthStore()
const activeTab = ref('generate')
const generating = ref(false)
const usersLoading = ref(false)
const subjects = ref([])
const users = ref([])
const knowledgePoints = ref([])
const generatedQuestions = ref([])

const generateForm = reactive({
  subject_id: 1,
  question_type: '单选',
  difficulty: 3,
  count: 1,
  knowledge_point_ids: [],
  special_requirements: ''
})

const loadKnowledgePoints = async () => {
  if (!generateForm.subject_id) return
  
  try {
    const response = await subjectAPI.getSubjectKnowledgePoints(generateForm.subject_id)
    knowledgePoints.value = response.knowledge_points || []
    generateForm.knowledge_point_ids = []
  } catch (error) {
    console.error('加载知识点失败:', error)
    ElMessage.error('加载知识点失败')
  }
}

const generateQuestions = async () => {
  if (!generateForm.knowledge_point_ids.length) {
    ElMessage.warning('请至少选择一个知识点')
    return
  }
  
  try {
    generating.value = true
    const response = await aiAPI.generateQuestions(generateForm)
    generatedQuestions.value = response.generated_questions || []
    
    if (response.errors && response.errors.length > 0) {
      ElMessage.warning(`生成完成，但有 ${response.errors.length} 个错误`)
      console.warn('生成错误:', response.errors)
    } else {
      ElMessage.success('题目生成成功')
    }
  } catch (error) {
    console.error('题目生成失败:', error)
    ElMessage.error(`题目生成失败: ${error.message || '未知错误'}`)
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  // 检查权限
  if (!authStore.isTeacher) {
    ElMessage.error('权限不足')
    return
  }

  try {
    const [subjectsRes, usersRes] = await Promise.all([
      subjectAPI.getSubjects(),
      userAPI.getUsers()
    ])
    subjects.value = subjectsRes.subjects
    users.value = usersRes.users
    
    // 默认加载第一个科目的知识点
    if (subjects.value.length > 0) {
      generateForm.subject_id = subjects.value[0].id
      await loadKnowledgePoints()
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  }
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  text-align: center;
  margin-bottom: 30px;
}

.generate-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.users-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.generated-results {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #ebeef5;
}

.generated-results h3 {
  color: #303133;
  margin-bottom: 20px;
}

.question-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #409eff;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.question-number {
  font-weight: bold;
  color: #409eff;
}

.question-content {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 15px;
  color: #303133;
}

.question-options {
  margin: 15px 0;
}

.option {
  padding: 5px 0;
  color: #606266;
}

.question-answer {
  margin: 10px 0;
  padding: 10px;
  background: #e1f3d8;
  border-radius: 4px;
  color: #67c23a;
}

.question-analysis {
  margin: 10px 0;
  padding: 10px;
  background: #fdf6ec;
  border-radius: 4px;
  color: #e6a23c;
}
</style>