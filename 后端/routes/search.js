const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// 搜索文章
router.get('/', searchController.searchArticles);

// 获取热门搜索词
router.get('/popular', searchController.getPopularSearchTerms);

// 搜索建议
router.get('/suggestions', searchController.getSearchSuggestions);

module.exports = router;
