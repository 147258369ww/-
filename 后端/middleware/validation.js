const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// 验证结果处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    throw new AppError('请求参数验证失败', 400, errorMessages);
  }
  next();
};

// 文章验证规则
const validateArticle = [
  body('title')
    .notEmpty()
    .withMessage('文章标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('文章标题长度应在1-200字符之间'),
  
  body('content')
    .notEmpty()
    .withMessage('文章内容不能为空')
    .isLength({ min: 10 })
    .withMessage('文章内容至少需要10个字符'),
  
  body('summary')
    .optional()
    .isLength({ max: 500 })
    .withMessage('文章摘要不能超过500字符'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  
  body('cover_image')
    .optional()
    .isURL()
    .withMessage('封面图片必须是有效的URL'),
  
  handleValidationErrors
];

// 分类验证规则
const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('分类名称长度应在1-100字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('分类描述不能超过500字符'),
  
  handleValidationErrors
];

// 评论验证规则
const validateComment = [
  body('content')
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ min: 1, max: 1000 })
    .withMessage('评论内容长度应在1-1000字符之间'),
  
  body('author_name')
    .notEmpty()
    .withMessage('作者姓名不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('作者姓名长度应在1-100字符之间'),
  
  body('author_email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .isLength({ max: 150 })
    .withMessage('邮箱长度不能超过150字符'),
  
  handleValidationErrors
];

// 订阅验证规则
const validateSubscription = [
  body('email')
    .notEmpty()
    .withMessage('邮箱地址不能为空')
    .isEmail()
    .withMessage('邮箱格式不正确')
    .isLength({ max: 150 })
    .withMessage('邮箱长度不能超过150字符'),
  
  handleValidationErrors
];

// ID参数验证
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID必须是正整数'),
  
  handleValidationErrors
];

// 分页参数验证
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('sort')
    .optional()
    .isIn(['id', 'title', 'published_at', 'view_count', 'created_at', 'updated_at'])
    .withMessage('排序字段不正确'),
  
  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('排序方向必须是ASC或DESC'),
  
  handleValidationErrors
];

// 搜索参数验证
const validateSearch = [
  query('q')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度应在1-100字符之间'),
  
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  
  ...validatePagination.slice(0, -1), // 复用分页验证，但不包括handleValidationErrors
  
  handleValidationErrors
];

// 邮件发送验证规则
const validateNewsletter = [
  body('subject')
    .notEmpty()
    .withMessage('邮件主题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('邮件主题长度应在1-200字符之间'),
  
  body('content')
    .notEmpty()
    .withMessage('邮件内容不能为空')
    .isLength({ min: 10 })
    .withMessage('邮件内容至少需要10个字符'),
  
  handleValidationErrors
];

module.exports = {
  validateArticle,
  validateCategory,
  validateComment,
  validateSubscription,
  validateId,
  validatePagination,
  validateSearch,
  validateNewsletter,
  handleValidationErrors,
  validate: handleValidationErrors // 添加别名
};
