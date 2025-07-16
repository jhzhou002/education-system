const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: '访问令牌不存在' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 验证用户是否存在且状态正常
    const users = await query(
      'SELECT id, username, email, role, status FROM sl_users WHERE id = ? AND status = "active"',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '访问令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的访问令牌' });
    }
    return res.status(500).json({ error: '令牌验证失败' });
  }
};

// 角色权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证用户' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  };
};

// 管理员权限
const requireAdmin = requireRole(['admin']);

// 教师权限
const requireTeacher = requireRole(['admin', 'teacher']);

// 学生权限（所有用户）
const requireStudent = requireRole(['admin', 'teacher', 'student']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent
};