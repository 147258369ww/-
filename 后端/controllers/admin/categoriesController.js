const { query } = require('../../config/database');
const { logAdminActivity } = require('../../middleware/adminAuth');

/**
 * 获取分类列表（后台专用）
 */
const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search; // 可选的搜索关键词

    // 构建查询条件
    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE name LIKE ? OR description LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM categories ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取分类列表，包含文章数量统计
    const categoriesQuery = `
      SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(a.id) as article_count,
        COUNT(CASE WHEN a.status = 'published' THEN 1 END) as published_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      ${whereClause}
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const categories = await query(categoriesQuery, [...queryParams, limit, offset]);

    res.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取分类列表失败'
    });
  }
};

/**
 * 获取单个分类详情（后台专用）
 */
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryResult = await query(`
      SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(a.id) as article_count,
        COUNT(CASE WHEN a.status = 'published' THEN 1 END) as published_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.description, c.created_at
    `, [id]);

    if (categoryResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '分类不存在'
      });
    }

    res.json({
      category: categoryResult[0]
    });

  } catch (error) {
    console.error('获取分类详情错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取分类详情失败'
    });
  }
};

/**
 * 创建分类
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '分类名称不能为空'
      });
    }

    // 检查分类名称是否已存在
    const existingCategory = await query('SELECT id FROM categories WHERE name = ?', [name]);
    if (existingCategory.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '分类名称已存在'
      });
    }

    const result = await query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );

    // 记录活动日志
    await logAdminActivity(req, 'create', 'category', result.insertId, `创建分类: ${name}`);

    res.status(201).json({
      message: '分类创建成功',
      category: {
        id: result.insertId,
        name,
        description,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '创建分类失败'
    });
  }
};

/**
 * 更新分类
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // 检查分类是否存在
    const existingCategory = await query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existingCategory.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '分类不存在'
      });
    }

    // 如果要更新名称，检查新名称是否已被其他分类使用
    if (name && name !== existingCategory[0].name) {
      const nameCheck = await query('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
      if (nameCheck.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '分类名称已存在'
        });
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '没有提供要更新的字段'
      });
    }

    updateValues.push(id);

    await query(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 记录活动日志
    await logAdminActivity(req, 'update', 'category', id, `更新分类: ${name || existingCategory[0].name}`);

    // 返回更新后的分类
    const updatedCategory = await query(`
      SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(a.id) as article_count,
        COUNT(CASE WHEN a.status = 'published' THEN 1 END) as published_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.description, c.created_at
    `, [id]);

    res.json({
      message: '分类更新成功',
      category: updatedCategory[0]
    });

  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新分类失败'
    });
  }
};

/**
 * 删除分类
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查分类是否存在
    const existingCategory = await query('SELECT name FROM categories WHERE id = ?', [id]);
    if (existingCategory.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '分类不存在'
      });
    }

    // 检查分类下是否有文章
    const articleCount = await query('SELECT COUNT(*) as count FROM articles WHERE category_id = ?', [id]);
    if (articleCount[0].count > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '该分类下还有文章，无法删除。请先移动或删除相关文章。'
      });
    }

    // 删除分类
    await query('DELETE FROM categories WHERE id = ?', [id]);

    // 记录活动日志
    await logAdminActivity(req, 'delete', 'category', id, `删除分类: ${existingCategory[0].name}`);

    res.json({
      message: '分类删除成功'
    });

  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除分类失败'
    });
  }
};

/**
 * 获取分类下的文章列表
 */
const getCategoryArticles = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // 可选的状态筛选

    // 检查分类是否存在
    const categoryResult = await query('SELECT name FROM categories WHERE id = ?', [id]);
    if (categoryResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '分类不存在'
      });
    }

    // 构建查询条件
    let whereClause = 'WHERE a.category_id = ?';
    let queryParams = [id];

    if (status) {
      whereClause += ' AND a.status = ?';
      queryParams.push(status);
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM articles a ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取文章列表
    const articlesQuery = `
      SELECT 
        a.id, a.title, a.summary, a.cover_image, a.published_at, 
        a.view_count, a.status, a.created_at, a.updated_at
      FROM articles a
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = await query(articlesQuery, [...queryParams, limit, offset]);

    res.json({
      category: categoryResult[0],
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取分类文章列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取分类文章列表失败'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryArticles
};
