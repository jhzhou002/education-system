<template>
  <div class="question-container">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="question" class="question-content">
      <div class="question-header">
        <el-button @click="$router.back()" icon="ArrowLeft" circle />
        <div class="question-meta">
          <el-tag :type="getDifficultyType(question.difficulty)">
            {{ getDifficultyText(question.difficulty) }}
          </el-tag>
          <span class="question-type">{{ question.type }}</span>
          <span class="subject-name">{{ question.subject_name }}</span>
        </div>
      </div>

      <div class="question-body">
        <div class="question-text" v-html="question.content"></div>
        
        <div v-if="question.options && question.options.length > 0" class="question-options">
          <div
            v-for="(option, index) in question.options"
            :key="index"
            class="option-item"
            :class="{
              selected: selectedAnswer === option,
              correct: showResult && isCorrectOption(option),
              wrong: showResult && selectedAnswer === option && !isCorrectOption(option)
            }"
            @click="selectOption(option)"
          >
            {{ option }}
          </div>
        </div>

        <div v-else class="answer-input">
          <el-input
            v-model="textAnswer"
            placeholder="请输入您的答案"
            type="textarea"
            :rows="3"
            :disabled="showResult"
          />
        </div>
      </div>

      <div class="question-actions">
        <el-button v-if="!showResult" type="primary" @click="submitAnswer" :disabled="!hasAnswer">
          提交答案
        </el-button>
        <el-button v-else @click="nextQuestion">
          下一题
        </el-button>
      </div>

      <div v-if="showResult" class="result-section">
        <div class="result-header">
          <el-icon :size="24" :color="result.is_correct ? '#67C23A' : '#F56C6C'">
            <Check v-if="result.is_correct" />
            <Close v-else />
          </el-icon>
          <span class="result-text">
            {{ result.is_correct ? '回答正确!' : '回答错误' }}
          </span>
          <span class="result-score">得分: {{ result.score }}</span>
        </div>
        
        <div v-if="question.analysis" class="analysis">
          <h4>解析:</h4>
          <div v-html="question.analysis"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionAPI } from '../utils/api'
import { Check, Close } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const question = ref(null)
const selectedAnswer = ref('')
const textAnswer = ref('')
const showResult = ref(false)
const result = ref({})
const startTime = ref(Date.now())

const hasAnswer = computed(() => {
  return question.value?.options ? !!selectedAnswer.value : !!textAnswer.value.trim()
})

const getDifficultyType = (difficulty) => {
  const types = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'danger' }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = { 1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难' }
  return texts[difficulty] || '中等'
}

const selectOption = (option) => {
  if (!showResult.value) {
    selectedAnswer.value = option
  }
}

const isCorrectOption = (option) => {
  return question.value?.answer?.includes(option)
}

const submitAnswer = async () => {
  try {
    const timeSpent = Math.round((Date.now() - startTime.value) / 1000)
    const userAnswer = question.value.options ? [selectedAnswer.value] : [textAnswer.value]
    
    const response = await questionAPI.submitAnswer(question.value.id, {
      user_answer: userAnswer,
      time_spent: timeSpent
    })
    
    result.value = response.result
    showResult.value = true
  } catch (error) {
    ElMessage.error('提交答案失败')
  }
}

const nextQuestion = () => {
  router.push('/dashboard/practice')
}

onMounted(async () => {
  try {
    const questionId = route.params.questionId
    const response = await questionAPI.getQuestionById(questionId)
    question.value = response.question
    startTime.value = Date.now()
  } catch (error) {
    ElMessage.error('获取题目失败')
    router.back()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.question-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-body {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.question-text {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 30px;
  color: #303133;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  padding: 16px 20px;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.option-item:hover {
  border-color: #409eff;
  background: #f8f9fa;
}

.option-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
}

.option-item.correct {
  border-color: #67c23a;
  background: #f0f9ff;
  color: #67c23a;
}

.option-item.wrong {
  border-color: #f56c6c;
  background: #fef0f0;
  color: #f56c6c;
}

.question-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.result-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.result-score {
  margin-left: auto;
  color: #409eff;
}

.analysis {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.analysis h4 {
  margin-bottom: 12px;
  color: #303133;
}
</style>