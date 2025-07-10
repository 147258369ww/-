# 博客网站 API 接口文档

## 概述

本文档详细描述了个人博客系统的RESTful API接口。所有API都遵循REST风格设计，通过HTTP方法表示操作类型，使用JSON进行数据交换。

**基础URL**: `http://localhost:3000`

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功描述",
  "data": {
    // 返回的数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

## 1. 文章接口

### 1.1 获取文章列表

获取所有文章的列表，支持分页、排序和筛选。

- **URL**: `/api/articles`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为10
  - `category` (查询参数, 可选): 按分类ID筛选
  - `sort` (查询参数, 可选): 排序字段 (`date`, `views`等)
  - `order` (查询参数, 可选): 排序方向 (`asc`, `desc`)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "文章标题",
        "summary": "文章摘要...",
        "cover_image": "/uploads/images/2024/05/image.jpg",
        "published_at": "2024-05-20T08:30:00Z",
        "category_id": 2,
        "view_count": 125
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

### 1.2 获取单篇文章

根据ID获取文章的详细信息。

- **URL**: `/api/articles/:id`
- **方法**: `GET`
- **参数**:
  - `id` (路径参数): 文章ID

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "文章标题",
    "content": "文章的HTML内容...",
    "summary": "文章摘要",
    "cover_image": "/uploads/images/2024/05/image.jpg",
    "published_at": "2024-05-20T08:30:00Z",
    "category_id": 2,
    "category_name": "技术",
    "view_count": 126,
    "created_at": "2024-05-19T15:30:00Z",
    "updated_at": "2024-05-20T10:15:00Z"
  }
}
```
## 2. 分类接口

### 2.1 获取所有分类

获取所有文章分类列表。

- **URL**: `/api/categories`
- **方法**: `GET`
- **参数**: 无

- **成功响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "description": "技术相关文章",
      "article_count": 15
    },
    {
      "id": 2,
      "name": "生活",
      "description": "生活随笔",
      "article_count": 8
    }
  ]
}
```

### 2.2 获取分类详情

获取特定分类的详细信息。

- **URL**: `/api/categories/:id`
- **方法**: `GET`
- **参数**:
  - `id` (路径参数): 分类ID

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "技术",
    "description": "技术相关文章",
    "created_at": "2024-05-15T08:30:00Z",
    "article_count": 15
  }
}
```

### 2.3 获取分类下的文章

获取特定分类下的所有文章。

- **URL**: `/api/categories/:id/articles`
- **方法**: `GET`
- **参数**:
  - `id` (路径参数): 分类ID
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为10

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "name": "技术"
    },
    "articles": [
      {
        "id": 3,
        "title": "技术文章标题",
        "summary": "文章摘要...",
        "cover_image": "/uploads/images/2024/05/image.jpg",
        "published_at": "2024-05-20T08:30:00Z",
        "view_count": 89
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

## 3. 评论接口

### 3.1 获取文章评论

获取特定文章的评论列表。

- **URL**: `/api/articles/:id/comments`
- **方法**: `GET`
- **参数**:
  - `id` (路径参数): 文章ID
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为10

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 5,
        "content": "评论内容...",
        "author_name": "张三",
        "created_at": "2024-05-21T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 18,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

### 3.2 提交评论

为特定文章提交新评论。

- **URL**: `/api/articles/:id/comments`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `id` (路径参数): 文章ID
  - `content` (请求体): 评论内容
  - `author_name` (请求体): 评论者姓名
  - `author_email` (请求体): 评论者邮箱

- **请求体示例**:
```json
{
  "content": "这篇文章很棒！",
  "author_name": "李四",
  "author_email": "lisi@example.com"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "评论提交成功，等待审核",
  "data": {
    "id": 19,
    "content": "这篇文章很棒！",
    "author_name": "李四",
    "created_at": "2024-05-25T10:15:30Z"
  }
}
```

## 4. 搜索接口

### 4.1 搜索文章

根据关键词搜索文章。

- **URL**: `/api/search`
- **方法**: `GET`
- **参数**:
  - `q` (查询参数): 搜索关键词
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为10

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "query": "关键词",
    "results": [
      {
        "id": 8,
        "title": "包含关键词的文章标题",
        "summary": "文章摘要...",
        "cover_image": "/uploads/images/2024/05/image.jpg",
        "published_at": "2024-05-18T08:30:00Z",
        "category_name": "技术",
        "relevance_score": 0.85
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### 4.2 获取热门搜索词

获取网站上的热门搜索关键词。

- **URL**: `/api/search/popular`
- **方法**: `GET`
- **参数**:
  - `limit` (查询参数, 可选): 返回数量，默认为10

- **成功响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "term": "前端开发",
      "count": 145
    },
    {
      "term": "Node.js",
      "count": 98
    }
  ]
}
```
### 4.3 获取搜索建议

根据用户输入获取搜索建议。

- **URL**: `/api/search/suggestions`
- **方法**: `GET`
- **参数**:
  - `q` (查询参数): 用户已输入的关键词
  - `limit` (查询参数, 可选): 返回建议数量，默认为5

- **成功响应示例**:
```json
{
  "success": true,
  "data": [
    "前端开发教程",
    "前端开发工具",
    "前端开发框架对比"
  ]
}
```

## 5. 订阅接口

### 5.1 添加订阅

用户订阅博客更新。

- **URL**: `/api/subscribe`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `email` (请求体): 用户邮箱

- **请求体示例**:
```json
{
  "email": "user@example.com"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "订阅成功，感谢您的关注！"
}
```

### 5.2 取消订阅

取消博客更新订阅。

- **URL**: `/api/subscribe/unsubscribe`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `email` (请求体): 用户邮箱

- **请求体示例**:
```json
{
  "email": "user@example.com"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "您已成功取消订阅"
}
```


## 状态码说明

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数有误
- `401 Unauthorized`: 未授权访问
- `403 Forbidden`: 禁止访问
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 注意事项

1. 所有API请求都需要设置正确的`Content-Type`头
2. 文件上传API使用`multipart/form-data`格式
3. 图片上传大小限制为5MB
4. 图片格式支持: jpg, jpeg, png, gif, webp 