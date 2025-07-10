const { query, queryOne } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 获取文章评论
const getArticleComments = asyncHandler(async (req, res) => {
  const { id } = req.params; // 文章ID
  const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;

  // 检查文章是否存在
  const articles = await query(`SELECT id, title FROM articles WHERE id = ${parseInt(id)}`);
  const article = articles.length > 0 ? articles[0] : null;
  if (!article) {
    throw new AppError('文章不存在', 404);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // 验证排序字段和方向
  const allowedSortFields = ['id', 'created_at'];
  const allowedOrders = ['ASC', 'DESC'];

  const validSort = allowedSortFields.includes(sort) ? sort : 'created_at';
  const validOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  // 获取评论列表
  const comments = await query(`
    SELECT
      id,
      content,
      author_name,
      author_email,
      created_at
    FROM comments
    WHERE article_id = ${parseInt(id)}
    ORDER BY ${validSort} ${validOrder}
    LIMIT ${limitNum} OFFSET ${offset}
  `);

  // 获取评论总数
  const [{ total }] = await query(`
    SELECT COUNT(*) as total
    FROM comments
    WHERE article_id = ${parseInt(id)}
  `);

  res.json({
    success: true,
    data: {
      article: {
        id: article.id,
        title: article.title
      },
      comments,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// 创建评论
const createComment = asyncHandler(async (req, res) => {
  const { id } = req.params; // 文章ID
  const { content, author_name, author_email } = req.body;

  if (!content || !author_name) {
    throw new AppError('评论内容和作者姓名不能为空', 400);
  }

  // 检查文章是否存在
  const article = await queryOne('SELECT id FROM articles WHERE id = ?', [id]);
  if (!article) {
    throw new AppError('文章不存在', 404);
  }

  // 验证邮箱格式（如果提供）
  if (author_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(author_email)) {
      throw new AppError('邮箱格式不正确', 400);
    }
  }

  const result = await query(`
    INSERT INTO comments (content, article_id, author_name, author_email)
    VALUES (?, ?, ?, ?)
  `, [content, id, author_name, author_email]);

  const newComment = await queryOne(`
    SELECT 
      id,
      content,
      author_name,
      author_email,
      created_at
    FROM comments 
    WHERE id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    message: '评论发表成功',
    data: newComment
  });
});

// 删除评论
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // 检查评论是否存在
  const comment = await queryOne('SELECT id FROM comments WHERE id = ?', [commentId]);
  if (!comment) {
    throw new AppError('评论不存在', 404);
  }

  await query('DELETE FROM comments WHERE id = ?', [commentId]);

  res.json({
    success: true,
    message: '评论删除成功'
  });
});

// 获取所有评论（管理用）
const getAllComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  const comments = await query(`
    SELECT 
      c.id,
      c.content,
      c.author_name,
      c.author_email,
      c.created_at,
      a.id as article_id,
      a.title as article_title
    FROM comments c
    LEFT JOIN articles a ON c.article_id = a.id
    ORDER BY c.${sort} ${order}
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)]);

  const [{ total }] = await query('SELECT COUNT(*) as total FROM comments');

  res.json({
    success: true,
    data: {
      comments,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  getArticleComments,
  createComment,
  deleteComment,
  getAllComments
};
