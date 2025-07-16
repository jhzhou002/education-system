const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const { validate, questionSchema } = require('../utils/validation');

const router = express.Router();

// 获取题目列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      subject_id, 
      type, 
      difficulty, 
      grade, 
      chapter_id, 
      knowledge_point_id,
      page = 1, 
      limit = 20 
    } = req.query;
    
    console.log('获取题目列表参数:', { subject_id, type, difficulty, grade, chapter_id, knowledge_point_id, page, limit });
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let sql = `
      SELECT q.id, q.subject_id, q.type, q.content, 
             COALESCE(q.content_format, 'text') as content_format,
             COALESCE(q.options, '[]') as options, 
             q.answer, 
             COALESCE(q.analysis, '') as analysis, 
             q.difficulty, q.grade,
             COALESCE(q.exam_type, '') as exam_type, 
             COALESCE(q.estimated_time, 180) as estimated_time, 
             COALESCE(q.source, '未知') as source, 
             q.created_at,
             COALESCE(s.display_name, '未知科目') as subject_name,
             COALESCE(c.title, '未知章节') as chapter_title
      FROM sl_questions q
      LEFT JOIN sl_subjects s ON q.subject_id = s.id
      LEFT JOIN sl_chapters c ON q.chapter_id = c.id
      WHERE (q.status = '已通过' OR q.status IS NULL)
    `;
    
    const params = [];
    
    if (subject_id && subject_id !== '') {
      sql += ' AND q.subject_id = ?';
      params.push(subject_id);
    }
    
    if (type && type !== '') {
      sql += ' AND q.type = ?';
      params.push(type);
    }
    
    if (difficulty && difficulty !== '') {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    
    if (grade && grade !== '') {
      sql += ' AND q.grade = ?';
      params.push(grade);
    }
    
    if (chapter_id && chapter_id !== '') {
      sql += ' AND q.chapter_id = ?';
      params.push(chapter_id);
    }
    
    if (knowledge_point_id && knowledge_point_id !== '') {
      sql += ` AND q.id IN (
        SELECT qkp.question_id FROM sl_question_knowledge_points qkp 
        WHERE qkp.knowledge_point_id = ?
      )`;
      params.push(knowledge_point_id);
    }
    
    // 获取总数
    const countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = await query(countSql, [...params]);
    const total = totalResult[0].total;
    
    // 获取题目列表
    sql += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
    const queryParams = [...params, parseInt(limit), parseInt(offset)];
    
    const questions = await query(sql, queryParams);
    
    // 获取每个题目的知识点
    for (let question of questions) {
      const knowledgePoints = await query(`
        SELECT kp.id, kp.name, qkp.weight, qkp.is_primary
        FROM sl_question_knowledge_points qkp
        JOIN sl_knowledge_points kp ON qkp.knowledge_point_id = kp.id
        WHERE qkp.question_id = ?
        ORDER BY qkp.is_primary DESC, qkp.weight DESC
      `, [question.id]);
      
      question.knowledge_points = knowledgePoints;
    }
    
    res.json({
      message: '获取题目列表成功',
      questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({ error: '获取题目列表失败' });
  }
});

// 获取单个题目详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;
    
    const questions = await query(`
      SELECT q.*, s.display_name as subject_name, c.title as chapter_title
      FROM sl_questions q
      LEFT JOIN sl_subjects s ON q.subject_id = s.id
      LEFT JOIN sl_chapters c ON q.chapter_id = c.id
      WHERE q.id = ? AND q.status = '已通过'
    `, [questionId]);
    
    if (questions.length === 0) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    const question = questions[0];
    
    // 获取题目关联的知识点
    const knowledgePoints = await query(`
      SELECT kp.id, kp.name, kp.code, qkp.weight, qkp.is_primary
      FROM sl_question_knowledge_points qkp
      JOIN sl_knowledge_points kp ON qkp.knowledge_point_id = kp.id
      WHERE qkp.question_id = ?
      ORDER BY qkp.is_primary DESC, qkp.weight DESC
    `, [questionId]);
    
    question.knowledge_points = knowledgePoints;
    
    // 获取用户答题记录（如果存在）
    const userAnswers = await query(`
      SELECT user_answer, is_correct, score, time_spent, created_at
      FROM sl_user_answers
      WHERE user_id = ? AND question_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [req.user.id, questionId]);
    
    question.user_answer = userAnswers.length > 0 ? userAnswers[0] : null;
    
    res.json({
      message: '获取题目详情成功',
      question
    });
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({ error: '获取题目详情失败' });
  }
});

// 创建题目（教师/管理员）
router.post('/', authenticateToken, requireTeacher, validate(questionSchema), async (req, res) => {
  try {
    const {
      subject_id,
      type,
      content,
      content_format,
      options,
      answer,
      analysis,
      difficulty,
      chapter_id,
      grade,
      exam_type,
      knowledge_point_ids
    } = req.body;
    
    await transaction(async (connection) => {
      // 插入题目
      const [result] = await connection.execute(`
        INSERT INTO sl_questions (
          subject_id, type, content, content_format, options, answer, 
          analysis, difficulty, chapter_id, grade, exam_type, 
          source, created_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '人工录入', ?, '已通过')
      `, [
        subject_id, type, content, content_format || 'latex',
        JSON.stringify(options || []), JSON.stringify(answer),
        analysis || '', difficulty || 1, chapter_id, grade,
        exam_type, req.user.id
      ]);
      
      const questionId = result.insertId;
      
      // 关联知识点
      if (knowledge_point_ids && knowledge_point_ids.length > 0) {
        for (let i = 0; i < knowledge_point_ids.length; i++) {
          const kpId = knowledge_point_ids[i];
          const weight = 1.0 / knowledge_point_ids.length;
          const isPrimary = i === 0; // 第一个知识点为主要知识点
          
          await connection.execute(`
            INSERT INTO sl_question_knowledge_points (question_id, knowledge_point_id, weight, is_primary)
            VALUES (?, ?, ?, ?)
          `, [questionId, kpId, weight, isPrimary]);
        }
      }
      
      return questionId;
    });
    
    res.status(201).json({
      message: '题目创建成功'
    });
  } catch (error) {
    console.error('创建题目错误:', error);
    res.status(500).json({ error: '创建题目失败' });
  }
});

// 提交答案
router.post('/:id/answer', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { user_answer, time_spent, session_id } = req.body;
    
    if (!user_answer) {
      return res.status(400).json({ error: '答案不能为空' });
    }
    
    // 获取题目信息
    const questions = await query(
      'SELECT answer, type, difficulty FROM sl_questions WHERE id = ? AND status = "已通过"',
      [questionId]
    );
    
    if (questions.length === 0) {
      return res.status(404).json({ error: '题目不存在' });
    }
    
    const question = questions[0];
    const correctAnswer = JSON.parse(question.answer);
    
    // 判断答案正确性
    let isCorrect = false;
    let score = 0;
    
    if (question.type === '单选' || question.type === '填空') {
      isCorrect = JSON.stringify(user_answer) === JSON.stringify(correctAnswer);
      score = isCorrect ? 100 : 0;
    } else if (question.type === '多选') {
      // 多选题按部分分计算
      const userSet = new Set(Array.isArray(user_answer) ? user_answer : [user_answer]);
      const correctSet = new Set(correctAnswer);
      
      const intersection = new Set([...userSet].filter(x => correctSet.has(x)));
      const union = new Set([...userSet, ...correctSet]);
      
      score = union.size > 0 ? Math.round((intersection.size / union.size) * 100) : 0;
      isCorrect = userSet.size === correctSet.size && intersection.size === correctSet.size;
    }
    
    // 记录答题结果
    await query(`
      INSERT INTO sl_user_answers (user_id, question_id, user_answer, is_correct, score, time_spent, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, questionId, JSON.stringify(user_answer), isCorrect, score, time_spent || 0, session_id || '']);
    
    // 更新题目错误率统计
    const answerStats = await query(`
      SELECT 
        COUNT(*) as total_answers,
        COUNT(CASE WHEN is_correct = false THEN 1 END) as wrong_answers
      FROM sl_user_answers
      WHERE question_id = ?
    `, [questionId]);
    
    if (answerStats.length > 0 && answerStats[0].total_answers > 0) {
      const errorRate = answerStats[0].wrong_answers / answerStats[0].total_answers;
      await query('UPDATE sl_questions SET error_rate = ? WHERE id = ?', [errorRate, questionId]);
    }
    
    res.json({
      message: '答案提交成功',
      result: {
        is_correct: isCorrect,
        score,
        correct_answer: correctAnswer,
        explanation: isCorrect ? '回答正确！' : '回答错误，请查看解析'
      }
    });
  } catch (error) {
    console.error('提交答案错误:', error);
    res.status(500).json({ error: '提交答案失败' });
  }
});

// 获取推荐题目
router.get('/recommend/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    
    // 权限检查：只能查看自己的推荐或管理员/教师可以查看他人的
    if (req.user.id != targetUserId && !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: '无权查看他人的推荐题目' });
    }
    
    const { subject_id, limit = 10 } = req.query;
    
    // 获取用户薄弱的知识点
    const weakKnowledgePoints = await query(`
      SELECT up.knowledge_point_id, up.mastery_level, kp.difficulty_level
      FROM sl_user_progress up
      JOIN sl_knowledge_points kp ON up.knowledge_point_id = kp.id
      WHERE up.user_id = ? 
        AND up.mastery_level < 0.8 
        ${subject_id ? 'AND kp.subject_id = ?' : ''}
      ORDER BY up.mastery_level ASC, kp.exam_frequency DESC
      LIMIT 5
    `, subject_id ? [targetUserId, subject_id] : [targetUserId]);
    
    if (weakKnowledgePoints.length === 0) {
      return res.json({
        message: '暂无推荐题目',
        questions: []
      });
    }
    
    // 根据薄弱知识点推荐题目
    const knowledgePointIds = weakKnowledgePoints.map(kp => kp.knowledge_point_id);
    
    const recommendedQuestions = await query(`
      SELECT DISTINCT q.id, q.type, q.content, q.difficulty, q.estimated_time,
             s.display_name as subject_name
      FROM sl_questions q
      JOIN sl_question_knowledge_points qkp ON q.id = qkp.question_id
      JOIN sl_subjects s ON q.subject_id = s.id
      WHERE qkp.knowledge_point_id IN (${knowledgePointIds.map(() => '?').join(',')})
        AND q.status = '已通过'
        AND q.id NOT IN (
          SELECT question_id FROM sl_user_answers 
          WHERE user_id = ? AND is_correct = true
        )
      ORDER BY q.difficulty ASC, RAND()
      LIMIT ?
    `, [...knowledgePointIds, targetUserId, parseInt(limit)]);
    
    res.json({
      message: '获取推荐题目成功',
      questions: recommendedQuestions,
      weak_knowledge_points: weakKnowledgePoints
    });
  } catch (error) {
    console.error('获取推荐题目错误:', error);
    res.status(500).json({ error: '获取推荐题目失败' });
  }
});

module.exports = router;