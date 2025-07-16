import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { authAPI } from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => ['admin', 'teacher'].includes(user.value?.role))
  const isStudent = computed(() => user.value?.role === 'student')

  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      try {
        await getCurrentUser()
      } catch (error) {
        logout()
      }
    }
  }

  // 登录
  const login = async (credentials) => {
    loading.value = true
    try {
      const response = await authAPI.login(credentials)
      
      token.value = response.token
      user.value = response.user
      
      localStorage.setItem('token', response.token)
      
      ElMessage.success('登录成功')
      return response
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    loading.value = true
    try {
      const response = await authAPI.register(userData)
      
      ElMessage.success('注册成功，请登录')
      return response
    } catch (error) {
      ElMessage.error(error.message || '注册失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser()
      user.value = response.user
      return response
    } catch (error) {
      throw error
    }
  }

  // 刷新token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken()
      token.value = response.token
      localStorage.setItem('token', response.token)
      return response
    } catch (error) {
      logout()
      throw error
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    ElMessage.success('已退出登录')
  }

  // 更新用户信息
  const updateUser = (newUserData) => {
    if (user.value) {
      user.value = { ...user.value, ...newUserData }
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    initAuth,
    login,
    register,
    getCurrentUser,
    refreshToken,
    logout,
    updateUser
  }
})