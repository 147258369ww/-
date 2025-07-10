const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');

// 获取所有评论（管理用）
router.get('/', commentsController.getAllComments);

// 删除评论
router.delete('/:commentId', commentsController.deleteComment);

module.exports = router;
