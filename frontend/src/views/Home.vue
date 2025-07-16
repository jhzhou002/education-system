<template>
  <div class="home-container">
    <div class="header">
      <h1 class="title">天天练</h1>
      <div class="user-info">
        <span>欢迎, {{ user.username }}</span>
        <el-button type="text" @click="handleLogout">退出</el-button>
      </div>
    </div>
    
    <div class="content">
      <div class="welcome-card">
        <h2>数学天天练</h2>
        <p>选择难度，开始今天的数学练习</p>
      </div>
      
      <div class="difficulty-selection">
        <h3>选择难度</h3>
        <div class="difficulty-cards">
          <div 
            v-for="level in difficultyLevels" 
            :key="level.value"
            class="difficulty-card"
            :class="{ active: selectedDifficulty === level.value }"
            @click="selectedDifficulty = level.value"
          >
            <div class="difficulty-icon">{{ level.icon }}</div>
            <div class="difficulty-name">{{ level.name }}</div>
            <div class="difficulty-desc">{{ level.desc }}</div>
          </div>
        </div>
      </div>
      
      <div class="start-practice">
        <el-button 
          type="primary" 
          size="large"
          @click="startPractice"
          :loading="loading"
          :disabled="!selectedDifficulty"
        >
          开始练习 (12题)
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const selectedDifficulty = ref(null)
    const user = ref({})
    
    const difficultyLevels = [
      {
        value: 1,
        name: '简单',
        icon: '😊',
        desc: '基础题型，适合入门'
      },
      {
        value: 2,
        name: '较易',
        icon: '🙂',
        desc: '稍有难度，巩固基础'
      },
      {
        value: 3,
        name: '中等',
        icon: '😐',
        desc: '中等难度，提升能力'
      },
      {
        value: 4,
        name: '较难',
        icon: '😤',
        desc: '有挑战性，考验实力'
      },
      {
        value: 5,
        name: '困难',
        icon: '😰',
        desc: '高难度，挑战极限'
      }
    ]
    
    const startPractice = async () => {
      if (!selectedDifficulty.value) {
        ElMessage.warning('请选择难度等级')
        return
      }
      
      try {
        loading.value = true
        
        const response = await api.post('/practice/start', {
          difficulty: selectedDifficulty.value
        })
        
        // 将题目数据存储到 sessionStorage
        sessionStorage.setItem('practiceData', JSON.stringify({
          practice_id: response.practice_id,
          questions: response.questions,
          difficulty: selectedDifficulty.value
        }))
        
        ElMessage.success('题目生成成功，开始练习！')
        router.push('/practice')
      } catch (error) {
        console.error('开始练习失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handleLogout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.clear()
      router.push('/login')
    }
    
    onMounted(() => {
      const userData = localStorage.getItem('user')
      if (userData) {
        user.value = JSON.parse(userData)
      }
    })
    
    return {
      user,
      selectedDifficulty,
      difficultyLevels,
      loading,
      startPractice,
      handleLogout
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.title {
  color: white;
  font-size: 28px;
  font-weight: bold;
}

.user-info {
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
}

.content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.welcome-card h2 {
  font-size: 32px;
  color: #333;
  margin-bottom: 16px;
}

.welcome-card p {
  font-size: 18px;
  color: #666;
}

.difficulty-selection {
  background: white;
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.difficulty-selection h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}

.difficulty-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.difficulty-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.difficulty-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.difficulty-card.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.difficulty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.difficulty-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.difficulty-desc {
  font-size: 14px;
  opacity: 0.8;
}

.start-practice {
  text-align: center;
}

.start-practice .el-button {
  font-size: 18px;
  padding: 16px 48px;
  border-radius: 8px;
}
</style>