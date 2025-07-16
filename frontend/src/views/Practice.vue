<template>
  <div class="practice-container">
    <div class="header">
      <h1 class="title">天天练</h1>
      <div class="progress-info">
        <span>题目 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</span>
        <el-progress 
          :percentage="Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)"
          :stroke-width="6"
          style="width: 200px; margin-left: 16px;"
        />
      </div>
    </div>
    
    <div class="content" v-if="!showResult">
      <div class="question-card">
        <div class="question-number">第 {{ currentQuestionIndex + 1 }} 题</div>
        <div class="question-content" v-html="currentQuestion.content"></div>
        
        <div class="options">
          <div 
            v-for="option in ['A', 'B', 'C', 'D']" 
            :key="option"
            class="option-item"
            :class="{ selected: selectedAnswer === option }"
            @click="selectAnswer(option)"
          >
            <div class="option-label">{{ option }}</div>
            <div class="option-content" v-html="currentQuestion['option_' + option.toLowerCase()]"></div>
          </div>
        </div>
        
        <div class="question-actions">
          <el-button 
            v-if="currentQuestionIndex > 0"
            @click="prevQuestion"
            size="large"
          >
            上一题
          </el-button>
          
          <el-button 
            v-if="currentQuestionIndex < totalQuestions - 1"
            type="primary"
            @click="nextQuestion"
            size="large"
            :disabled="!selectedAnswer"
          >
            下一题
          </el-button>
          
          <el-button 
            v-else
            type="success"
            @click="submitAnswers"
            size="large"
            :disabled="!selectedAnswer"
            :loading="submitting"
          >
            提交答案
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 结果页面 -->
    <div class="result-container" v-if="showResult">
      <div class="result-card">
        <div class="result-header">
          <div class="score-display">
            <div class="score-number">{{ result.score }}</div>
            <div class="score-label">分</div>
          </div>
          <div class="result-stats">
            <div class="stat-item">
              <div class="stat-number">{{ result.correct_count }}</div>
              <div class="stat-label">正确</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ result.total_count - result.correct_count }}</div>
              <div class="stat-label">错误</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ result.total_count }}</div>
              <div class="stat-label">总计</div>
            </div>
          </div>
        </div>
        
        <div class="result-details">
          <h3>答题详情</h3>
          <div class="question-results">
            <div 
              v-for="(item, index) in result.results" 
              :key="index"
              class="question-result-item"
              :class="{ correct: item.is_correct, incorrect: !item.is_correct }"
            >
              <div class="question-result-header">
                <span class="question-number">第 {{ index + 1 }} 题</span>
                <span class="result-icon">{{ item.is_correct ? '✓' : '✗' }}</span>
              </div>
              <div class="answer-info">
                <span>您的答案: {{ item.user_answer }}</span>
                <span>正确答案: {{ item.correct_answer }}</span>
              </div>
              <div class="explanation" v-if="item.explanation">
                <strong>解析:</strong> {{ item.explanation }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="result-actions">
          <el-button type="primary" @click="backToHome" size="large">
            返回首页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

export default {
  name: 'Practice',
  setup() {
    const router = useRouter()
    const questions = ref([])
    const practiceId = ref(null)
    const currentQuestionIndex = ref(0)
    const answers = ref([])
    const selectedAnswer = ref('')
    const submitting = ref(false)
    const showResult = ref(false)
    const result = ref({})
    
    const totalQuestions = computed(() => questions.value.length)
    const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || {})
    
    const selectAnswer = (option) => {
      selectedAnswer.value = option
      answers.value[currentQuestionIndex.value] = option
    }
    
    const nextQuestion = () => {
      if (currentQuestionIndex.value < totalQuestions.value - 1) {
        currentQuestionIndex.value++
        selectedAnswer.value = answers.value[currentQuestionIndex.value] || ''
      }
    }
    
    const prevQuestion = () => {
      if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--
        selectedAnswer.value = answers.value[currentQuestionIndex.value] || ''
      }
    }
    
    const submitAnswers = async () => {
      try {
        submitting.value = true
        
        const response = await api.post('/practice/submit', {
          practice_id: practiceId.value,
          answers: answers.value
        })
        
        result.value = response
        showResult.value = true
        
        ElMessage.success('答案提交成功！')
      } catch (error) {
        console.error('提交答案失败:', error)
      } finally {
        submitting.value = false
      }
    }
    
    const backToHome = () => {
      sessionStorage.removeItem('practiceData')
      router.push('/home')
    }
    
    onMounted(() => {
      const practiceData = sessionStorage.getItem('practiceData')
      if (!practiceData) {
        ElMessage.error('没有找到练习数据')
        router.push('/home')
        return
      }
      
      const data = JSON.parse(practiceData)
      practiceId.value = data.practice_id
      questions.value = data.questions
      answers.value = new Array(questions.value.length).fill('')
    })
    
    return {
      questions,
      currentQuestionIndex,
      totalQuestions,
      currentQuestion,
      selectedAnswer,
      answers,
      submitting,
      showResult,
      result,
      selectAnswer,
      nextQuestion,
      prevQuestion,
      submitAnswers,
      backToHome
    }
  }
}
</script>

<style scoped>
.practice-container {
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

.progress-info {
  display: flex;
  align-items: center;
  color: white;
  font-size: 16px;
}

.content {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.question-number {
  font-size: 18px;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 16px;
}

.question-content {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 32px;
  color: #333;
}

.options {
  margin-bottom: 32px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.option-item.selected {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.option-label {
  font-weight: bold;
  margin-right: 12px;
  min-width: 24px;
}

.option-content {
  flex: 1;
  line-height: 1.5;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.question-actions .el-button {
  padding: 12px 24px;
}

/* 结果页面样式 */
.result-container {
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.result-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 2px solid #e9ecef;
}

.score-display {
  display: flex;
  align-items: baseline;
  margin-right: 48px;
}

.score-number {
  font-size: 72px;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 24px;
  color: #666;
  margin-left: 8px;
}

.result-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.result-details h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
}

.question-results {
  max-height: 400px;
  overflow-y: auto;
}

.question-result-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.question-result-item.correct {
  border-color: #28a745;
  background: #f8fff9;
}

.question-result-item.incorrect {
  border-color: #dc3545;
  background: #fff8f8;
}

.question-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-number {
  font-weight: bold;
  color: #333;
}

.result-icon {
  font-size: 20px;
  font-weight: bold;
}

.correct .result-icon {
  color: #28a745;
}

.incorrect .result-icon {
  color: #dc3545;
}

.answer-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 14px;
}

.explanation {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.result-actions {
  text-align: center;
  margin-top: 32px;
}

.result-actions .el-button {
  padding: 12px 32px;
}
</style>