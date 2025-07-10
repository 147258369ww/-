const { query } = require('../config/database');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// 搜索文章
const searchArticles = asyncHandler(async (req, res) => {
  const { 
    q, // 搜索关键词
    page = 1, 
    limit = 10,
    category_id,
    sort = 'relevance', // relevance, published_at, view_count
    order = 'DESC'
  } = req.query;

  if (!q || q.trim().length === 0) {
    throw new AppError('搜索关键词不能为空', 400);
  }

  const searchTerm = q.trim();
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // 构建搜索条件
  let whereClause = `WHERE (
    a.title LIKE '%${searchTerm}%' OR
    a.content LIKE '%${searchTerm}%' OR
    a.summary LIKE '%${searchTerm}%'
  )`;

  // 如果指定了分类
  if (category_id) {
    whereClause += ` AND a.category_id = ${parseInt(category_id)}`;
  }

  // 构建排序条件
  let orderClause;
  switch (sort) {
    case 'relevance':
      // 按相关性排序：标题匹配权重最高，然后是摘要，最后是内容
      orderClause = `ORDER BY (
        CASE
          WHEN a.title LIKE '%${searchTerm}%' THEN 3
          WHEN a.summary LIKE '%${searchTerm}%' THEN 2
          WHEN a.content LIKE '%${searchTerm}%' THEN 1
          ELSE 0
        END
      ) DESC, a.published_at DESC`;
      break;
    case 'published_at':
      orderClause = `ORDER BY a.published_at ${order}`;
      break;
    case 'view_count':
      orderClause = `ORDER BY a.view_count ${order}`;
      break;
    default:
      orderClause = `ORDER BY a.published_at DESC`;
  }

  // 搜索文章
  const searchSQL = `
    SELECT
      a.id,
      a.title,
      a.summary,
      a.cover_image,
      a.published_at,
      a.view_count,
      a.created_at,
      a.updated_at,
      c.name as category_name,
      c.id as category_id,
      (
        CASE
          WHEN a.title LIKE '%${searchTerm}%' THEN 3
          WHEN a.summary LIKE '%${searchTerm}%' THEN 2
          WHEN a.content LIKE '%${searchTerm}%' THEN 1
          ELSE 0
        END
      ) as relevance_score
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    ${whereClause}
    ${orderClause}
    LIMIT ${limitNum} OFFSET ${offset}
  `;

  const articles = await query(searchSQL);

  // 获取搜索结果总数
  const countSQL = `
    SELECT COUNT(*) as total
    FROM articles a
    ${whereClause}
  `;
  const [{ total }] = await query(countSQL);

  // 高亮搜索关键词（简单实现）
  const highlightedArticles = articles.map(article => ({
    ...article,
    title: highlightSearchTerm(article.title, searchTerm),
    summary: article.summary ? highlightSearchTerm(article.summary, searchTerm) : null
  }));

  res.json({
    success: true,
    data: {
      query: searchTerm,
      articles: highlightedArticles,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// 获取热门搜索词（基于文章标题和内容的词频分析）
const getPopularSearchTerms = asyncHandler(async (req, res) => {
  // 这里可以实现基于搜索日志的热门搜索词
  // 目前返回一些示例数据
  const popularTerms = [
    { term: '设计', count: 25 },
    { term: '前端', count: 18 },
    { term: 'React', count: 15 },
    { term: 'JavaScript', count: 12 },
    { term: 'CSS', count: 10 },
    { term: 'Vue', count: 8 },
    { term: 'Node.js', count: 6 },
    { term: '人工智能', count: 5 }
  ];

  res.json({
    success: true,
    data: popularTerms
  });
});

// 搜索建议（自动完成）
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({
      success: true,
      data: []
    });
  }

  const searchTerm = q.trim();

  // 从文章标题中获取建议
  const suggestions = await query(`
    SELECT DISTINCT title, view_count
    FROM articles
    WHERE title LIKE ? AND status = 'published'
    ORDER BY view_count DESC
    LIMIT 10
  `, [`%${searchTerm}%`]);

  const suggestionList = suggestions.map(item => item.title);

  res.json({
    success: true,
    data: suggestionList
  });
});

// 高亮搜索关键词的辅助函数
function highlightSearchTerm(text, searchTerm) {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

module.exports = {
  searchArticles,
  getPopularSearchTerms,
  getSearchSuggestions
};
