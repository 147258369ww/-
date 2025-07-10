const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const {
  getComments,
  getComment,
  updateCommentStatus,
  batchUpdateStatus,
  deleteComment,
  batchDeleteComments,
  getCommentStats
} = require('../../controllers/admin/commentsController');

const router = express.Router();

// 更新评论状态验证规则
const updateStatusValidation = [
  body('status')
    .isIn(['approved', 'pending', 'spam'])
    .withMessage('状态必须是 approved、pending 或 spam')
];

// 批量更新状态验证规则
const batchUpdateValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('请提供要更新的评论ID列表'),
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('评论ID必须是正整数'),
  body('status')
    .isIn(['approved', 'pending', 'spam'])
    .withMessage('状态必须是 approved、pending 或 spam')
];

// 批量删除验证规则
const batchDeleteValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('请提供要删除的评论ID列表'),
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('评论ID必须是正整数')
];

// 路由定义
router.get('/', getComments);
router.get('/stats', getCommentStats);
router.get('/:id', getComment);
router.patch('/:id/status', updateStatusValidation, validate, updateCommentStatus);
router.patch('/batch-status', batchUpdateValidation, validate, batchUpdateStatus);
router.delete('/:id', deleteComment);
router.delete('/', batchDeleteValidation, validate, batchDeleteComments);

module.exports = router;
