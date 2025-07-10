const { query } = require('../../config/database');

/**
 * 获取网站概览统计
 */
const getOverviewStats = async (req, res) => {
  try {
    // 文章统计
    const articleStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as week_count,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as month_count
      FROM articles
    `);

    // 分类统计
    const categoryStats = await query(`
      SELECT COUNT(*) as total FROM categories
    `);

    // 评论统计
    const commentStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'spam' THEN 1 END) as spam,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as week_count
      FROM comments
    `);

    // 订阅者统计
    const subscriberStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as week_count
      FROM subscribers
    `);

    // 媒体文件统计
    const mediaStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(size) as total_size,
        COUNT(CASE WHEN type LIKE 'image/%' THEN 1 END) as images,
        COUNT(CASE WHEN type LIKE 'video/%' THEN 1 END) as videos,
        COUNT(CASE WHEN type LIKE 'audio/%' THEN 1 END) as audios,
        COUNT(CASE WHEN DATE(uploaded_at) = CURDATE() THEN 1 END) as today_count
      FROM media
    `);

    // 总浏览量
    const viewStats = await query(`
      SELECT SUM(view_count) as total_views FROM articles WHERE status = 'published'
    `);

    res.json({
      overview: {
        articles: articleStats[0],
        categories: categoryStats[0],
        comments: commentStats[0],
        subscribers: subscriberStats[0],
        media: {
          ...mediaStats[0],
          total_size_mb: Math.round((mediaStats[0].total_size || 0) / 1024 / 1024 * 100) / 100
        },
        views: viewStats[0]
      }
    });

  } catch (error) {
    console.error('获取概览统计错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取概览统计失败'
    });
  }
};

/**
 * 获取访问趋势数据
 */
const getVisitTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30; // 默认30天

    // 文章发布趋势
    const articleTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM articles 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // 评论趋势
    const commentTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM comments 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // 订阅趋势
    const subscribeTrends = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM subscribers 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // 生成完整的日期范围
    const dateRange = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    // 填充缺失的日期数据
    const fillMissingDates = (trends) => {
      const trendMap = {};
      trends.forEach(trend => {
        trendMap[trend.date] = trend.count;
      });

      return dateRange.map(date => ({
        date,
        count: trendMap[date] || 0
      }));
    };

    res.json({
      trends: {
        articles: fillMissingDates(articleTrends),
        comments: fillMissingDates(commentTrends),
        subscribers: fillMissingDates(subscribeTrends)
      }
    });

  } catch (error) {
    console.error('获取访问趋势错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取访问趋势失败'
    });
  }
};

/**
 * 获取热门内容数据
 */
const getPopularContent = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 热门文章（按浏览量）
    const popularArticles = await query(`
      SELECT 
        a.id, a.title, a.view_count, a.published_at,
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      ORDER BY a.view_count DESC
      LIMIT ?
    `, [limit]);

    // 最新文章
    const recentArticles = await query(`
      SELECT 
        a.id, a.title, a.view_count, a.published_at,
        c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT ?
    `, [limit]);

    // 热门分类（按文章数量）
    const popularCategories = await query(`
      SELECT 
        c.id, c.name, c.description,
        COUNT(a.id) as article_count,
        SUM(a.view_count) as total_views
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
      GROUP BY c.id, c.name, c.description
      ORDER BY article_count DESC, total_views DESC
      LIMIT ?
    `, [limit]);

    // 最活跃的评论文章
    const mostCommentedArticles = await query(`
      SELECT 
        a.id, a.title, a.view_count, a.published_at,
        c.name as category_name,
        COUNT(cm.id) as comment_count
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN comments cm ON a.id = cm.article_id AND cm.status = 'approved'
      WHERE a.status = 'published'
      GROUP BY a.id, a.title, a.view_count, a.published_at, c.name
      ORDER BY comment_count DESC
      LIMIT ?
    `, [limit]);

    res.json({
      popular: {
        articles: popularArticles,
        recent_articles: recentArticles,
        categories: popularCategories,
        most_commented: mostCommentedArticles
      }
    });

  } catch (error) {
    console.error('获取热门内容错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取热门内容失败'
    });
  }
};

/**
 * 获取分类统计详情
 */
const getCategoryStats = async (req, res) => {
  try {
    const categoryStats = await query(`
      SELECT 
        c.id, c.name, c.description,
        COUNT(a.id) as total_articles,
        COUNT(CASE WHEN a.status = 'published' THEN 1 END) as published_articles,
        COUNT(CASE WHEN a.status = 'draft' THEN 1 END) as draft_articles,
        SUM(a.view_count) as total_views,
        AVG(a.view_count) as avg_views,
        COUNT(cm.id) as total_comments
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      LEFT JOIN comments cm ON a.id = cm.article_id AND cm.status = 'approved'
      GROUP BY c.id, c.name, c.description
      ORDER BY total_articles DESC, total_views DESC
    `);

    res.json({
      category_stats: categoryStats
    });

  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取分类统计失败'
    });
  }
};

/**
 * 获取用户活动统计
 */
const getUserActivityStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7; // 默认7天

    // 管理员活动统计
    const adminActivity = await query(`
      SELECT 
        action,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM activity_logs 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY action, DATE(created_at)
      ORDER BY date DESC, count DESC
    `, [days]);

    // 评论者活动
    const commentActivity = await query(`
      SELECT 
        author_name,
        author_email,
        COUNT(*) as comment_count,
        MAX(created_at) as last_comment
      FROM comments
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY author_name, author_email
      ORDER BY comment_count DESC
      LIMIT 20
    `, [days]);

    // 按小时统计活动
    const hourlyActivity = await query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as activity_count
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, [days]);

    res.json({
      user_activity: {
        admin_activity: adminActivity,
        comment_activity: commentActivity,
        hourly_activity: hourlyActivity
      }
    });

  } catch (error) {
    console.error('获取用户活动统计错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取用户活动统计失败'
    });
  }
};

module.exports = {
  getOverviewStats,
  getVisitTrends,
  getPopularContent,
  getCategoryStats,
  getUserActivityStats
};
