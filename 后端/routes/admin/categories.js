const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryArticles
} = require('../../controllers/admin/categoriesController');

const router = express.Router();

// 创建分类验证规则
const createCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('分类名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('分类描述长度不能超过500个字符')
];

// 更新分类验证规则
const updateCategoryValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('分类名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('分类描述长度不能超过500个字符')
];

// 路由定义
router.get('/', getCategories);
router.get('/:id', getCategory);
router.get('/:id/articles', getCategoryArticles);
router.post('/', createCategoryValidation, validate, createCategory);
router.put('/:id', updateCategoryValidation, validate, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
