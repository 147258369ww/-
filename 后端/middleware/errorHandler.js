// 统一错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // 默认错误响应
  let status = 500;
  let message = '服务器内部错误';
  let details = null;

  // 根据错误类型设置响应
  if (err.name === 'ValidationError') {
    status = 400;
    message = '请求参数验证失败';
    details = err.details || err.message;
  } else if (err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = '数据已存在';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    status = 400;
    message = '关联数据不存在';
  } else if (err.code === 'ENOENT') {
    status = 404;
    message = '文件不存在';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = '文件大小超出限制';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = '不支持的文件类型';
  } else if (err.status) {
    status = err.status;
    message = err.message;
  }

  // 开发环境返回详细错误信息
  const response = {
    error: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.details = details || err.message;
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

// 异步错误包装器
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError
};
