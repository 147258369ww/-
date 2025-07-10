const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const {
  upload,
  getMediaFiles,
  uploadMedia,
  getMediaFile,
  deleteMediaFile,
  batchDeleteMedia,
  getUnusedMedia,
  cleanupUnusedMedia
} = require('../../controllers/admin/mediaController');

const router = express.Router();

// 批量删除验证规则
const batchDeleteValidation = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('请提供要删除的媒体文件ID列表'),
  body('ids.*')
    .isInt({ min: 1 })
    .withMessage('媒体文件ID必须是正整数')
];

// 路由定义
router.get('/', getMediaFiles);
router.get('/unused', getUnusedMedia);
router.get('/:id', getMediaFile);
router.post('/upload', upload.single('file'), uploadMedia);
router.delete('/cleanup', cleanupUnusedMedia);
router.delete('/:id', deleteMediaFile);
router.delete('/', batchDeleteValidation, validate, batchDeleteMedia);

module.exports = router;
