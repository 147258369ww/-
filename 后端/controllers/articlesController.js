const { query, queryOne } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 获取文章列表
const getArticles = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category_id,
    sort = 'published_at',
    order = 'DESC'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // 验证排序字段和方向
  const allowedSortFields = ['id', 'title', 'published_at', 'view_count', 'created_at', 'updated_at'];
  const allowedOrders = ['ASC', 'DESC'];

  const validSort = allowedSortFields.includes(sort) ? sort : 'published_at';
  const validOrder = allowedOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  // 构建查询条件
  let whereClause = '';
  let whereParams = [];

  if (category_id) {
    whereClause = `WHERE a.category_id = ${parseInt(category_id)}`;
  }

  // 获取文章列表
  const articlesSQL = `
    SELECT
      a.id,
      a.title,
      a.summary,
      a.cover_image,
      a.published_at,
      a.view_count,
      a.created_at,
      a.updated_at,
      c.name as category_name,
      c.id as category_id
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereClause}
    ORDER BY a.${validSort} ${validOrder}
    LIMIT ${limitNum} OFFSET ${offset}
  `;

  const articles = await query(articlesSQL);

  // 获取总数
  const countSQL = `
    SELECT COUNT(*) as total
    FROM articles a
    ${whereClause}
  `;
  const [{ total }] = await query(countSQL);

  res.json({
    success: true,
    data: {
      articles,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// 获取单篇文章详情
const getArticleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const article = await queryOne(`
    SELECT 
      a.*,
      c.name as category_name,
      c.id as category_id
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `, [id]);

  if (!article) {
    throw new AppError('文章不存在', 404);
  }

  // 增加浏览量
  await query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);
  article.view_count += 1;

  res.json({
    success: true,
    data: article
  });
});

// 创建文章
const createArticle = asyncHandler(async (req, res) => {
  const { title, content, summary, category_id, cover_image } = req.body;

  if (!title || !content) {
    throw new AppError('标题和内容不能为空', 400);
  }

  const published_at = new Date();
  
  const result = await query(`
    INSERT INTO articles (title, content, summary, category_id, cover_image, published_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [title, content, summary, category_id, cover_image, published_at]);

  const newArticle = await queryOne(`
    SELECT 
      a.*,
      c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `, [result.insertId]);

  res.status(201).json({
    success: true,
    message: '文章创建成功',
    data: newArticle
  });
});

// 更新文章
const updateArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, summary, category_id, cover_image } = req.body;

  // 检查文章是否存在
  const existingArticle = await queryOne('SELECT id FROM articles WHERE id = ?', [id]);
  if (!existingArticle) {
    throw new AppError('文章不存在', 404);
  }

  // 构建更新字段
  const updateFields = [];
  const updateValues = [];

  if (title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(title);
  }
  if (content !== undefined) {
    updateFields.push('content = ?');
    updateValues.push(content);
  }
  if (summary !== undefined) {
    updateFields.push('summary = ?');
    updateValues.push(summary);
  }
  if (category_id !== undefined) {
    updateFields.push('category_id = ?');
    updateValues.push(category_id);
  }
  if (cover_image !== undefined) {
    updateFields.push('cover_image = ?');
    updateValues.push(cover_image);
  }

  if (updateFields.length === 0) {
    throw new AppError('没有提供要更新的字段', 400);
  }

  updateValues.push(id);

  await query(`
    UPDATE articles 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, updateValues);

  const updatedArticle = await queryOne(`
    SELECT 
      a.*,
      c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `, [id]);

  res.json({
    success: true,
    message: '文章更新成功',
    data: updatedArticle
  });
});

// 删除文章
const deleteArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingArticle = await queryOne('SELECT id FROM articles WHERE id = ?', [id]);
  if (!existingArticle) {
    throw new AppError('文章不存在', 404);
  }

  await query('DELETE FROM articles WHERE id = ?', [id]);

  res.json({
    success: true,
    message: '文章删除成功'
  });
});

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};
