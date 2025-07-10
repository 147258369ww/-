const { query } = require('../../config/database');
const { logAdminActivity } = require('../../middleware/adminAuth');

/**
 * 获取所有评论列表（后台专用）
 */
const getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status; // 可选的状态筛选
    const articleId = req.query.article_id; // 可选的文章筛选
    const search = req.query.search; // 可选的搜索关键词

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('c.status = ?');
      queryParams.push(status);
    }

    if (articleId) {
      whereConditions.push('c.article_id = ?');
      queryParams.push(articleId);
    }

    if (search) {
      whereConditions.push('(c.content LIKE ? OR c.author_name LIKE ? OR c.author_email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM comments c ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取评论列表
    const commentsQuery = `
      SELECT 
        c.id, c.content, c.author_name, c.author_email, c.status, 
        c.ip_address, c.created_at,
        a.id as article_id, a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const comments = await query(commentsQuery, [...queryParams, limit, offset]);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取评论列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取评论列表失败'
    });
  }
};

/**
 * 获取单个评论详情
 */
const getComment = async (req, res) => {
  try {
    const { id } = req.params;

    const commentResult = await query(`
      SELECT 
        c.id, c.content, c.author_name, c.author_email, c.status, 
        c.ip_address, c.created_at,
        a.id as article_id, a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE c.id = ?
    `, [id]);

    if (commentResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '评论不存在'
      });
    }

    res.json({
      comment: commentResult[0]
    });

  } catch (error) {
    console.error('获取评论详情错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取评论详情失败'
    });
  }
};

/**
 * 更新评论状态
 */
const updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    if (!['approved', 'pending', 'spam'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的状态值，必须是 approved、pending 或 spam'
      });
    }

    // 检查评论是否存在
    const existingComment = await query('SELECT * FROM comments WHERE id = ?', [id]);
    if (existingComment.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '评论不存在'
      });
    }

    // 更新评论状态
    await query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);

    // 记录活动日志
    const statusText = {
      'approved': '批准',
      'pending': '待审核',
      'spam': '标记为垃圾'
    };
    await logAdminActivity(req, 'update_status', 'comment', id, `${statusText[status]}评论`);

    // 返回更新后的评论
    const updatedComment = await query(`
      SELECT 
        c.id, c.content, c.author_name, c.author_email, c.status, 
        c.ip_address, c.created_at,
        a.id as article_id, a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE c.id = ?
    `, [id]);

    res.json({
      message: '评论状态更新成功',
      comment: updatedComment[0]
    });

  } catch (error) {
    console.error('更新评论状态错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新评论状态失败'
    });
  }
};

/**
 * 批量更新评论状态
 */
const batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要更新的评论ID列表'
      });
    }

    if (!['approved', 'pending', 'spam'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的状态值，必须是 approved、pending 或 spam'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE comments SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    );

    // 记录活动日志
    const statusText = {
      'approved': '批准',
      'pending': '待审核',
      'spam': '标记为垃圾'
    };
    await logAdminActivity(req, 'batch_update_status', 'comment', null, `批量${statusText[status]}评论，影响评论数: ${ids.length}`);

    res.json({
      message: `成功更新 ${ids.length} 条评论的状态`
    });

  } catch (error) {
    console.error('批量更新评论状态错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '批量更新评论状态失败'
    });
  }
};

/**
 * 删除评论
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查评论是否存在
    const existingComment = await query('SELECT author_name FROM comments WHERE id = ?', [id]);
    if (existingComment.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '评论不存在'
      });
    }

    // 删除评论
    await query('DELETE FROM comments WHERE id = ?', [id]);

    // 记录活动日志
    await logAdminActivity(req, 'delete', 'comment', id, `删除评论 (作者: ${existingComment[0].author_name})`);

    res.json({
      message: '评论删除成功'
    });

  } catch (error) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除评论失败'
    });
  }
};

/**
 * 批量删除评论
 */
const batchDeleteComments = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要删除的评论ID列表'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM comments WHERE id IN (${placeholders})`, ids);

    // 记录活动日志
    await logAdminActivity(req, 'batch_delete', 'comment', null, `批量删除评论，影响评论数: ${ids.length}`);

    res.json({
      message: `成功删除 ${ids.length} 条评论`
    });

  } catch (error) {
    console.error('批量删除评论错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '批量删除评论失败'
    });
  }
};

/**
 * 获取评论统计信息
 */
const getCommentStats = async (req, res) => {
  try {
    // 获取各状态评论数量
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'spam' THEN 1 END) as spam
      FROM comments
    `);

    // 获取今日新增评论数
    const todayResult = await query(`
      SELECT COUNT(*) as today_count
      FROM comments 
      WHERE DATE(created_at) = CURDATE()
    `);

    // 获取本周新增评论数
    const weekResult = await query(`
      SELECT COUNT(*) as week_count
      FROM comments 
      WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
    `);

    res.json({
      stats: {
        ...statsResult[0],
        today_count: todayResult[0].today_count,
        week_count: weekResult[0].week_count
      }
    });

  } catch (error) {
    console.error('获取评论统计错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取评论统计失败'
    });
  }
};

module.exports = {
  getComments,
  getComment,
  updateCommentStatus,
  batchUpdateStatus,
  deleteComment,
  batchDeleteComments,
  getCommentStats
};
