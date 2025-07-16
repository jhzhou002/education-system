import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register', 
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'subjects',
        name: 'Subjects',
        component: () => import('../views/Subjects.vue')
      },
      {
        path: 'subjects/:id',
        name: 'SubjectDetail',
        component: () => import('../views/SubjectDetail.vue')
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('../views/Practice.vue')
      },
      {
        path: 'practice/:questionId',
        name: 'Question',
        component: () => import('../views/Question.vue')
      },
      {
        path: 'progress',
        name: 'Progress',
        component: () => import('../views/Progress.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { requiresRole: ['admin', 'teacher'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // 检查角色权限
  if (to.meta.requiresRole && authStore.isAuthenticated) {
    if (!to.meta.requiresRole.includes(authStore.user?.role)) {
      ElMessage.error('权限不足')
      next('/dashboard')
      return
    }
  }
  
  // 已登录用户访问登录/注册页面，重定向到首页
  if (to.meta.requiresAuth === false && authStore.isAuthenticated && ['Login', 'Register'].includes(to.name)) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router