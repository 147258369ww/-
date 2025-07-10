const { query } = require('../../config/database');
const { logAdminActivity } = require('../../middleware/adminAuth');
const nodemailer = require('nodemailer');

// 邮件配置（实际项目中应该放在环境变量中）
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

/**
 * 获取订阅者列表
 */
const getSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status; // 可选的状态筛选
    const search = req.query.search; // 可选的搜索关键词

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push('email LIKE ?');
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM subscribers ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取订阅者列表
    const subscribersQuery = `
      SELECT id, email, status, created_at
      FROM subscribers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const subscribers = await query(subscribersQuery, [...queryParams, limit, offset]);

    res.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取订阅者列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取订阅者列表失败'
    });
  }
};

/**
 * 获取订阅统计
 */
const getSubscriberStats = async (req, res) => {
  try {
    // 基础统计
    const basicStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'unsubscribed' THEN 1 END) as unsubscribed,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as week_count,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as month_count
      FROM subscribers
    `);

    // 订阅趋势（最近30天）
    const trendStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM subscribers 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // 生成完整的日期范围
    const dateRange = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    // 填充缺失的日期数据
    const trendMap = {};
    trendStats.forEach(trend => {
      trendMap[trend.date] = trend.count;
    });

    const trends = dateRange.map(date => ({
      date,
      count: trendMap[date] || 0
    }));

    res.json({
      stats: basicStats[0],
      trends
    });

  } catch (error) {
    console.error('获取订阅统计错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取订阅统计失败'
    });
  }
};

/**
 * 更新订阅者状态
 */
const updateSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    if (!['active', 'unsubscribed'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的状态值，必须是 active 或 unsubscribed'
      });
    }

    // 检查订阅者是否存在
    const existingSubscriber = await query('SELECT * FROM subscribers WHERE id = ?', [id]);
    if (existingSubscriber.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '订阅者不存在'
      });
    }

    // 更新订阅者状态
    await query('UPDATE subscribers SET status = ? WHERE id = ?', [status, id]);

    // 记录活动日志
    const statusText = status === 'active' ? '激活' : '取消订阅';
    await logAdminActivity(req, 'update_status', 'subscriber', id, `${statusText}订阅者: ${existingSubscriber[0].email}`);

    // 返回更新后的订阅者信息
    const updatedSubscriber = await query('SELECT * FROM subscribers WHERE id = ?', [id]);

    res.json({
      message: '订阅者状态更新成功',
      subscriber: updatedSubscriber[0]
    });

  } catch (error) {
    console.error('更新订阅者状态错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新订阅者状态失败'
    });
  }
};

/**
 * 删除订阅者
 */
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查订阅者是否存在
    const existingSubscriber = await query('SELECT email FROM subscribers WHERE id = ?', [id]);
    if (existingSubscriber.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '订阅者不存在'
      });
    }

    // 删除订阅者
    await query('DELETE FROM subscribers WHERE id = ?', [id]);

    // 记录活动日志
    await logAdminActivity(req, 'delete', 'subscriber', id, `删除订阅者: ${existingSubscriber[0].email}`);

    res.json({
      message: '订阅者删除成功'
    });

  } catch (error) {
    console.error('删除订阅者错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除订阅者失败'
    });
  }
};

/**
 * 批量删除订阅者
 */
const batchDeleteSubscribers = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要删除的订阅者ID列表'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM subscribers WHERE id IN (${placeholders})`, ids);

    // 记录活动日志
    await logAdminActivity(req, 'batch_delete', 'subscriber', null, `批量删除订阅者，影响订阅者数: ${ids.length}`);

    res.json({
      message: `成功删除 ${ids.length} 个订阅者`
    });

  } catch (error) {
    console.error('批量删除订阅者错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '批量删除订阅者失败'
    });
  }
};

/**
 * 发送邮件通知
 */
const sendEmailNotification = async (req, res) => {
  try {
    const { subject, content, recipients = 'all' } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '邮件主题和内容不能为空'
      });
    }

    // 获取收件人列表
    let subscribersQuery = 'SELECT email FROM subscribers WHERE status = "active"';
    let queryParams = [];

    if (recipients !== 'all' && Array.isArray(recipients)) {
      const placeholders = recipients.map(() => '?').join(',');
      subscribersQuery += ` AND id IN (${placeholders})`;
      queryParams = recipients;
    }

    const subscribers = await query(subscribersQuery, queryParams);

    if (subscribers.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '没有找到活跃的订阅者'
      });
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransporter(emailConfig);

    // 发送邮件
    const emailPromises = subscribers.map(subscriber => {
      return transporter.sendMail({
        from: emailConfig.auth.user,
        to: subscriber.email,
        subject: subject,
        html: content
      });
    });

    try {
      await Promise.all(emailPromises);
      
      // 记录活动日志
      await logAdminActivity(req, 'send_email', 'subscriber', null, `发送邮件通知，收件人数: ${subscribers.length}`);

      res.json({
        message: `邮件发送成功，共发送给 ${subscribers.length} 个订阅者`
      });
    } catch (emailError) {
      console.error('发送邮件错误:', emailError);
      res.status(500).json({
        error: 'Internal Server Error',
        message: '邮件发送失败，请检查邮件配置'
      });
    }

  } catch (error) {
    console.error('发送邮件通知错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '发送邮件通知失败'
    });
  }
};

/**
 * 导出订阅者列表
 */
const exportSubscribers = async (req, res) => {
  try {
    const status = req.query.status; // 可选的状态筛选

    let subscribersQuery = 'SELECT email, status, created_at FROM subscribers';
    let queryParams = [];

    if (status) {
      subscribersQuery += ' WHERE status = ?';
      queryParams.push(status);
    }

    subscribersQuery += ' ORDER BY created_at DESC';

    const subscribers = await query(subscribersQuery, queryParams);

    // 生成CSV格式数据
    const csvHeader = 'Email,Status,Created At\n';
    const csvData = subscribers.map(sub => 
      `${sub.email},${sub.status},${sub.created_at}`
    ).join('\n');

    const csv = csvHeader + csvData;

    // 记录活动日志
    await logAdminActivity(req, 'export', 'subscriber', null, `导出订阅者列表，导出数量: ${subscribers.length}`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csv);

  } catch (error) {
    console.error('导出订阅者列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '导出订阅者列表失败'
    });
  }
};

module.exports = {
  getSubscribers,
  getSubscriberStats,
  updateSubscriberStatus,
  deleteSubscriber,
  batchDeleteSubscribers,
  sendEmailNotification,
  exportSubscribers
};
