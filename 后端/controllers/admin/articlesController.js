const { query } = require('../../config/database');
const { logAdminActivity } = require('../../middleware/adminAuth');

/**
 * 获取文章列表（后台专用）
 */
const getArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // 可选的状态筛选
    const categoryId = req.query.category_id; // 可选的分类筛选
    const search = req.query.search; // 可选的搜索关键词

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('a.status = ?');
      queryParams.push(status);
    }

    if (categoryId) {
      whereConditions.push('a.category_id = ?');
      queryParams.push(categoryId);
    }

    if (search) {
      whereConditions.push('(a.title LIKE ? OR a.content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM articles a 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取文章列表
    const articlesQuery = `
      SELECT 
        a.id, a.title, a.summary, a.cover_image, a.published_at, 
        a.view_count, a.status, a.created_at, a.updated_at,
        c.name as category_name, c.id as category_id
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // 确保limit和offset是数字
    const articles = await query(articlesQuery, [...queryParams, Number(limit), Number(offset)]);

    res.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取文章列表失败'
    });
  }
};

/**
 * 获取单篇文章详情（后台专用）
 */
const getArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const articleResult = await query(`
      SELECT 
        a.*, 
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);

    if (articleResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '文章不存在'
      });
    }

    res.json({
      article: articleResult[0]
    });

  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取文章详情失败'
    });
  }
};

/**
 * 创建文章
 */
const createArticle = async (req, res) => {
  try {
    const { title, content, summary, cover_image, category_id, status = 'draft' } = req.body;

    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '标题和内容不能为空'
      });
    }

    // 验证分类是否存在
    if (category_id) {
      const categoryResult = await query('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (categoryResult.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的分类不存在'
        });
      }
    }

    // 设置发布时间
    const published_at = status === 'published' ? new Date() : null;

    const result = await query(`
      INSERT INTO articles (title, content, summary, cover_image, category_id, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, content, summary, cover_image, category_id, status, published_at]);

    // 记录活动日志
    await logAdminActivity(req, 'create', 'article', result.insertId, `创建文章: ${title}`);

    res.status(201).json({
      message: '文章创建成功',
      article: {
        id: result.insertId,
        title,
        content,
        summary,
        cover_image,
        category_id,
        status,
        published_at
      }
    });

  } catch (error) {
    console.error('创建文章错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '创建文章失败'
    });
  }
};

/**
 * 更新文章
 */
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, cover_image, category_id, status } = req.body;

    // 检查文章是否存在
    const existingArticle = await query('SELECT * FROM articles WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '文章不存在'
      });
    }

    // 验证分类是否存在
    if (category_id) {
      const categoryResult = await query('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (categoryResult.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '指定的分类不存在'
        });
      }
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
    if (cover_image !== undefined) {
      updateFields.push('cover_image = ?');
      updateValues.push(cover_image);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // 如果状态改为已发布且之前未发布，设置发布时间
      if (status === 'published' && existingArticle[0].status !== 'published') {
        updateFields.push('published_at = NOW()');
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '没有提供要更新的字段'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await query(
      `UPDATE articles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 记录活动日志
    await logAdminActivity(req, 'update', 'article', id, `更新文章: ${title || existingArticle[0].title}`);

    // 返回更新后的文章
    const updatedArticle = await query(`
      SELECT 
        a.*, 
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `, [id]);

    res.json({
      message: '文章更新成功',
      article: updatedArticle[0]
    });

  } catch (error) {
    console.error('更新文章错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新文章失败'
    });
  }
};

/**
 * 删除文章
 */
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查文章是否存在
    const existingArticle = await query('SELECT title FROM articles WHERE id = ?', [id]);
    if (existingArticle.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '文章不存在'
      });
    }

    // 删除文章（会级联删除相关评论）
    await query('DELETE FROM articles WHERE id = ?', [id]);

    // 记录活动日志
    await logAdminActivity(req, 'delete', 'article', id, `删除文章: ${existingArticle[0].title}`);

    res.json({
      message: '文章删除成功'
    });

  } catch (error) {
    console.error('删除文章错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除文章失败'
    });
  }
};

/**
 * 批量更新文章状态
 */
const batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要更新的文章ID列表'
      });
    }

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的状态值'
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    const updateQuery = status === 'published' 
      ? `UPDATE articles SET status = ?, published_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`
      : `UPDATE articles SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`;

    await query(updateQuery, [status, ...ids]);

    // 记录活动日志
    await logAdminActivity(req, 'batch_update', 'article', null, `批量更新文章状态为: ${status}, 影响文章数: ${ids.length}`);

    res.json({
      message: `成功更新 ${ids.length} 篇文章的状态`
    });

  } catch (error) {
    console.error('批量更新文章状态错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '批量更新文章状态失败'
    });
  }
};

module.exports = {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  batchUpdateStatus
};
