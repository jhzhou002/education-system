const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 获取用户列表（管理员）
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, grade, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, username, email, real_name, nickname, role, grade, 
             school, class_name, status, created_at, last_login_at
      FROM sl_users
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    
    if (grade) {
      sql += ' AND grade = ?';
      params.push(grade);
    }
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    // 获取总数
    const countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = await query(countSql, params);
    const total = totalResult[0].total;
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const users = await query(sql, params);
    
    res.json({
      message: '获取用户列表成功',
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取用户详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 权限检查：只能查看自己的信息或管理员可以查看所有
    if (req.user.id != userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权查看他人信息' });
    }
    
    const users = await query(`
      SELECT id, username, email, real_name, nickname, avatar_url,
             gender, birth_date, school, grade, class_name, role,
             status, created_at, last_login_at
      FROM sl_users
      WHERE id = ?
    `, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      message: '获取用户详情成功',
      user: users[0]
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

// 更新用户信息
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 权限检查：只能修改自己的信息或管理员可以修改所有
    if (req.user.id != userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权修改他人信息' });
    }
    
    const {
      real_name,
      nickname,
      phone,
      gender,
      birth_date,
      school,
      grade,
      class_name
    } = req.body;
    
    const updateFields = [];
    const params = [];
    
    if (real_name !== undefined) {
      updateFields.push('real_name = ?');
      params.push(real_name);
    }
    
    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }
    
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      params.push(gender);
    }
    
    if (birth_date !== undefined) {
      updateFields.push('birth_date = ?');
      params.push(birth_date);
    }
    
    if (school !== undefined) {
      updateFields.push('school = ?');
      params.push(school);
    }
    
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      params.push(grade);
    }
    
    if (class_name !== undefined) {
      updateFields.push('class_name = ?');
      params.push(class_name);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }
    
    params.push(userId);
    
    await query(
      `UPDATE sl_users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    res.json({
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 获取用户学习统计
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 权限检查
    if (req.user.id != userId && !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: '无权查看他人学习统计' });
    }
    
    // 获取总体统计
    const overallStats = await query(`
      SELECT 
        COUNT(DISTINCT up.knowledge_point_id) as learned_knowledge_points,
        AVG(up.mastery_level) as average_mastery,
        SUM(up.practice_count) as total_practice,
        SUM(up.correct_count) as total_correct
      FROM sl_user_progress up
      WHERE up.user_id = ?
    `, [userId]);
    
    // 获取各科目统计
    const subjectStats = await query(`
      SELECT 
        s.id, s.display_name,
        COUNT(DISTINCT up.knowledge_point_id) as learned_knowledge_points,
        COUNT(DISTINCT kp.id) as total_knowledge_points,
        AVG(up.mastery_level) as average_mastery,
        SUM(up.practice_count) as practice_count,
        SUM(up.correct_count) as correct_count
      FROM sl_subjects s
      LEFT JOIN sl_knowledge_points kp ON s.id = kp.subject_id AND kp.is_active = true
      LEFT JOIN sl_user_progress up ON kp.id = up.knowledge_point_id AND up.user_id = ?
      WHERE s.is_active = true
      GROUP BY s.id, s.display_name
      ORDER BY s.sort_order
    `, [userId]);
    
    // 获取最近答题记录
    const recentAnswers = await query(`
      SELECT 
        q.id, q.content, q.type, q.difficulty,
        ua.is_correct, ua.score, ua.time_spent, ua.created_at,
        s.display_name as subject_name
      FROM sl_user_answers ua
      JOIN sl_questions q ON ua.question_id = q.id
      JOIN sl_subjects s ON q.subject_id = s.id
      WHERE ua.user_id = ?
      ORDER BY ua.created_at DESC
      LIMIT 10
    `, [userId]);
    
    // 计算完成率
    const subjectStatsWithProgress = subjectStats.map(subject => ({
      ...subject,
      completion_rate: subject.total_knowledge_points > 0 
        ? Math.round((subject.learned_knowledge_points / subject.total_knowledge_points) * 100)
        : 0,
      accuracy_rate: subject.practice_count > 0
        ? Math.round((subject.correct_count / subject.practice_count) * 100)
        : 0
    }));
    
    res.json({
      message: '获取学习统计成功',
      stats: {
        overall: {
          ...overallStats[0],
          average_mastery: Math.round((overallStats[0].average_mastery || 0) * 100),
          accuracy_rate: overallStats[0].total_practice > 0 
            ? Math.round((overallStats[0].total_correct / overallStats[0].total_practice) * 100)
            : 0
        },
        subjects: subjectStatsWithProgress,
        recent_answers: recentAnswers
      }
    });
  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({ error: '获取学习统计失败' });
  }
});

// 修改密码
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '当前密码和新密码都是必填项' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密码长度至少6位' });
    }
    
    // 获取用户当前密码哈希
    const users = await query('SELECT password_hash FROM sl_users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: '当前密码不正确' });
    }
    
    // 生成新密码哈希
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await query(
      'UPDATE sl_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newPasswordHash, userId]
    );
    
    res.json({
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

module.exports = router;