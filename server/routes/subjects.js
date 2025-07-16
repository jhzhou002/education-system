const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireStudent } = require('../middleware/auth');

const router = express.Router();

// 获取所有科目
router.get('/', authenticateToken, async (req, res) => {
  try {
    const subjects = await query(`
      SELECT id, code, name, display_name, description, icon_class, color, 
             sort_order, is_active, created_at 
      FROM sl_subjects 
      ORDER BY sort_order ASC, id ASC
    `);
    
    // 获取用户在各科目的进度统计
    const progressStats = await query(`
      SELECT 
        kp.subject_id,
        COUNT(DISTINCT kp.id) as total_knowledge_points,
        COUNT(DISTINCT up.knowledge_point_id) as learned_knowledge_points,
        COALESCE(AVG(up.mastery_level), 0) as average_mastery
      FROM sl_knowledge_points kp
      LEFT JOIN sl_user_progress up ON kp.id = up.knowledge_point_id AND up.user_id = ?
      WHERE kp.is_active = true
      GROUP BY kp.subject_id
    `, [req.user.id]);
    
    // 合并科目信息和进度统计
    const subjectsWithProgress = subjects.map(subject => {
      const progress = progressStats.find(p => p.subject_id === subject.id) || {
        total_knowledge_points: 0,
        learned_knowledge_points: 0,
        average_mastery: 0
      };
      
      const completionRate = progress.total_knowledge_points > 0 
        ? Math.round((progress.learned_knowledge_points / progress.total_knowledge_points) * 100)
        : 0;
      
      return {
        ...subject,
        user_progress: {
          total_knowledge_points: progress.total_knowledge_points,
          learned_knowledge_points: progress.learned_knowledge_points,
          completion_rate: completionRate,
          average_mastery: Math.round(progress.average_mastery * 100)
        }
      };
    });
    
    res.json({
      message: '获取科目列表成功',
      subjects: subjectsWithProgress
    });
  } catch (error) {
    console.error('获取科目错误:', error);
    res.status(500).json({ error: '获取科目失败' });
  }
});

// 获取特定科目详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    
    const subjects = await query(
      'SELECT * FROM sl_subjects WHERE id = ?',
      [subjectId]
    );
    
    if (subjects.length === 0) {
      return res.status(404).json({ error: '科目不存在' });
    }
    
    res.json({
      message: '获取科目详情成功',
      subject: subjects[0]
    });
  } catch (error) {
    console.error('获取科目详情错误:', error);
    res.status(500).json({ error: '获取科目详情失败' });
  }
});

// 获取科目的章节树
router.get('/:id/chapters', authenticateToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    
    // 获取所有章节
    const chapters = await query(`
      SELECT id, chapter_number, title, parent_id, description, 
             difficulty_level, estimated_hours, sort_order,
             learning_objectives, key_concepts
      FROM sl_chapters 
      WHERE subject_id = ? AND is_active = true
      ORDER BY sort_order ASC, id ASC
    `, [subjectId]);
    
    // 构建章节树
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };
    
    const chapterTree = buildTree(chapters);
    
    res.json({
      message: '获取章节列表成功',
      chapters: chapterTree
    });
  } catch (error) {
    console.error('获取章节错误:', error);
    res.status(500).json({ error: '获取章节失败' });
  }
});

// 获取科目的知识点
router.get('/:id/knowledge-points', authenticateToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { grade, chapter_id, difficulty } = req.query;
    
    let sql = `
      SELECT kp.id, kp.code, kp.name, kp.parent_id, kp.chapter_id,
             kp.grade, kp.semester, kp.is_core, kp.exam_frequency,
             kp.difficulty_level, kp.description, kp.key_concepts,
             kp.formulas, kp.prerequisites, kp.learning_objectives,
             c.title as chapter_title,
             COALESCE(up.mastery_level, 0) as mastery_level,
             up.practice_count, up.correct_count, up.last_practice_at
      FROM sl_knowledge_points kp
      LEFT JOIN sl_chapters c ON kp.chapter_id = c.id
      LEFT JOIN sl_user_progress up ON kp.id = up.knowledge_point_id AND up.user_id = ?
      WHERE kp.subject_id = ? AND kp.is_active = true
    `;
    
    const params = [req.user.id, subjectId];
    
    if (grade) {
      sql += ' AND kp.grade = ?';
      params.push(grade);
    }
    
    if (chapter_id) {
      sql += ' AND kp.chapter_id = ?';
      params.push(chapter_id);
    }
    
    if (difficulty) {
      sql += ' AND kp.difficulty_level = ?';
      params.push(difficulty);
    }
    
    sql += ' ORDER BY kp.sort_order ASC, kp.id ASC';
    
    const knowledgePoints = await query(sql, params);
    
    res.json({
      message: '获取知识点成功',
      knowledge_points: knowledgePoints
    });
  } catch (error) {
    console.error('获取知识点错误:', error);
    res.status(500).json({ error: '获取知识点失败' });
  }
});

// 获取科目统计信息
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    
    // 获取题目统计
    const questionStats = await query(`
      SELECT 
        COUNT(*) as total_questions,
        COUNT(CASE WHEN difficulty = 1 THEN 1 END) as easy_questions,
        COUNT(CASE WHEN difficulty = 2 THEN 1 END) as normal_questions,
        COUNT(CASE WHEN difficulty >= 3 THEN 1 END) as hard_questions,
        COUNT(CASE WHEN type = '单选' THEN 1 END) as single_choice,
        COUNT(CASE WHEN type = '多选' THEN 1 END) as multiple_choice,
        COUNT(CASE WHEN type = '填空' THEN 1 END) as fill_blank,
        COUNT(CASE WHEN type = '解答' THEN 1 END) as solve_problem
      FROM sl_questions 
      WHERE subject_id = ? AND status = '已通过'
    `, [subjectId]);
    
    // 获取知识点统计
    const knowledgeStats = await query(`
      SELECT 
        COUNT(*) as total_knowledge_points,
        COUNT(CASE WHEN is_core = true THEN 1 END) as core_knowledge_points,
        AVG(difficulty_level) as average_difficulty
      FROM sl_knowledge_points 
      WHERE subject_id = ? AND is_active = true
    `, [subjectId]);
    
    // 获取用户学习统计
    const userStats = await query(`
      SELECT 
        COUNT(DISTINCT up.knowledge_point_id) as learned_knowledge_points,
        AVG(up.mastery_level) as average_mastery,
        SUM(up.practice_count) as total_practice_count,
        SUM(up.correct_count) as total_correct_count
      FROM sl_user_progress up
      JOIN sl_knowledge_points kp ON up.knowledge_point_id = kp.id
      WHERE up.user_id = ? AND kp.subject_id = ?
    `, [req.user.id, subjectId]);
    
    res.json({
      message: '获取科目统计成功',
      stats: {
        questions: questionStats[0],
        knowledge_points: knowledgeStats[0],
        user_progress: userStats[0]
      }
    });
  } catch (error) {
    console.error('获取科目统计错误:', error);
    res.status(500).json({ error: '获取科目统计失败' });
  }
});

module.exports = router;