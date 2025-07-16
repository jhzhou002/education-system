<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>系统设置</h1>
      <p>个性化您的学习体验</p>
    </div>

    <div class="settings-content">
      <el-tabs v-model="activeTab" type="card">
        <!-- 通用设置 -->
        <el-tab-pane label="通用设置" name="general">
          <div class="settings-section">
            <h3>界面设置</h3>
            <el-form :model="settings" label-width="120px">
              <el-form-item label="主题模式">
                <el-radio-group v-model="settings.theme">
                  <el-radio value="light">浅色模式</el-radio>
                  <el-radio value="dark">深色模式</el-radio>
                  <el-radio value="auto">跟随系统</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="settings.language">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
              <el-form-item label="字体大小">
                <el-slider 
                  v-model="settings.fontSize" 
                  :min="12" 
                  :max="18" 
                  :step="1"
                  show-stops
                />
              </el-form-item>
            </el-form>
          </div>
          
          <div class="settings-section">
            <h3>学习偏好</h3>
            <el-form :model="settings" label-width="120px">
              <el-form-item label="默认难度">
                <el-select v-model="settings.defaultDifficulty">
                  <el-option label="简单" :value="1" />
                  <el-option label="中等" :value="3" />
                  <el-option label="困难" :value="5" />
                </el-select>
              </el-form-item>
              <el-form-item label="每页题目数">
                <el-input-number 
                  v-model="settings.questionsPerPage" 
                  :min="5" 
                  :max="50" 
                  :step="5"
                />
              </el-form-item>
              <el-form-item label="自动保存">
                <el-switch v-model="settings.autoSave" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <div class="settings-section">
            <h3>消息通知</h3>
            <el-form :model="settings.notifications" label-width="120px">
              <el-form-item label="学习提醒">
                <el-switch v-model="settings.notifications.studyReminder" />
              </el-form-item>
              <el-form-item label="成就通知">
                <el-switch v-model="settings.notifications.achievements" />
              </el-form-item>
              <el-form-item label="系统消息">
                <el-switch v-model="settings.notifications.system" />
              </el-form-item>
              <el-form-item label="每日推荐">
                <el-switch v-model="settings.notifications.dailyRecommendation" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 隐私设置 -->
        <el-tab-pane label="隐私安全" name="privacy">
          <div class="settings-section">
            <h3>账户安全</h3>
            <el-form label-width="120px">
              <el-form-item label="修改密码">
                <el-button type="primary" @click="showChangePassword = true">
                  修改密码
                </el-button>
              </el-form-item>
              <el-form-item label="登录历史">
                <el-button @click="viewLoginHistory">查看登录记录</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="settings-section">
            <h3>数据控制</h3>
            <el-form label-width="120px">
              <el-form-item label="学习数据">
                <el-switch v-model="settings.privacy.shareStudyData" />
                <div class="form-item-tip">允许分享学习数据用于改进算法</div>
              </el-form-item>
              <el-form-item label="错题收集">
                <el-switch v-model="settings.privacy.collectWrongAnswers" />
                <div class="form-item-tip">收集错题数据用于个性化推荐</div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 导入导出 -->
        <el-tab-pane label="数据管理" name="data">
          <div class="settings-section">
            <h3>数据导出</h3>
            <el-space direction="vertical" size="large">
              <div>
                <el-button type="primary" @click="exportStudyData">
                  导出学习数据
                </el-button>
                <div class="form-item-tip">导出您的学习进度和成绩记录</div>
              </div>
              <div>
                <el-button @click="exportWrongQuestions">
                  导出错题本
                </el-button>
                <div class="form-item-tip">导出您的错题收集</div>
              </div>
            </el-space>
          </div>
          
          <div class="settings-section danger-zone">
            <h3>危险操作</h3>
            <el-space direction="vertical" size="large">
              <div>
                <el-button type="warning" @click="clearStudyData">
                  清空学习数据
                </el-button>
                <div class="form-item-tip">清空所有学习进度（不可恢复）</div>
              </div>
              <div>
                <el-button type="danger" @click="deleteAccount">
                  删除账户
                </el-button>
                <div class="form-item-tip">永久删除账户和所有数据</div>
              </div>
            </el-space>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="settings-actions">
        <el-button type="primary" size="large" @click="saveSettings">
          保存设置
        </el-button>
        <el-button size="large" @click="resetSettings">
          重置默认
        </el-button>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showChangePassword" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="80px">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePassword = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { userAPI } from '../utils/api'

const authStore = useAuthStore()
const activeTab = ref('general')
const showChangePassword = ref(false)

const settings = reactive({
  theme: 'light',
  language: 'zh-CN',
  fontSize: 14,
  defaultDifficulty: 3,
  questionsPerPage: 20,
  autoSave: true,
  notifications: {
    studyReminder: true,
    achievements: true,
    system: true,
    dailyRecommendation: false
  },
  privacy: {
    shareStudyData: true,
    collectWrongAnswers: true
  }
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saveSettings = async () => {
  try {
    // 保存设置到本地存储和服务器
    localStorage.setItem('user-settings', JSON.stringify(settings))
    
    // 应用主题设置
    applyTheme(settings.theme)
    
    // 应用字体大小
    document.documentElement.style.fontSize = `${settings.fontSize}px`
    
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  }
}

const resetSettings = () => {
  ElMessageBox.confirm('确定要重置所有设置吗？', '重置设置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    Object.assign(settings, getDefaultSettings())
    saveSettings()
    ElMessage.success('设置已重置')
  })
}

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    // auto: 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('新密码两次输入不一致')
    return
  }
  
  try {
    await userAPI.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    showChangePassword.value = false
    Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' })
    ElMessage.success('密码修改成功')
  } catch (error) {
    ElMessage.error('密码修改失败')
  }
}

const viewLoginHistory = () => {
  ElMessage.info('登录历史功能正在开发中')
}

const exportStudyData = () => {
  ElMessage.success('学习数据导出功能已启动')
}

const exportWrongQuestions = () => {
  ElMessage.success('错题本导出功能已启动')
}

const clearStudyData = () => {
  ElMessageBox.confirm('确定要清空所有学习数据吗？此操作不可恢复！', '清空数据', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    ElMessage.success('学习数据已清空')
  })
}

const deleteAccount = () => {
  ElMessageBox.confirm('确定要删除账户吗？此操作不可恢复！', '删除账户', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    ElMessage.error('账户删除功能暂时关闭')
  })
}

const getDefaultSettings = () => ({
  theme: 'light',
  language: 'zh-CN',
  fontSize: 14,
  defaultDifficulty: 3,
  questionsPerPage: 20,
  autoSave: true,
  notifications: {
    studyReminder: true,
    achievements: true,
    system: true,
    dailyRecommendation: false
  },
  privacy: {
    shareStudyData: true,
    collectWrongAnswers: true
  }
})

onMounted(() => {
  // 加载保存的设置
  const savedSettings = localStorage.getItem('user-settings')
  if (savedSettings) {
    try {
      Object.assign(settings, JSON.parse(savedSettings))
      applyTheme(settings.theme)
      document.documentElement.style.fontSize = `${settings.fontSize}px`
    } catch (error) {
      console.warn('无法加载设置:', error)
    }
  }
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 30px;
}

.settings-header h1 {
  color: #303133;
  margin-bottom: 8px;
}

.settings-header p {
  color: #909399;
}

.settings-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.settings-section h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 16px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.danger-zone {
  border-left: 3px solid #f56c6c;
  padding-left: 15px;
}

.danger-zone h3 {
  color: #f56c6c;
}

.settings-actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.settings-actions .el-button {
  margin: 0 10px;
}

:deep(.el-tabs__content) {
  padding-top: 20px;
}
</style>