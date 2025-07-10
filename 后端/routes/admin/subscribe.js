const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const {
  getSubscribers,
  getSubscriberStats,
  updateSubscriberStatus,
  deleteSubscriber,
  batchDeleteSubscribers,
  sendEmailNotification,
  exportSubscribers
} = require('../../controllers/admin/subscribeController');

const router = express.Router();

// 更新订阅者状态验证规则
const updateStatusValidation = [
  body('status')
    .isIn(['active', 'unsubscribed'])
    .withMessage('状态必须是 active 或 unsubscribed')
];

// 批量删除验证规则
const batchDeleteValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('请提供要删除的订阅者ID列表'),
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('订阅者ID必须是正整数')
];

// 发送邮件验证规则
const sendEmailValidation = [
  body('subject')
    .notEmpty()
    .withMessage('邮件主题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('邮件主题长度必须在1-200个字符之间'),
  body('content')
    .notEmpty()
    .withMessage('邮件内容不能为空'),
  body('recipients')
    .optional()
    .custom((value) => {
      if (value !== 'all' && !Array.isArray(value)) {
        throw new Error('收件人必须是 "all" 或者ID数组');
      }
      return true;
    })
];

// 路由定义
router.get('/', getSubscribers);
router.get('/stats', getSubscriberStats);
router.get('/export', exportSubscribers);
router.patch('/:id/status', updateStatusValidation, validate, updateSubscriberStatus);
router.delete('/:id', deleteSubscriber);
router.delete('/', batchDeleteValidation, validate, batchDeleteSubscribers);
router.post('/send-email', sendEmailValidation, validate, sendEmailNotification);

module.exports = router;
