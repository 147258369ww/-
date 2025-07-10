const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const articlesController = require('../controllers/articlesController');
const commentsController = require('../controllers/commentsController');

// 配置multer用于图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按日期创建目录
    const today = new Date();
    const uploadDir = path.join(
      __dirname, 
      '../public/uploads/images',
      today.getFullYear().toString(),
      String(today.getMonth() + 1).padStart(2, '0')
    );
    
    // 确保目录存在
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 使用UUID命名图片文件
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, uniqueId + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// 路由定义
router.get('/', articlesController.getArticles);
router.get('/:id', articlesController.getArticleById);
router.post('/', upload.array('images', 10), articlesController.createArticle);
router.put('/:id', upload.array('images', 10), articlesController.updateArticle);
router.delete('/:id', articlesController.deleteArticle);

// 文章评论相关路由
router.get('/:id/comments', commentsController.getArticleComments);
router.post('/:id/comments', commentsController.createComment);

// 图片上传单独的路由
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    // 构建图片URL
    const today = new Date();
    const imageUrl = `/uploads/images/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${req.file.filename}`;

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '图片上传失败',
      error: error.message
    });
  }
});

module.exports = router;
