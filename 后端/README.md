# 个人博客后端 API

基于 Node.js + Express + MySQL 的个人博客后端服务。

## 🚀 快速开始

### 环境要求
- Node.js 16+
- MySQL 5.7+

### 安装依赖
```bash
npm install
```

### 配置环境变量
复制 `.env` 文件并配置数据库连接信息：
```
DB_HOST=43.138.3.83
DB_PORT=3306
DB_NAME=BK
DB_USER=root
DB_PASSWORD=200509Wjm.
PORT=3000
```

### 初始化数据库
```bash
node config/init-database.js
```

### 插入示例数据
```bash
node config/seed-data.js
```

### 启动服务器
```bash
npm start
# 或开发模式
npm run dev
```

服务器将在 http://localhost:3000 启动

## 📚 API 文档

### 基础信息
- 基础URL: `http://localhost:3000`
- 所有响应格式: JSON
- 成功响应格式: `{ "success": true, "data": {...} }`
- 错误响应格式: `{ "error": true, "message": "错误信息", "timestamp": "..." }`

### 健康检查
```
GET /health
```

### 文章 API

#### 获取文章列表
```
GET /api/articles
Query参数:
- page: 页码 (默认: 1)
- limit: 每页数量 (默认: 10)
- category_id: 分类ID (可选)
- sort: 排序字段 (默认: published_at)
- order: 排序方向 ASC/DESC (默认: DESC)
```

#### 获取单篇文章
```
GET /api/articles/:id
```

#### 创建文章
```
POST /api/articles
Content-Type: application/json
Body: {
  "title": "文章标题",
  "content": "文章内容",
  "summary": "文章摘要",
  "category_id": 1,
  "cover_image": "封面图片URL"
}
```

#### 更新文章
```
PUT /api/articles/:id
```

#### 删除文章
```
DELETE /api/articles/:id
```

#### 图片上传
```
POST /api/articles/upload-image
Content-Type: multipart/form-data
Body: image file
```

### 分类 API

#### 获取所有分类
```
GET /api/categories
```

#### 获取分类详情
```
GET /api/categories/:id
```

#### 获取分类下的文章
```
GET /api/categories/:id/articles
```

### 评论 API

#### 获取文章评论
```
GET /api/articles/:id/comments
```

#### 发表评论
```
POST /api/articles/:id/comments
Body: {
  "content": "评论内容",
  "author_name": "作者姓名",
  "author_email": "作者邮箱"
}
```

### 搜索 API

#### 搜索文章
```
GET /api/search?q=关键词
Query参数:
- q: 搜索关键词 (必需)
- page: 页码
- limit: 每页数量
- category_id: 分类ID
- sort: 排序方式 (relevance/published_at/view_count)
```

#### 获取搜索建议
```
GET /api/search/suggestions?q=关键词
```

#### 获取热门搜索词
```
GET /api/search/popular
```

### 订阅 API

#### 添加订阅
```
POST /api/subscribe
Body: {
  "email": "user@example.com"
}
```

#### 取消订阅
```
POST /api/subscribe/unsubscribe
Body: {
  "email": "user@example.com"
}
```

## 🗄️ 数据库结构

### articles 表
- id: 主键
- title: 文章标题
- content: 文章内容
- summary: 文章摘要
- cover_image: 封面图片
- published_at: 发布时间
- view_count: 浏览次数
- category_id: 分类ID
- created_at: 创建时间
- updated_at: 更新时间

### categories 表
- id: 主键
- name: 分类名称
- description: 分类描述
- created_at: 创建时间

### comments 表
- id: 主键
- content: 评论内容
- article_id: 文章ID
- author_name: 作者姓名
- author_email: 作者邮箱
- created_at: 创建时间

### subscribers 表
- id: 主键
- email: 邮箱地址
- status: 状态 (active/unsubscribed)
- created_at: 创建时间

## ✅ 已实现功能

- ✅ 文章 CRUD 操作
- ✅ 分类管理
- ✅ 图片上传
- ✅ 文章搜索 (部分功能)
- ✅ 邮件订阅
- ✅ 错误处理
- ✅ 数据验证
- ✅ 分页功能
- ✅ 静态文件服务

## ⚠️ 已知问题

1. **评论API**: 由于MySQL2预处理语句的问题，评论相关API暂时无法正常工作
2. **搜索API**: 中文搜索可能存在问题，英文搜索正常
3. **数据库连接警告**: MySQL2版本兼容性警告，不影响功能

## 🔧 测试

运行API测试：
```bash
node test-api.js
```

## 📁 项目结构

```
后端/
├── config/          # 配置文件
├── controllers/     # 控制器
├── routes/          # 路由
├── middleware/      # 中间件
├── models/          # 数据模型 (预留)
├── utils/           # 工具函数 (预留)
├── public/          # 静态文件
│   └── uploads/     # 上传文件
├── app.js           # 主应用文件
├── package.json     # 依赖配置
└── README.md        # 说明文档
```

## 🚀 部署建议

1. 使用 PM2 进行进程管理
2. 配置 Nginx 反向代理
3. 设置 HTTPS
4. 配置数据库备份
5. 设置日志轮转

## 📝 开发说明

本项目按照文档 `后端开发.md` 的要求开发，实现了博客系统的核心功能。主要API都已正常工作，可以支持前端应用的开发和使用。
