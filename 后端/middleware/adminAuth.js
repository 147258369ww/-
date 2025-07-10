const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// JWT密钥，实际项目中应该放在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * 管理员身份验证中间件
 * 验证JWT token并检查管理员权限
 */
const adminAuth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '缺少认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '无效的认证令牌'
      });
    }

    // 检查管理员是否存在
    const adminResult = await query(
      'SELECT id, username, name, email, avatar, last_login FROM admins WHERE id = ?',
      [decoded.adminId]
    );

    if (adminResult.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '管理员账户不存在'
      });
    }

    // 将管理员信息添加到请求对象中
    req.admin = adminResult[0];
    
    // 记录管理员活动（可选）
    await logAdminActivity(req, 'access', 'api', null, `访问 ${req.method} ${req.path}`);
    
    next();
  } catch (error) {
    console.error('管理员认证中间件错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '认证过程中发生错误'
    });
  }
};

/**
 * 记录管理员活动日志
 */
const logAdminActivity = async (req, action, resourceType, resourceId, details) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    await query(
      'INSERT INTO activity_logs (action, resource_type, resource_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [action, resourceType, resourceId, details, ip, userAgent]
    );
  } catch (error) {
    console.error('记录活动日志失败:', error);
    // 不抛出错误，避免影响主要功能
  }
};

/**
 * 生成JWT token
 */
const generateToken = (adminId) => {
  return jwt.sign(
    { adminId },
    JWT_SECRET,
    { expiresIn: '24h' } // token 24小时后过期
  );
};

/**
 * 验证密码
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * 加密密码
 */
const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

module.exports = {
  adminAuth,
  logAdminActivity,
  generateToken,
  verifyPassword,
  hashPassword,
  JWT_SECRET
};
