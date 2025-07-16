const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subjectRoutes = require('./routes/subjects');
const questionRoutes = require('./routes/questions');
const progressRoutes = require('./routes/progress');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: '智学平台API服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 智学平台服务器启动成功!`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API文档: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();