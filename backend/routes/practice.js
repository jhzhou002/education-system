const express = require('express');
const axios = require('axios');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// AI生成题目的提示词模板
function buildPrompt(difficulty) {
  const difficultyMap = {
    1: '简单',
    2: '较易', 
    3: '中等',
    4: '较难',
    5: '困难'
  };
  
  return `你是一个专业的高中数学教师，请生成12道${difficultyMap[difficulty]}难度的数学选择题。

## 要求：
1. 每道题必须是标准的单选题，有A、B、C、D四个选项
2. 题目内容要准确、清晰，符合高中数学水平
3. 选项要合理，干扰项要有一定迷惑性
4. 必须包含详细的解题分析
5. 数学公式可以用LaTeX格式表示，如：$x^2 + 2x + 1 = 0$

## 输出格式：
请严格按照以下JSON数组格式输出12道题，不要包含任何其他文字：

[
  {
    "content": "题目内容",
    "option_a": "A. 选项内容",
    "option_b": "B. 选项内容", 
    "option_c": "C. 选项内容",
    "option_d": "D. 选项内容",
    "correct_answer": "A",
    "explanation": "详细解析"
  },
  ... (共12道题)
]

请开始生成题目：`;
}

// 调用AI生成题目
async function generateQuestionsWithAI(difficulty) {
  try {
    const prompt = buildPrompt(difficulty);
    
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content.trim();
      
      // 尝试解析JSON
      try {
        const questions = JSON.parse(content);
        if (Array.isArray(questions) && questions.length === 12) {
          return questions;
        }
      } catch (parseError) {
        console.error('AI返回内容解析失败:', parseError);
        console.error('AI返回内容:', content);
      }
    }
    
    return null;
  } catch (error) {
    console.error('调用AI生成题目失败:', error.message);
    return null;
  }
}

// 开始天天练
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { difficulty } = req.body;
    
    // 验证难度参数
    if (!difficulty || difficulty < 1 || difficulty > 5) {
      return res.status(400).json({ error: '请选择有效的难度等级(1-5)' });
    }
    
    // 调用AI生成题目
    const aiQuestions = await generateQuestionsWithAI(difficulty);
    
    if (!aiQuestions) {
      // 如果AI生成失败，从数据库中随机选择题目
      const dbQuestions = await query(
        'SELECT * FROM questions WHERE difficulty = ? ORDER BY RAND() LIMIT 12',
        [difficulty]
      );
      
      if (dbQuestions.length === 0) {
        return res.status(500).json({ error: '暂无该难度的题目，请稍后再试' });
      }
      
      // 创建练习记录
      const questionIds = dbQuestions.map(q => q.id);
      const result = await query(
        'INSERT INTO practice_records (user_id, questions, difficulty) VALUES (?, ?, ?)',
        [req.user.id, JSON.stringify(questionIds), difficulty]
      );
      
      return res.json({
        message: '练习开始',
        practice_id: result.insertId,
        questions: dbQuestions.map(q => ({
          id: q.id,
          content: q.content,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d
        }))
      });
    }
    
    // 使用AI生成的题目
    await transaction(async (connection) => {
      const questionIds = [];
      
      // 将AI生成的题目保存到数据库
      for (const aiQuestion of aiQuestions) {
        const [result] = await connection.execute(
          'INSERT INTO questions (content, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            aiQuestion.content,
            aiQuestion.option_a,
            aiQuestion.option_b,
            aiQuestion.option_c,
            aiQuestion.option_d,
            aiQuestion.correct_answer,
            aiQuestion.explanation,
            difficulty
          ]
        );
        questionIds.push(result.insertId);
      }
      
      // 创建练习记录
      const [practiceResult] = await connection.execute(
        'INSERT INTO practice_records (user_id, questions, difficulty) VALUES (?, ?, ?)',
        [req.user.id, JSON.stringify(questionIds), difficulty]
      );
      
      res.json({
        message: '练习开始',
        practice_id: practiceResult.insertId,
        questions: aiQuestions.map((q, index) => ({
          id: questionIds[index],
          content: q.content,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d
        }))
      });
    });
    
  } catch (error) {
    console.error('开始练习错误:', error);
    res.status(500).json({ error: '开始练习失败' });
  }
});

// 提交答案
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { practice_id, answers } = req.body;
    
    if (!practice_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: '请提供有效的练习ID和答案' });
    }
    
    // 获取练习记录
    const practiceRecords = await query(
      'SELECT * FROM practice_records WHERE id = ? AND user_id = ?',
      [practice_id, req.user.id]
    );
    
    if (practiceRecords.length === 0) {
      return res.status(404).json({ error: '练习记录不存在' });
    }
    
    const practiceRecord = practiceRecords[0];
    const questionIds = JSON.parse(practiceRecord.questions);
    
    if (answers.length !== questionIds.length) {
      return res.status(400).json({ error: '答案数量不匹配' });
    }
    
    // 获取题目的正确答案
    const questions = await query(
      `SELECT id, correct_answer, explanation FROM questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
      questionIds
    );
    
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q.id] = q;
    });
    
    // 计算分数和保存答题记录
    let correctCount = 0;
    const results = [];
    
    await transaction(async (connection) => {
      for (let i = 0; i < answers.length; i++) {
        const questionId = questionIds[i];
        const userAnswer = answers[i];
        const correctAnswer = questionMap[questionId].correct_answer;
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) {
          correctCount++;
        }
        
        // 保存答题记录
        await connection.execute(
          'INSERT INTO user_answers (user_id, question_id, practice_record_id, user_answer, is_correct) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, questionId, practice_id, userAnswer, isCorrect]
        );
        
        results.push({
          question_id: questionId,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          is_correct: isCorrect,
          explanation: questionMap[questionId].explanation
        });
      }
      
      // 更新练习记录
      const score = Math.round((correctCount / answers.length) * 100);
      await connection.execute(
        'UPDATE practice_records SET answers = ?, score = ?, completed_at = NOW() WHERE id = ?',
        [JSON.stringify(answers), score, practice_id]
      );
    });
    
    res.json({
      message: '答案提交成功',
      score: Math.round((correctCount / answers.length) * 100),
      correct_count: correctCount,
      total_count: answers.length,
      results
    });
    
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({ error: '提交答案失败' });
  }
});

module.exports = router;