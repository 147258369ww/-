const { query, queryOne } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 获取所有分类
const getCategories = asyncHandler(async (req, res) => {
  const categories = await query(`
    SELECT 
      c.*,
      COUNT(a.id) as article_count
    FROM categories c
    LEFT JOIN articles a ON c.id = a.category_id
    GROUP BY c.id
    ORDER BY c.created_at ASC
  `);

  res.json({
    success: true,
    data: categories
  });
});

// 获取单个分类详情
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await queryOne(`
    SELECT 
      c.*,
      COUNT(a.id) as article_count
    FROM categories c
    LEFT JOIN articles a ON c.id = a.category_id
    WHERE c.id = ?
    GROUP BY c.id
  `, [id]);

  if (!category) {
    throw new AppError('分类不存在', 404);
  }

  res.json({
    success: true,
    data: category
  });
});

// 获取特定分类下的文章
const getCategoryArticles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    page = 1, 
    limit = 10, 
    sort = 'published_at',
    order = 'DESC' 
  } = req.query;

  // 检查分类是否存在
  const category = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!category) {
    throw new AppError('分类不存在', 404);
  }

  const offset = (page - 1) * limit;

  // 获取分类下的文章
  const articles = await query(`
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
    WHERE a.category_id = ?
    ORDER BY a.${sort} ${order}
    LIMIT ? OFFSET ?
  `, [id, parseInt(limit), parseInt(offset)]);

  // 获取总数
  const [{ total }] = await query(`
    SELECT COUNT(*) as total 
    FROM articles 
    WHERE category_id = ?
  `, [id]);

  res.json({
    success: true,
    data: {
      category,
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

// 创建分类
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new AppError('分类名称不能为空', 400);
  }

  // 检查分类名是否已存在
  const existingCategory = await queryOne('SELECT id FROM categories WHERE name = ?', [name]);
  if (existingCategory) {
    throw new AppError('分类名称已存在', 409);
  }

  const result = await query(`
    INSERT INTO categories (name, description)
    VALUES (?, ?)
  `, [name, description]);

  const newCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [result.insertId]);

  res.status(201).json({
    success: true,
    message: '分类创建成功',
    data: newCategory
  });
});

// 更新分类
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // 检查分类是否存在
  const existingCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!existingCategory) {
    throw new AppError('分类不存在', 404);
  }

  // 如果要更新名称，检查新名称是否已存在
  if (name && name !== existingCategory.name) {
    const duplicateCategory = await queryOne('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
    if (duplicateCategory) {
      throw new AppError('分类名称已存在', 409);
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
    throw new AppError('没有提供要更新的字段', 400);
  }

  updateValues.push(id);

  await query(`
    UPDATE categories 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `, updateValues);

  const updatedCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);

  res.json({
    success: true,
    message: '分类更新成功',
    data: updatedCategory
  });
});

// 删除分类
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 检查分类是否存在
  const existingCategory = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!existingCategory) {
    throw new AppError('分类不存在', 404);
  }

  // 检查是否有文章使用此分类
  const [{ count }] = await query('SELECT COUNT(*) as count FROM articles WHERE category_id = ?', [id]);
  if (count > 0) {
    throw new AppError('该分类下还有文章，无法删除', 400);
  }

  await query('DELETE FROM categories WHERE id = ?', [id]);

  res.json({
    success: true,
    message: '分类删除成功'
  });
});

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryArticles,
  createCategory,
  updateCategory,
  deleteCategory
};
