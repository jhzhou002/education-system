<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1 class="logo">
          <el-icon><Calculator /></el-icon>
          智学
        </h1>
      </div>
      
      <div class="header-center">
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          @select="handleMenuSelect"
          class="header-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            首页
          </el-menu-item>
          <el-menu-item index="/dashboard/subjects">
            <el-icon><Notebook /></el-icon>
            科目学习
          </el-menu-item>
          <el-menu-item index="/dashboard/practice">
            <el-icon><EditPen /></el-icon>
            题目练习
          </el-menu-item>
          <el-menu-item index="/dashboard/progress">
            <el-icon><TrendCharts /></el-icon>
            学习进度
          </el-menu-item>
          <el-menu-item v-if="authStore.isTeacher" index="/dashboard/admin">
            <el-icon><Setting /></el-icon>
            管理后台
          </el-menu-item>
        </el-menu>
      </div>

      <div class="header-right">
        <el-dropdown @command="handleUserCommand">
          <div class="user-info">
            <el-avatar :size="32" :src="authStore.user?.avatar_url">
              {{ authStore.user?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="username">{{ authStore.user?.nickname || authStore.user?.username }}</span>
            <el-icon class="arrow-down"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人资料
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="dashboard-main">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
import {
  Calculator,
  House,
  Notebook,
  EditPen,
  TrendCharts,
  Setting,
  User,
  SwitchButton,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeIndex = computed(() => route.path)

const handleMenuSelect = (index) => {
  router.push(index)
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/dashboard/profile')
      break
    case 'settings':
      ElMessage.info('设置功能开发中...')
      break
    case 'logout':
      ElMessageBox.confirm('确认要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        router.push('/login')
      }).catch(() => {
        // 用户取消
      })
      break
  }
}

onMounted(() => {
  // 初始化用户信息
  if (!authStore.user) {
    authStore.getCurrentUser().catch(() => {
      router.push('/login')
    })
  }
})
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.dashboard-header {
  height: 60px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 1000;
}

.header-left .logo {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-menu {
  border: none;
  background: transparent;
}

.header-menu .el-menu-item {
  border: none !important;
  font-weight: 500;
}

.header-menu .el-menu-item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.header-menu .el-menu-item.is-active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: rgba(102, 126, 234, 0.1);
}

.username {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.arrow-down {
  font-size: 12px;
  color: #909399;
}

.dashboard-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 0 16px;
  }
  
  .header-center {
    display: none;
  }
  
  .header-left .logo {
    font-size: 20px;
  }
  
  .username {
    display: none;
  }
}

:deep(.el-menu--horizontal > .el-menu-item) {
  height: 60px;
  line-height: 60px;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 8px;
}
</style>