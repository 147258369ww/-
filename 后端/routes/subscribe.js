const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscribeController');

// 添加订阅
router.post('/', subscribeController.addSubscriber);

// 取消订阅
router.post('/unsubscribe', subscribeController.unsubscribe);

// 获取订阅者列表（管理用）
router.get('/subscribers', subscribeController.getSubscribers);

// 获取订阅统计
router.get('/stats', subscribeController.getSubscriptionStats);

// 发送邮件通知
router.post('/newsletter', subscribeController.sendNewsletter);

module.exports = router;
