import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          localStorage.removeItem('token')
          window.location.href = '/login'
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.error || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error.response?.data || error)
  }
)

// 认证相关API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
}

// 用户相关API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  getUserStats: (id) => api.get(`/users/${id}/stats`)
}

// 科目相关API
export const subjectAPI = {
  getSubjects: () => api.get('/subjects'),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  getSubjectChapters: (id) => api.get(`/subjects/${id}/chapters`),
  getSubjectKnowledgePoints: (id, params) => api.get(`/subjects/${id}/knowledge-points`, { params }),
  getSubjectStats: (id) => api.get(`/subjects/${id}/stats`)
}

// 题目相关API
export const questionAPI = {
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  createQuestion: (data) => api.post('/questions', data),
  submitAnswer: (id, data) => api.post(`/questions/${id}/answer`, data),
  getRecommendedQuestions: (userId, params) => api.get(`/questions/recommend/${userId}`, { params })
}

// 学习进度API
export const progressAPI = {
  getProgress: (params) => api.get('/progress', { params }),
  updateProgress: (data) => api.post('/progress/update', data),
  getLearningPath: (params) => api.get('/progress/learning-path', { params }),
  getMasteryDistribution: (params) => api.get('/progress/mastery-distribution', { params })
}

// AI相关API
export const aiAPI = {
  generateQuestions: (data) => api.post('/ai/generate', data),
  getGenerationHistory: (params) => api.get('/ai/history', { params }),
  reviewQuestion: (id, data) => api.put(`/ai/review/${id}`, data)
}

export default api