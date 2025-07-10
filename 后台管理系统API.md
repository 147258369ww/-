# 博客网站后台管理系统 API 接口文档

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

## 1. 文章管理API

### 1.1 获取文章列表

获取所有文章的列表，支持分页、排序和筛选。

- **URL**: `/api/admin/articles`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为10
  - `category` (查询参数, 可选): 按分类ID筛选
  - `status` (查询参数, 可选): 文章状态筛选 (`published`, `draft`)
  - `sort` (查询参数, 可选): 排序字段 (`date`, `views`, `title`)
  - `order` (查询参数, 可选): 排序方向 (`asc`, `desc`)
  - `search` (查询参数, 可选): 搜索关键词

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
        "category_name": "技术",
        "status": "published",
        "view_count": 125,
        "comment_count": 8,
        "created_at": "2024-05-19T15:30:00Z",
        "updated_at": "2024-05-20T10:15:00Z"
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

### 1.2 获取文章详情

根据ID获取文章的详细信息。

- **URL**: `/api/admin/articles/:id`
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
    "status": "published",
    "view_count": 126,
    "comment_count": 8,
    "tags": ["技术", "编程", "JavaScript"],
    "created_at": "2024-05-19T15:30:00Z",
    "updated_at": "2024-05-20T10:15:00Z",
    "meta": {
      "seo_title": "SEO优化标题",
      "seo_description": "SEO描述",
      "seo_keywords": "关键词1,关键词2"
    }
  }
}
```

### 1.3 创建文章

- **URL**: `/api/articles`
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `title` (表单字段): 文章标题
  - `content` (表单字段): 文章内容HTML
  - `summary` (表单字段): 文章摘要
  - `category_id` (表单字段): 分类ID
  - `published_at` (表单字段, 可选): 发布时间
  - `images[]` (文件字段, 可选): 要上传的图片文件(最多10个)
  - `cover_image` (表单字段, 可选): 封面图片URL

- **成功响应示例**:
```json
{
  "success": true,
  "message": "文章创建成功",
  "data": {
    "id": 5,
    "title": "新文章标题"
  }
}
```

### 1.4 更新文章

更新现有文章的信息，支持同时上传新图片。

- **URL**: `/api/articles/:id`
- **方法**: `PUT`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `id` (路径参数): 文章ID
  - `title` (表单字段, 可选): 文章标题
  - `content` (表单字段, 可选): 文章内容HTML
  - `summary` (表单字段, 可选): 文章摘要
  - `category_id` (表单字段, 可选): 分类ID
  - `published_at` (表单字段, 可选): 发布时间
  - `images[]` (文件字段, 可选): 要上传的新图片(最多10个)
  - `cover_image` (表单字段, 可选): 封面图片URL

- **成功响应示例**:
```json
{
  "success": true,
  "message": "文章更新成功",
  "data": {
    "id": 5
  }
}
```

### 1.5 上传图片

单独上传图片，用于文章编辑过程中。

- **URL**: `/api/articles/upload-image`
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `image` (文件字段): 要上传的图片文件

- **成功响应示例**:
```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "filename": "ac8de4e9-4e26-4c7b-8c26-58f76b14abc6.jpg",
    "originalname": "example.jpg",
    "size": 245789,
    "url": "/uploads/images/2024/05/ac8de4e9-4e26-4c7b-8c26-58f76b14abc6.jpg"
  }
}
```

### 1.6 删除文章

- **URL**: `/api/articles/:id`
- **方法**: `DELETE`
- **参数**:
  - `id` (路径参数): 文章ID

- **成功响应示例**:
```json
{
  "success": true,
  "message": "文章删除成功"
}
```

## 2. 分类管理API

### 2.1 获取分类列表

获取所有文章分类列表。

- **URL**: `/api/admin/categories`
- **方法**: `GET`
- **参数**: 
  - `sort` (查询参数, 可选): 排序字段 (`name`, `article_count`)
  - `order` (查询参数, 可选): 排序方向 (`asc`, `desc`)

- **成功响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "description": "技术相关文章",
      "article_count": 15,
      "created_at": "2024-05-15T08:30:00Z",
      "updated_at": "2024-05-20T10:15:00Z"
    },
    {
      "id": 2,
      "name": "生活",
      "description": "生活随笔",
      "article_count": 8,
      "created_at": "2024-05-15T08:30:00Z",
      "updated_at": "2024-05-20T10:15:00Z"
    }
  ]
}
```

### 2.2 获取分类详情

获取特定分类的详细信息。

- **URL**: `/api/admin/categories/:id`
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
    "article_count": 15,
    "created_at": "2024-05-15T08:30:00Z",
    "updated_at": "2024-05-20T10:15:00Z"
  }
}
```

### 2.3 创建分类

- **URL**: `/api/categories`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `name` (请求体): 分类名称
  - `description` (请求体, 可选): 分类描述

- **请求体示例**:
```json
{
  "name": "新分类",
  "description": "新分类的描述信息"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "分类创建成功",
  "data": {
    "id": 3,
    "name": "新分类"
  }
}
```

### 2.4 更新分类

更新现有分类信息。

- **URL**: `/api/categories/:id`
- **方法**: `PUT`
- **Content-Type**: `application/json`
- **参数**:
  - `id` (路径参数): 分类ID
  - `name` (请求体, 可选): 分类名称
  - `description` (请求体, 可选): 分类描述

- **请求体示例**:
```json
{
  "name": "更新的分类名",
  "description": "更新的分类描述"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "分类更新成功"
}
```

### 2.5 删除分类

- **URL**: `/api/categories/:id`
- **方法**: `DELETE`
- **参数**:
  - `id` (路径参数): 分类ID

- **成功响应示例**:
```json
{
  "success": true,
  "message": "分类删除成功"
}
```

## 3. 评论管理API

### 3.1 获取评论列表

获取所有评论列表，支持分页和筛选。

- **URL**: `/api/admin/comments`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为20
  - `article_id` (查询参数, 可选): 按文章ID筛选
  - `status` (查询参数, 可选): 评论状态筛选 (`approved`, `pending`, `spam`)
  - `sort` (查询参数, 可选): 排序字段 (`date`, `article`)
  - `order` (查询参数, 可选): 排序方向 (`asc`, `desc`)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 12,
        "content": "评论内容...",
        "author_name": "张三",
        "author_email": "zhangsan@example.com",
        "article_id": 5,
        "article_title": "相关文章标题",
        "status": "approved",
        "created_at": "2024-05-20T14:30:00Z",
        "ip_address": "192.168.1.1"
      }
    ],
    "pagination": {
      "total": 128,
      "page": 1,
      "limit": 20,
      "pages": 7
    }
  }
}
```

### 3.2 更新评论状态

更新评论的审核状态。

- **URL**: `/api/admin/comments/:id/status`
- **方法**: `PUT`
- **Content-Type**: `application/json`
- **参数**:
  - `id` (路径参数): 评论ID
  - `status` (请求体): 新状态 (`approved`, `pending`, `spam`)

- **请求体示例**:
```json
{
  "status": "approved"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "评论状态已更新"
}
```

### 3.3 删除评论

- **URL**: `/api/comments/:commentId`
- **方法**: `DELETE`
- **参数**:
  - `commentId` (路径参数): 评论ID

- **成功响应示例**:
```json
{
  "success": true,
  "message": "评论删除成功"
}
```

## 4. 订阅管理API

### 4.1 获取订阅者列表

获取所有订阅者列表。

- **URL**: `/api/subscribe/subscribers`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为20

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "subscribers": [
      {
        "id": 23,
        "email": "user@example.com",
        "status": "active",
        "created_at": "2024-04-12T08:30:00Z"
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

### 4.2 获取订阅统计

获取订阅相关统计信息。

- **URL**: `/api/subscribe/stats`
- **方法**: `GET`
- **参数**: 无

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "total_subscribers": 156,
    "active_subscribers": 142,
    "unsubscribed": 14,
    "subscription_rate": {
      "last_7_days": 12,
      "last_30_days": 45,
      "last_90_days": 86
    }
  }
}
```

### 4.3 发送邮件通知

发送邮件通知给订阅者。

- **URL**: `/api/subscribe/newsletter`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `subject` (请求体): 邮件主题
  - `content` (请求体): 邮件HTML内容
  - `preview` (请求体, 可选): 是否为预览模式，默认false

- **请求体示例**:
```json
{
  "subject": "博客更新通知",
  "content": "<h1>最新文章</h1><p>查看我们的最新内容...</p>",
  "preview": true
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "邮件已发送",
  "data": {
    "sent_to": 142,
    "preview_mode": true
  }
}
```

## 5. 用户认证API

### 5.1 获取当前管理员信息

获取当前登录管理员的详细信息。

- **URL**: `/api/admin/profile`
- **方法**: `GET`
- **参数**: 无

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "name": "超级管理员",
    "role": "administrator",
    "last_login": "2024-05-22T10:15:30Z",
    "avatar": "/uploads/avatars/admin.jpg"
  }
}
```

### 5.2 管理员登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `username` (请求体): 用户名
  - `password` (请求体): 密码
  - `remember` (请求体, 可选): 是否记住登录状态，默认false

- **请求体示例**:
```json
{
  "username": "admin",
  "password": "secure_password",
  "remember": true
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "administrator",
      "last_login": "2024-05-22T10:15:30Z"
    }
  }
}
```

### 5.3 退出登录

- **URL**: `/api/auth/logout`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**: 无

- **成功响应示例**:
```json
{
  "success": true,
  "message": "退出成功"
}
```

### 5.4 修改密码

- **URL**: `/api/auth/change-password`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `current_password` (请求体): 当前密码
  - `new_password` (请求体): 新密码
  - `confirm_password` (请求体): 确认新密码

- **请求体示例**:
```json
{
  "current_password": "current_secure_password",
  "new_password": "new_secure_password",
  "confirm_password": "new_secure_password"
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 5.5 修改个人信息

- **URL**: `/api/auth/update-profile`
- **方法**: `PUT`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `email` (表单字段, 可选): 电子邮件
  - `name` (表单字段, 可选): 姓名
  - `avatar` (文件字段, 可选): 头像图片

- **成功响应示例**:
```json
{
  "success": true,
  "message": "个人信息更新成功",
  "data": {
    "name": "超级管理员",
    "email": "admin@example.com",
    "avatar_url": "/uploads/avatars/admin.jpg"
  }
}
```

### 5.6 获取操作日志

获取管理员操作日志。

- **URL**: `/api/admin/activity-logs`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为20
  - `action` (查询参数, 可选): 按操作类型筛选
  - `start_date` (查询参数, 可选): 开始日期 (YYYY-MM-DD)
  - `end_date` (查询参数, 可选): 结束日期 (YYYY-MM-DD)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 123,
        "action": "article.create",
        "resource_id": 15,
        "resource_type": "article",
        "details": "创建了文章《新文章标题》",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "timestamp": "2024-05-22T10:15:30Z"
      }
    ],
    "pagination": {
      "total": 458,
      "page": 1,
      "limit": 20,
      "pages": 23
    }
  }
}
```

## 6. 统计数据API

### 6.1 获取网站概览统计

获取网站的总体统计数据。

- **URL**: `/api/admin/stats/overview`
- **方法**: `GET`
- **参数**: 
  - `period` (查询参数, 可选): 统计周期 (`today`, `week`, `month`, `year`)，默认为`week`

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "total_articles": 75,
    "total_views": 12538,
    "total_comments": 346,
    "total_subscribers": 156,
    "period_data": {
      "views": {
        "current": 1256,
        "previous": 985,
        "change_percentage": 27.5
      },
      "comments": {
        "current": 34,
        "previous": 42,
        "change_percentage": -19.0
      },
      "subscribers": {
        "current": 12,
        "previous": 8,
        "change_percentage": 50.0
      }
    },
    "article_categories": [
      { "name": "技术", "count": 45 },
      { "name": "生活", "count": 20 },
      { "name": "其他", "count": 10 }
    ]
  }
}
```

### 6.2 获取访问趋势数据

获取网站的访问趋势数据。

- **URL**: `/api/admin/stats/trends`
- **方法**: `GET`
- **参数**:
  - `period` (查询参数, 可选): 统计周期 (`day`, `week`, `month`), 默认为`day`
  - `start_date` (查询参数, 可选): 开始日期 (YYYY-MM-DD)
  - `end_date` (查询参数, 可选): 结束日期 (YYYY-MM-DD)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "period": "day",
    "start_date": "2024-05-15",
    "end_date": "2024-05-22",
    "metrics": [
      {
        "date": "2024-05-15",
        "views": 156,
        "unique_visitors": 89,
        "comments": 5
      },
      {
        "date": "2024-05-16",
        "views": 172,
        "unique_visitors": 98,
        "comments": 7
      }
    ]
  }
}
```

### 6.3 获取热门内容

获取网站的热门内容数据。

- **URL**: `/api/admin/stats/popular`
- **方法**: `GET`
- **参数**:
  - `period` (查询参数, 可选): 统计周期 (`week`, `month`, `all`), 默认为`week`
  - `limit` (查询参数, 可选): 返回结果数量，默认为10

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "popular_articles": [
      {
        "id": 5,
        "title": "热门文章标题",
        "views": 458,
        "comments": 23,
        "published_at": "2024-05-10T08:30:00Z"
      }
    ],
    "popular_categories": [
      {
        "id": 2,
        "name": "技术",
        "views": 1256
      }
    ],
    "search_keywords": [
      {
        "keyword": "JavaScript",
        "count": 89
      }
    ]
  }
}
```

## 7. 媒体管理API

### 7.1 获取媒体文件列表

获取所有上传的媒体文件列表。

- **URL**: `/api/admin/media`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为20
  - `type` (查询参数, 可选): 文件类型筛选 (`image`, `document`, `other`)
  - `sort` (查询参数, 可选): 排序字段 (`date`, `name`, `size`)
  - `order` (查询参数, 可选): 排序方向 (`asc`, `desc`)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 15,
        "filename": "example.jpg",
        "url": "/uploads/images/2024/05/example.jpg",
        "type": "image",
        "size": 245789,
        "dimensions": "1200x800",
        "uploaded_at": "2024-05-20T14:30:00Z",
        "used_in": [
          {
            "type": "article",
            "id": 5,
            "title": "使用此图片的文章标题"
          }
        ]
      }
    ],
    "pagination": {
      "total": 86,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

### 7.2 上传媒体文件

上传新的媒体文件。

- **URL**: `/api/admin/media`
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `files[]` (文件字段): 要上传的文件(最多10个)
  - `folder` (表单字段, 可选): 上传文件的目标文件夹

- **成功响应示例**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": [
    {
      "id": 16,
      "filename": "new-image.jpg",
      "url": "/uploads/images/2024/05/new-image.jpg",
      "type": "image",
      "size": 156320,
      "dimensions": "1024x768",
      "uploaded_at": "2024-05-22T10:15:30Z"
    }
  ]
}
```

### 7.3 删除媒体文件

删除指定的媒体文件。

- **URL**: `/api/admin/media/:id`
- **方法**: `DELETE`
- **参数**:
  - `id` (路径参数): 媒体文件ID

- **成功响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

### 7.4 获取未使用媒体文件

获取未在任何文章中使用的媒体文件列表。

- **URL**: `/api/admin/media/unused`
- **方法**: `GET`
- **参数**:
  - `page` (查询参数, 可选): 页码，默认为1
  - `limit` (查询参数, 可选): 每页条数，默认为20
  - `type` (查询参数, 可选): 文件类型筛选 (`image`, `document`, `other`)
  - `date_from` (查询参数, 可选): 按上传日期筛选起始日期 (YYYY-MM-DD)
  - `date_to` (查询参数, 可选): 按上传日期筛选截止日期 (YYYY-MM-DD)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 22,
        "filename": "unused-image.jpg",
        "url": "/uploads/images/2024/05/unused-image.jpg",
        "type": "image",
        "size": 185670,
        "dimensions": "1024x768",
        "uploaded_at": "2024-05-10T09:45:20Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### 7.5 批量清理未使用媒体文件

批量删除未在任何文章中使用的媒体文件。

- **URL**: `/api/admin/media/cleanup`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:
  - `older_than` (请求体, 可选): 清理指定日期之前的未使用文件，格式为YYYY-MM-DD
  - `file_ids` (请求体, 可选): 要清理的特定文件ID数组
  - `types` (请求体, 可选): 要清理的文件类型数组 [`image`, `document`, `other`]
  - `confirm` (请求体): 必须设为`true`以确认操作

- **请求体示例**:
```json
{
  "older_than": "2024-03-01",
  "types": ["image", "document"],
  "confirm": true
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "成功清理未使用文件",
  "data": {
    "deleted_count": 12,
    "freed_space": "5.8MB"
  }
}
```

## 8. 站点设置API

### 8.1 获取站点设置

获取当前的站点设置。

- **URL**: `/api/admin/settings`
- **方法**: `GET`
- **参数**:
  - `group` (查询参数, 可选): 设置分组 (`general`, `seo`, `social`, `comment`, `email`)

- **成功响应示例**:
```json
{
  "success": true,
  "data": {
    "general": {
      "site_title": "我的博客",
      "site_description": "个人技术博客",
      "logo_url": "/uploads/logo.png",
      "favicon_url": "/uploads/favicon.ico",
      "posts_per_page": 10,
      "timezone": "Asia/Shanghai",
      "date_format": "YYYY-MM-DD"
    },
    "seo": {
      "meta_title": "{title} - {site_title}",
      "meta_description": "{excerpt}",
      "use_categories_in_url": true,
      "google_analytics_id": "UA-XXXXX-Y"
    },
    "social": {
      "github": "https://github.com/username",
      "twitter": "https://twitter.com/username",
      "weibo": "https://weibo.com/username"
    }
  }
}
```

### 8.2 更新站点设置

更新站点设置。

- **URL**: `/api/admin/settings`
- **方法**: `PUT`
- **Content-Type**: `application/json`
- **参数**:
  - `settings` (请求体): 要更新的设置对象

- **请求体示例**:
```json
{
  "general": {
    "site_title": "我的技术博客",
    "site_description": "分享技术与生活的个人空间"
  },
  "social": {
    "github": "https://github.com/new-username"
  }
}
```

- **成功响应示例**:
```json
{
  "success": true,
  "message": "设置已更新"
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
2. 除登录接口外，所有接口都需要在请求头中包含认证令牌：`Authorization: Bearer {token}`
3. 文件上传API使用`multipart/form-data`格式
4. 图片上传大小限制为5MB
5. 图片格式支持: jpg, jpeg, png, gif, webp