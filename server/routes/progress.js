const express = require('express');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取用户学习进度
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { subject_id, knowledge_point_id } = req.query;
    
    let sql = `
      SELECT up.*, kp.name as knowledge_point_name, kp.code, kp.difficulty_level,
             kp.is_core, s.display_name as subject_name
      FROM sl_user_progress up
      JOIN sl_knowledge_points kp ON up.knowledge_point_id = kp.id
      JOIN sl_subjects s ON kp.subject_id = s.id
      WHERE up.user_id = ?
    `;
    
    const params = [req.user.id];
    
    if (subject_id) {
      sql += ' AND kp.subject_id = ?';
      params.push(subject_id);
    }
    
    if (knowledge_point_id) {
      sql += ' AND up.knowledge_point_id = ?';
      params.push(knowledge_point_id);
    }
    
    sql += ' ORDER BY up.updated_at DESC';
    
    const progress = await query(sql, params);
    
    res.json({
      message: '获取学习进度成功',
      progress
    });
  } catch (error) {
    console.error('获取学习进度错误:', error);
    res.status(500).json({ error: '获取学习进度失败' });
  }
});

// 更新学习进度
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { knowledge_point_id, is_correct, time_spent } = req.body;
    
    if (!knowledge_point_id) {
      return res.status(400).json({ error: '知识点ID不能为空' });
    }
    
    await transaction(async (connection) => {
      // 获取或创建用户进度记录
      const [existing] = await connection.execute(
        'SELECT * FROM sl_user_progress WHERE user_id = ? AND knowledge_point_id = ?',
        [req.user.id, knowledge_point_id]
      );
      
      if (existing.length === 0) {
        // 创建新的进度记录
        await connection.execute(`
          INSERT INTO sl_user_progress (
            user_id, knowledge_point_id, mastery_level, practice_count, 
            correct_count, last_practice_at
          ) VALUES (?, ?, ?, 1, ?, NOW())
        `, [req.user.id, knowledge_point_id, is_correct ? 0.2 : 0.1, is_correct ? 1 : 0]);
      } else {
        // 更新现有记录
        const current = existing[0];
        const newPracticeCount = current.practice_count + 1;
        const newCorrectCount = current.correct_count + (is_correct ? 1 : 0);
        
        // 使用加权平均算法更新掌握程度
        let newMasteryLevel = current.mastery_level;
        
        if (is_correct) {
          // 答对了，提高掌握程度
          newMasteryLevel = Math.min(1.0, current.mastery_level + 0.1);
        } else {
          // 答错了，降低掌握程度
          newMasteryLevel = Math.max(0.0, current.mastery_level - 0.05);
        }
        
        // 基于准确率调整掌握程度
        const accuracyRate = newCorrectCount / newPracticeCount;
        newMasteryLevel = (newMasteryLevel * 0.7) + (accuracyRate * 0.3);
        
        await connection.execute(`
          UPDATE sl_user_progress 
          SET mastery_level = ?, practice_count = ?, correct_count = ?, 
              last_practice_at = NOW(), updated_at = NOW()
          WHERE user_id = ? AND knowledge_point_id = ?
        `, [newMasteryLevel, newPracticeCount, newCorrectCount, req.user.id, knowledge_point_id]);
      }
    });
    
    res.json({
      message: '学习进度更新成功'
    });
  } catch (error) {
    console.error('更新学习进度错误:', error);
    res.status(500).json({ error: '更新学习进度失败' });
  }
});

// 获取学习路径推荐
router.get('/learning-path', authenticateToken, async (req, res) => {
  try {
    const { subject_id } = req.query;
    
    if (!subject_id) {
      return res.status(400).json({ error: '科目ID不能为空' });
    }
    
    // 获取用户在该科目的所有知识点进度
    const progress = await query(`
      SELECT kp.id, kp.name, kp.code, kp.difficulty_level, kp.prerequisites,
             kp.is_core, kp.exam_frequency, COALESCE(up.mastery_level, 0) as mastery_level,
             up.practice_count, up.last_practice_at
      FROM sl_knowledge_points kp
      LEFT JOIN sl_user_progress up ON kp.id = up.knowledge_point_id AND up.user_id = ?
      WHERE kp.subject_id = ? AND kp.is_active = true
      ORDER BY kp.difficulty_level ASC, kp.exam_frequency DESC
    `, [req.user.id, subject_id]);
    
    // 分析学习路径
    const unlearned = progress.filter(kp => kp.mastery_level < 0.6);
    const inProgress = progress.filter(kp => kp.mastery_level >= 0.6 && kp.mastery_level < 0.8);
    const mastered = progress.filter(kp => kp.mastery_level >= 0.8);
    
    // 推荐下一步学习的知识点
    const recommended = unlearned
      .filter(kp => {
        // 检查前置条件是否满足
        if (!kp.prerequisites) return true;
        
        try {
          const prereqs = JSON.parse(kp.prerequisites);
          return prereqs.every(prereqId => {
            const prereqProgress = progress.find(p => p.id === prereqId);
            return prereqProgress && prereqProgress.mastery_level >= 0.7;
          });
        } catch {
          return true;
        }
      })
      .slice(0, 5);
    
    // 需要复习的知识点（掌握程度下降或久未练习）
    const needReview = progress.filter(kp => {
      if (kp.mastery_level < 0.7 && kp.practice_count > 0) return true;
      
      if (kp.last_practice_at) {
        const daysSinceLastPractice = (Date.now() - new Date(kp.last_practice_at)) / (1000 * 60 * 60 * 24);
        return daysSinceLastPractice > 7 && kp.mastery_level < 0.9;
      }
      
      return false;
    }).slice(0, 5);
    
    res.json({
      message: '获取学习路径成功',
      learning_path: {
        overall_progress: {
          total: progress.length,
          unlearned: unlearned.length,
          in_progress: inProgress.length,
          mastered: mastered.length,
          completion_rate: Math.round((mastered.length / progress.length) * 100)
        },
        recommended_next: recommended,
        need_review: needReview,
        core_knowledge_points: progress.filter(kp => kp.is_core && kp.mastery_level < 0.8)
      }
    });
  } catch (error) {
    console.error('获取学习路径错误:', error);
    res.status(500).json({ error: '获取学习路径失败' });
  }
});

// 获取知识点掌握程度分布
router.get('/mastery-distribution', authenticateToken, async (req, res) => {
  try {
    const { subject_id } = req.query;
    
    let sql = `
      SELECT 
        CASE 
          WHEN COALESCE(up.mastery_level, 0) < 0.3 THEN '未掌握'
          WHEN COALESCE(up.mastery_level, 0) < 0.6 THEN '初步掌握'
          WHEN COALESCE(up.mastery_level, 0) < 0.8 THEN '基本掌握'
          ELSE '熟练掌握'
        END as mastery_category,
        COUNT(*) as count,
        AVG(COALESCE(up.mastery_level, 0)) as avg_mastery
      FROM sl_knowledge_points kp
      LEFT JOIN sl_user_progress up ON kp.id = up.knowledge_point_id AND up.user_id = ?
      WHERE kp.is_active = true
    `;
    
    const params = [req.user.id];
    
    if (subject_id) {
      sql += ' AND kp.subject_id = ?';
      params.push(subject_id);
    }
    
    sql += ' GROUP BY mastery_category ORDER BY avg_mastery ASC';
    
    const distribution = await query(sql, params);
    
    // 获取各难度等级的掌握情况
    const difficultyStats = await query(`
      SELECT 
        kp.difficulty_level,
        COUNT(*) as total_count,
        COUNT(CASE WHEN up.mastery_level >= 0.8 THEN 1 END) as mastered_count,
        AVG(COALESCE(up.mastery_level, 0)) as avg_mastery
      FROM sl_knowledge_points kp
      LEFT JOIN sl_user_progress up ON kp.id = up.knowledge_point_id AND up.user_id = ?
      WHERE kp.is_active = true ${subject_id ? 'AND kp.subject_id = ?' : ''}
      GROUP BY kp.difficulty_level
      ORDER BY kp.difficulty_level
    `, subject_id ? [req.user.id, subject_id] : [req.user.id]);
    
    res.json({
      message: '获取掌握程度分布成功',
      distribution: {
        mastery_categories: distribution,
        difficulty_levels: difficultyStats
      }
    });
  } catch (error) {
    console.error('获取掌握程度分布错误:', error);
    res.status(500).json({ error: '获取掌握程度分布失败' });
  }
});

module.exports = router;