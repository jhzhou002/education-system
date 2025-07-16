const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { validate, registerSchema, loginSchema } = require('../utils/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 用户注册
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { username, email, password, real_name, nickname, phone, grade } = req.body;
    
    // 检查用户名和邮箱是否已存在
    const existingUsers = await query(
      'SELECT username, email FROM sl_users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (existing.username === username) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      if (existing.email === email) {
        return res.status(400).json({ error: '邮箱已被注册' });
      }
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await query(
      `INSERT INTO sl_users (username, email, password_hash, real_name, nickname, phone, grade) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, real_name || '', nickname || username, phone || '', grade || '高一']
    );
    
    res.status(201).json({
      message: '注册成功',
      user: {
        id: result.insertId,
        username,
        email,
        real_name: real_name || '',
        nickname: nickname || username,
        grade: grade || '高一'
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 用户登录
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const users = await query(
      'SELECT id, username, email, password_hash, real_name, nickname, role, grade, status FROM sl_users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(401).json({ error: '账户已被禁用，请联系管理员' });
    }
    
    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // 更新最后登录时间
    await query('UPDATE sl_users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        real_name: user.real_name,
        nickname: user.nickname,
        role: user.role,
        grade: user.grade
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await query(
      `SELECT id, username, email, real_name, nickname, avatar_url, 
              gender, birth_date, school, grade, class_name, role, 
              created_at, last_login_at 
       FROM sl_users WHERE id = ?`,
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      message: '获取用户信息成功',
      user: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 刷新令牌
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      message: '令牌刷新成功',
      token
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({ error: '刷新令牌失败' });
  }
});

module.exports = router;