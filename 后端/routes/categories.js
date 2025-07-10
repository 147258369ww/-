const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

// 路由定义
router.get('/', categoriesController.getCategories);
router.get('/:id', categoriesController.getCategoryById);
router.get('/:id/articles', categoriesController.getCategoryArticles);
router.post('/', categoriesController.createCategory);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
