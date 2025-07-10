# 后台管理系统 API 测试示例

## 基础信息

- **服务地址**: http://localhost:3000 (或 3001)
- **默认管理员账户**: 
  - 用户名: `admin`
  - 密码: `admin123`

## 1. 管理员登录

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"admin","password":"admin123"}'

# curl (Linux/Mac)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**响应示例**:
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin",
    "name": "超级管理员",
    "email": "admin@blog.com"
  }
}
```

## 2. 获取管理员信息

```bash
# PowerShell (使用上面获取的token)
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/profile" -Headers @{"Authorization"="Bearer $token"}

# curl
curl -H "Authorization: Bearer your-jwt-token-here" \
  http://localhost:3001/api/admin/profile
```

## 3. 获取文章列表

```bash
# PowerShell
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/articles" -Headers @{"Authorization"="Bearer $token"}

# curl
curl -H "Authorization: Bearer your-jwt-token-here" \
  http://localhost:3001/api/admin/articles
```

## 4. 获取分类列表

```bash
# PowerShell
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/categories" -Headers @{"Authorization"="Bearer $token"}

# curl
curl -H "Authorization: Bearer your-jwt-token-here" \
  http://localhost:3001/api/admin/categories
```

## 5. 获取评论列表

```bash
# PowerShell
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/comments" -Headers @{"Authorization"="Bearer $token"}

# curl
curl -H "Authorization: Bearer your-jwt-token-here" \
  http://localhost:3001/api/admin/comments
```

## 6. 获取统计数据

```bash
# 网站概览
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/stats/overview" -Headers @{"Authorization"="Bearer $token"}

# 访问趋势
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/stats/trends" -Headers @{"Authorization"="Bearer $token"}

# 热门内容
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/stats/popular" -Headers @{"Authorization"="Bearer $token"}
```

## 7. 创建文章

```bash
# PowerShell
$token="your-jwt-token-here"
$body = @{
    title = "测试文章"
    content = "这是一篇测试文章的内容"
    summary = "测试文章摘要"
    category_id = 1
    status = "draft"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/admin/articles" -Method POST -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $body

# curl
curl -X POST http://localhost:3001/api/admin/articles \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章",
    "content": "这是一篇测试文章的内容",
    "summary": "测试文章摘要",
    "category_id": 1,
    "status": "draft"
  }'
```

## 8. 更新评论状态

```bash
# 批准评论
$token="your-jwt-token-here"
$body = @{ status = "approved" } | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/admin/comments/1/status" -Method PATCH -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} -Body $body

# curl
curl -X PATCH http://localhost:3001/api/admin/comments/1/status \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

## 9. 获取站点设置

```bash
# 获取所有设置
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/settings" -Headers @{"Authorization"="Bearer $token"}

# 获取特定分组设置
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/settings/site" -Headers @{"Authorization"="Bearer $token"}
```

## 10. 获取订阅者列表

```bash
# PowerShell
$token="your-jwt-token-here"
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/subscribe" -Headers @{"Authorization"="Bearer $token"}

# 获取订阅统计
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/subscribe/stats" -Headers @{"Authorization"="Bearer $token"}
```

## 常用查询参数

### 分页参数
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10-20)

### 筛选参数
- `status`: 状态筛选
- `category_id`: 分类筛选
- `search`: 搜索关键词

### 示例
```bash
# 获取第2页的已发布文章，每页5条
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/articles?page=2&limit=5&status=published" -Headers @{"Authorization"="Bearer $token"}

# 搜索包含"设计"的文章
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/articles?search=设计" -Headers @{"Authorization"="Bearer $token"}
```

## 错误处理

### 常见错误码
- `401`: 未授权 (token无效或过期)
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "error": "Unauthorized",
  "message": "无效的认证令牌"
}
```

## 注意事项

1. **Token过期**: JWT token默认24小时过期，需要重新登录获取新token
2. **权限验证**: 所有后台API都需要有效的JWT token
3. **参数验证**: 请求参数会进行严格验证，确保数据格式正确
4. **文件上传**: 媒体文件上传需要使用multipart/form-data格式
5. **批量操作**: 支持批量更新状态和批量删除操作

## 完整API列表

详细的API文档请参考各个路由文件：
- `routes/admin/auth.js` - 认证相关
- `routes/admin/articles.js` - 文章管理
- `routes/admin/categories.js` - 分类管理
- `routes/admin/comments.js` - 评论管理
- `routes/admin/media.js` - 媒体管理
- `routes/admin/settings.js` - 站点设置
- `routes/admin/stats.js` - 统计数据
- `routes/admin/subscribe.js` - 订阅管理
