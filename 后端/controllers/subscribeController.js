const { query, queryOne } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 添加邮件订阅
const addSubscriber = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('邮箱地址不能为空', 400);
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('邮箱格式不正确', 400);
  }

  try {
    // 检查邮箱是否已经订阅
    const existingSubscriber = await queryOne(
      'SELECT id, status FROM subscribers WHERE email = ?', 
      [email]
    );

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return res.json({
          success: true,
          message: '您已经订阅过了',
          data: { email, status: 'active' }
        });
      } else {
        // 重新激活订阅
        await query(
          'UPDATE subscribers SET status = ?, created_at = CURRENT_TIMESTAMP WHERE email = ?',
          ['active', email]
        );
        
        return res.json({
          success: true,
          message: '订阅已重新激活',
          data: { email, status: 'active' }
        });
      }
    }

    // 添加新订阅
    await query(
      'INSERT INTO subscribers (email, status) VALUES (?, ?)',
      [email, 'active']
    );

    res.status(201).json({
      success: true,
      message: '订阅成功！感谢您的关注',
      data: { email, status: 'active' }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('该邮箱已经订阅过了', 409);
    }
    throw error;
  }
});

// 取消订阅
const unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('邮箱地址不能为空', 400);
  }

  const subscriber = await queryOne(
    'SELECT id, status FROM subscribers WHERE email = ?',
    [email]
  );

  if (!subscriber) {
    throw new AppError('该邮箱未订阅', 404);
  }

  if (subscriber.status === 'unsubscribed') {
    return res.json({
      success: true,
      message: '您已经取消订阅了',
      data: { email, status: 'unsubscribed' }
    });
  }

  await query(
    'UPDATE subscribers SET status = ? WHERE email = ?',
    ['unsubscribed', email]
  );

  res.json({
    success: true,
    message: '取消订阅成功',
    data: { email, status: 'unsubscribed' }
  });
});

// 获取订阅者列表（管理用）
const getSubscribers = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status = 'active',
    sort = 'created_at',
    order = 'DESC' 
  } = req.query;

  const offset = (page - 1) * limit;

  // 构建查询条件
  let whereClause = '';
  let params = [];

  if (status && status !== 'all') {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  // 获取订阅者列表
  const subscribers = await query(`
    SELECT 
      id,
      email,
      status,
      created_at
    FROM subscribers
    ${whereClause}
    ORDER BY ${sort} ${order}
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), parseInt(offset)]);

  // 获取总数
  const countSQL = `SELECT COUNT(*) as total FROM subscribers ${whereClause}`;
  const [{ total }] = await query(countSQL, params);

  res.json({
    success: true,
    data: {
      subscribers,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// 获取订阅统计
const getSubscriptionStats = asyncHandler(async (req, res) => {
  const stats = await query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM subscribers
    GROUP BY status
  `);

  const [totalResult] = await query('SELECT COUNT(*) as total FROM subscribers');
  
  const statsMap = {
    active: 0,
    unsubscribed: 0,
    total: totalResult.total
  };

  stats.forEach(stat => {
    statsMap[stat.status] = stat.count;
  });

  res.json({
    success: true,
    data: statsMap
  });
});

// 批量发送邮件（预留接口，需要配置邮件服务）
const sendNewsletter = asyncHandler(async (req, res) => {
  const { subject, content } = req.body;

  if (!subject || !content) {
    throw new AppError('邮件主题和内容不能为空', 400);
  }

  // 获取所有活跃订阅者
  const activeSubscribers = await query(
    'SELECT email FROM subscribers WHERE status = ?',
    ['active']
  );

  if (activeSubscribers.length === 0) {
    return res.json({
      success: true,
      message: '没有活跃的订阅者',
      data: { sent_count: 0 }
    });
  }

  // 这里应该实现实际的邮件发送逻辑
  // 目前只是模拟发送成功
  console.log(`准备发送邮件给 ${activeSubscribers.length} 个订阅者`);
  console.log(`主题: ${subject}`);
  console.log(`内容: ${content.substring(0, 100)}...`);

  res.json({
    success: true,
    message: '邮件发送成功',
    data: { 
      sent_count: activeSubscribers.length,
      subject,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = {
  addSubscriber,
  unsubscribe,
  getSubscribers,
  getSubscriptionStats,
  sendNewsletter
};
