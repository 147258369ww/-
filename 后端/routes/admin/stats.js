const express = require('express');
const {
  getOverviewStats,
  getVisitTrends,
  getPopularContent,
  getCategoryStats,
  getUserActivityStats
} = require('../../controllers/admin/statsController');

const router = express.Router();

// 路由定义
router.get('/overview', getOverviewStats);
router.get('/trends', getVisitTrends);
router.get('/popular', getPopularContent);
router.get('/categories', getCategoryStats);
router.get('/activity', getUserActivityStats);

module.exports = router;
