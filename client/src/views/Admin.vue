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
              <el-select v-model="generateForm.subject_id">
                <el-option v-for="subject in subjects" :key="subject.id" :label="subject.display_name" :value="subject.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="题目类型">
              <el-select v-model="generateForm.question_type">
                <el-option label="单选题" value="单选" />
                <el-option label="填空题" value="填空" />
                <el-option label="解答题" value="解答" />
              </el-select>
            </el-form-item>
            <el-form-item label="难度等级">
              <el-select v-model="generateForm.difficulty">
                <el-option label="简单" :value="1" />
                <el-option label="中等" :value="3" />
                <el-option label="困难" :value="5" />
              </el-select>
            </el-form-item>
            <el-form-item label="生成数量">
              <el-input-number v-model="generateForm.count" :min="1" :max="5" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateQuestions" :loading="generating">
                生成题目
              </el-button>
            </el-form-item>
          </el-form>
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

const generateForm = reactive({
  subject_id: 1,
  question_type: '单选',
  difficulty: 3,
  count: 1,
  knowledge_point_ids: [1]
})

const generateQuestions = async () => {
  try {
    generating.value = true
    await aiAPI.generateQuestions(generateForm)
    ElMessage.success('题目生成成功')
  } catch (error) {
    ElMessage.error('题目生成失败')
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
</style>