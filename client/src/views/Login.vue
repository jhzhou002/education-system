<template>
  <div class="login-container">
    <div class="login-background">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <h1 class="logo">
          <el-icon class="logo-icon"><Operation /></el-icon>
          智学
        </h1>
        <p class="subtitle">智能学习平台 · 个性化教育</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @submit.prevent="handleLogin"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名或邮箱"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="authStore.loading"
            class="login-button"
            block
          >
            <template v-if="!authStore.loading">
              登录
            </template>
            <template v-else>
              登录中...
            </template>
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <el-link @click="$router.push('/register')">
            还没有账号？立即注册
          </el-link>
        </div>
      </el-form>

      <div class="demo-accounts">
        <el-divider>演示账号</el-divider>
        <div class="demo-buttons">
          <el-button
            size="small"
            @click="setDemoAccount('student')"
            icon="User"
          >
            学生账号
          </el-button>
          <el-button
            size="small"
            @click="setDemoAccount('teacher')"
            icon="UserFilled"
          >
            教师账号
          </el-button>
          <el-button
            size="small"
            @click="setDemoAccount('admin')"
            icon="Trophy"
          >
            管理员
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { 
  Operation, 
  User, 
  Lock, 
  UserFilled, 
  Trophy 
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref()

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    await authStore.login(loginForm)
    router.push('/dashboard')
  } catch (error) {
    console.error('登录失败:', error)
  }
}

const setDemoAccount = (role) => {
  const accounts = {
    student: { username: 'student', password: 'admin123' },
    teacher: { username: 'teacher', password: 'admin123' },
    admin: { username: 'admin', password: 'admin123' }
  }
  
  const account = accounts[role]
  loginForm.username = account.username
  loginForm.password = account.password
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  background: white;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  background: white;
  top: 70%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  background: white;
  top: 30%;
  right: 30%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.login-card {
  width: 400px;
  max-width: 90vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo-icon {
  font-size: 42px;
}

.subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-button {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.demo-accounts {
  margin-top: 30px;
}

.demo-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.demo-buttons .el-button {
  flex: 1;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}
</style>