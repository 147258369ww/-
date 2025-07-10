const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 前台API路由
app.use('/api/articles', require('./routes/articles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/search', require('./routes/search'));
app.use('/api/subscribe', require('./routes/subscribe'));

// 后台认证路由（不需要验证）
app.use('/api/auth', require('./routes/admin/auth'));

// 后台API路由 (需要身份验证)
const { adminAuth } = require('./middleware/adminAuth');
app.use('/api/admin/profile', adminAuth, require('./routes/admin/auth').profileRouter);
app.use('/api/admin/activity-logs', adminAuth, require('./routes/admin/auth').logsRouter);
app.use('/api/admin/articles', adminAuth, require('./routes/admin/articles'));
app.use('/api/admin/categories', adminAuth, require('./routes/admin/categories'));
app.use('/api/admin/comments', adminAuth, require('./routes/admin/comments'));
app.use('/api/admin/media', adminAuth, require('./routes/admin/media'));
app.use('/api/admin/stats', adminAuth, require('./routes/admin/stats'));
app.use('/api/admin/settings', adminAuth, require('./routes/admin/settings'));
app.use('/api/admin/subscribe', adminAuth, require('./routes/admin/subscribe'));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '个人博客 API 服务',
    version: '1.0.0',
    endpoints: {
      // 前台API
      articles: '/api/articles',
      categories: '/api/categories',
      comments: '/api/comments',
      search: '/api/search',
      subscribe: '/api/subscribe',
      // 后台API
      admin: {
        auth: '/api/auth',
        profile: '/api/admin/profile',
        articles: '/api/admin/articles',
        categories: '/api/admin/categories',
        comments: '/api/admin/comments',
        media: '/api/admin/media',
        stats: '/api/admin/stats',
        settings: '/api/admin/settings',
        subscribe: '/api/admin/subscribe',
        logs: '/api/admin/activity-logs'
      }
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路径 ${req.originalUrl} 不存在`
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📚 API文档: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

startServer();

module.exports = app;
