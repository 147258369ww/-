const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  batchUpdateStatus
} = require('../../controllers/admin/articlesController');

const router = express.Router();

// 创建文章验证规则
const createArticleValidation = [
  body('title')
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  body('content')
    .notEmpty()
    .withMessage('内容不能为空'),
  body('summary')
    .optional()
    .isLength({ max: 500 })
    .withMessage('摘要长度不能超过500个字符'),
  body('cover_image')
    .optional()
    .isURL()
    .withMessage('封面图片必须是有效的URL'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('状态必须是 published 或 draft')
];

// 更新文章验证规则
const updateArticleValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  body('content')
    .optional()
    .notEmpty()
    .withMessage('内容不能为空'),
  body('summary')
    .optional()
    .isLength({ max: 500 })
    .withMessage('摘要长度不能超过500个字符'),
  body('cover_image')
    .optional()
    .isURL()
    .withMessage('封面图片必须是有效的URL'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('状态必须是 published 或 draft')
];

// 批量更新状态验证规则
const batchUpdateValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('请提供要更新的文章ID列表'),
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('文章ID必须是正整数'),
  body('status')
    .isIn(['published', 'draft'])
    .withMessage('状态必须是 published 或 draft')
];

// 路由定义
router.get('/', getArticles);
router.get('/:id', getArticle);
router.post('/', createArticleValidation, validate, createArticle);
router.put('/:id', updateArticleValidation, validate, updateArticle);
router.delete('/:id', deleteArticle);
router.patch('/batch-status', batchUpdateValidation, validate, batchUpdateStatus);

module.exports = router;
