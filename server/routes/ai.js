const express = require('express');
const axios = require('axios');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { validate, aiGenerateSchema } = require('../utils/validation');

const router = express.Router();

// AI模型配置
const AI_MODELS = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat'
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: process.env.QWEN_API_KEY,
    model: 'qwen-plus'
  },
  kimi: {
    url: 'https://api.moonshot.cn/v1/chat/completions',
    apiKey: process.env.KIMI_API_KEY,
    model: 'moonshot-v1-8k'
  }
};

// 构建题目生成提示词
function buildPrompt(subject, knowledgePoints, questionType, difficulty, specialRequirements) {
  const difficultyMap = {
    1: '简单',
    2: '较易',
    3: '中等',
    4: '较难',
    5: '困难'
  };
  
  const subjectMap = {
    'mathematics': '数学',
    'physics': '物理',
    'chemistry': '化学',
    'biology': '生物'
  };
  
  return `你是一个专业的${subjectMap[subject] || '数学'}教师，请根据以下要求生成高质量的题目：

## 基本要求
- 科目：${subjectMap[subject] || '数学'}
- 知识点：${knowledgePoints.map(kp => kp.name).join('、')}
- 题型：${questionType}
- 难度：${difficultyMap[difficulty]}级

## 输出格式要求
请严格按照以下JSON格式输出，不要包含任何其他文字：

{
  "content": "题目内容（使用LaTeX格式表示数学公式）",
  "options": ${questionType.includes('选') ? '["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"]' : 'null'},
  "answer": ${questionType.includes('选') ? '["正确选项的字母"]' : '["答案"]'},
  "analysis": "详细的解题分析（使用LaTeX格式表示数学公式）",
  "estimated_time": 预估答题时间秒数
}

## 内容要求
1. 题目内容要准确、清晰，符合高中${subjectMap[subject] || '数学'}水平
2. 如果是选择题，选项要合理，干扰项要有一定迷惑性
3. 解析要详细，包含解题思路和关键步骤
4. 数学公式使用LaTeX格式，如：$x^2 + 2x + 1 = 0$
5. 题目要与指定知识点紧密相关

${specialRequirements ? `## 特殊要求\n${JSON.stringify(specialRequirements, null, 2)}` : ''}

请生成符合要求的题目：`;
}

// AI生成题目
router.post('/generate', authenticateToken, requireTeacher, validate(aiGenerateSchema), async (req, res) => {
  try {
    const {
      subject_id,
      knowledge_point_ids,
      question_type,
      difficulty,
      count,
      special_requirements
    } = req.body;
    
    // 获取科目信息
    const subjects = await query('SELECT code, name FROM sl_subjects WHERE id = ?', [subject_id]);
    if (subjects.length === 0) {
      return res.status(404).json({ error: '科目不存在' });
    }
    
    const subject = subjects[0];
    
    // 获取知识点信息
    const knowledgePoints = await query(
      `SELECT id, name, description FROM sl_knowledge_points 
       WHERE id IN (${knowledge_point_ids.map(() => '?').join(',')})`,
      knowledge_point_ids
    );
    
    if (knowledgePoints.length !== knowledge_point_ids.length) {
      return res.status(400).json({ error: '部分知识点不存在' });
    }
    
    const generatedQuestions = [];
    const errors = [];
    
    // 生成指定数量的题目
    for (let i = 0; i < count; i++) {
      try {
        const prompt = buildPrompt(
          subject.code,
          knowledgePoints,
          question_type,
          difficulty,
          special_requirements
        );
        
        // 调用AI模型（默认使用Deepseek）
        const aiResponse = await callAIModel('deepseek', prompt);
        
        if (aiResponse && aiResponse.content) {
          try {
            const questionData = JSON.parse(aiResponse.content);
            
            // 验证生成的题目格式
            if (validateGeneratedQuestion(questionData, question_type)) {
              await transaction(async (connection) => {
                // 插入题目
                const [result] = await connection.execute(`
                  INSERT INTO sl_questions (
                    subject_id, type, content, options, answer, analysis,
                    difficulty, grade, source, generation_model, 
                    estimated_time, created_by, status
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AI生成', 'deepseek', ?, ?, '待审核')
                `, [
                  subject_id,
                  question_type,
                  questionData.content,
                  JSON.stringify(questionData.options || []),
                  JSON.stringify(questionData.answer),
                  questionData.analysis,
                  difficulty,
                  '高一', // 默认年级
                  questionData.estimated_time || 180,
                  req.user.id
                ]);
                
                const questionId = result.insertId;
                
                // 关联知识点
                for (let j = 0; j < knowledge_point_ids.length; j++) {
                  const kpId = knowledge_point_ids[j];
                  const weight = 1.0 / knowledge_point_ids.length;
                  const isPrimary = j === 0;
                  
                  await connection.execute(`
                    INSERT INTO sl_question_knowledge_points 
                    (question_id, knowledge_point_id, weight, is_primary)
                    VALUES (?, ?, ?, ?)
                  `, [questionId, kpId, weight, isPrimary]);
                }
                
                generatedQuestions.push({
                  id: questionId,
                  ...questionData
                });
              });
            } else {
              errors.push(`第${i + 1}题格式验证失败`);
            }
          } catch (parseError) {
            errors.push(`第${i + 1}题JSON解析失败: ${parseError.message}`);
          }
        } else {
          errors.push(`第${i + 1}题AI生成失败`);
        }
      } catch (error) {
        errors.push(`第${i + 1}题生成异常: ${error.message}`);
      }
    }
    
    res.json({
      message: `题目生成完成，成功生成${generatedQuestions.length}题`,
      generated_questions: generatedQuestions,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('AI生成题目错误:', error);
    res.status(500).json({ error: 'AI生成题目失败' });
  }
});

// 调用AI模型
async function callAIModel(modelName, prompt) {
  const model = AI_MODELS[modelName];
  if (!model) {
    throw new Error(`不支持的AI模型: ${modelName}`);
  }
  
  try {
    const response = await axios.post(model.url, {
      model: model.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${model.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      return {
        content: response.data.choices[0].message.content.trim()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`调用${modelName}模型失败:`, error.message);
    throw error;
  }
}

// 验证生成的题目格式
function validateGeneratedQuestion(questionData, questionType) {
  if (!questionData.content || !questionData.answer || !questionData.analysis) {
    return false;
  }
  
  if (questionType.includes('选') && (!questionData.options || !Array.isArray(questionData.options))) {
    return false;
  }
  
  if (!Array.isArray(questionData.answer)) {
    return false;
  }
  
  return true;
}

// 获取AI生成历史
router.get('/history', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const questions = await query(`
      SELECT q.id, q.content, q.type, q.difficulty, q.source, q.generation_model,
             q.status, q.created_at, s.display_name as subject_name,
             u.username as creator_name
      FROM sl_questions q
      JOIN sl_subjects s ON q.subject_id = s.id
      JOIN sl_users u ON q.created_by = u.id
      WHERE q.source = 'AI生成'
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);
    
    const totalResult = await query(
      'SELECT COUNT(*) as total FROM sl_questions WHERE source = "AI生成"'
    );
    const total = totalResult[0].total;
    
    res.json({
      message: '获取AI生成历史成功',
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取AI生成历史错误:', error);
    res.status(500).json({ error: '获取AI生成历史失败' });
  }
});

// 审核AI生成的题目
router.put('/review/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { status, feedback } = req.body;
    
    if (!['已通过', '已拒绝', '需修改'].includes(status)) {
      return res.status(400).json({ error: '无效的审核状态' });
    }
    
    await query(`
      UPDATE sl_questions 
      SET status = ?, reviewed_by = ?, metadata = JSON_SET(COALESCE(metadata, '{}'), '$.review_feedback', ?)
      WHERE id = ? AND source = 'AI生成'
    `, [status, req.user.id, feedback || '', questionId]);
    
    res.json({
      message: '题目审核完成'
    });
  } catch (error) {
    console.error('审核题目错误:', error);
    res.status(500).json({ error: '审核题目失败' });
  }
});

module.exports = router;