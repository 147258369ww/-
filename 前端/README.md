# 个人博客前端项目

这是一个基于原生 JavaScript、HTML5、CSS3 和 Tailwind CSS 构建的个人博客前端项目，采用苹果官网风格的简约设计。

## 项目特性

- 🎨 **苹果风格设计**: 简约、精致、现代的UI设计
- 📱 **响应式布局**: 完美适配桌面端、平板和移动端
- ⚡ **原生JavaScript**: 无框架依赖，轻量高效
- 🔍 **智能搜索**: 支持搜索建议和热门搜索词
- 📄 **分页功能**: 文章列表支持分页浏览
- 🏷️ **分类管理**: 文章分类展示和筛选
- 💌 **邮箱订阅**: 支持邮箱订阅功能
- 🖼️ **图片懒加载**: 优化页面加载性能
- 🎯 **SEO友好**: 良好的语义化HTML结构

## 技术栈

- **前端框架**: 原生 JavaScript (ES6+)
- **CSS框架**: Tailwind CSS
- **HTTP客户端**: Axios
- **字体**: Inter (Google Fonts)
- **图标**: Font Awesome
- **开发服务器**: Live Server

## 项目结构

```
前端/
├── index.html              # 主页面
├── articles.html           # 文章列表页
├── article.html           # 文章详情页
├── categories.html        # 分类页面
├── search.html           # 搜索结果页
├── about.html            # 关于页面
├── css/
│   └── style.css         # 主样式文件
├── js/
│   ├── utils/            # 工具函数
│   │   ├── api.js        # API调用工具
│   │   ├── router.js     # 路由管理
│   │   └── helpers.js    # 辅助函数
│   ├── components/       # 组件
│   │   ├── navbar.js     # 导航栏组件
│   │   └── search.js     # 搜索组件
│   ├── pages/           # 页面组件
│   │   ├── home.js      # 首页
│   │   ├── articles.js  # 文章列表页
│   │   ├── article.js   # 文章详情页
│   │   ├── categories.js # 分类页
│   │   ├── search.js    # 搜索页
│   │   └── about.js     # 关于页
│   └── app.js           # 应用入口
├── images/              # 图片资源
├── package.json         # 项目配置
└── README.md           # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
cd 前端
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

项目将在 `http://localhost:8080` 启动。

### 3. 构建项目

```bash
npm run build
```

## API 接口

项目与后端 API 进行交互，主要接口包括：

- **文章接口**: 获取文章列表、文章详情
- **分类接口**: 获取分类列表、分类文章
- **搜索接口**: 文章搜索、搜索建议、热门搜索词
- **订阅接口**: 邮箱订阅、取消订阅

详细的 API 文档请参考 `前端API接口.md`。

## 页面功能

### 首页 (index.html)
- Hero 区域展示
- 热门分类展示
- 精选文章列表
- 邮箱订阅表单

### 文章列表页 (articles.html)
- 文章列表展示
- 分页功能
- 排序选项（最新、最热门）
- 分类筛选

### 文章详情页 (article.html)
- 文章内容展示
- 文章目录导航
- 相关文章推荐
- 评论功能

### 分类页面 (categories.html)
- 所有分类展示
- 分类文章列表
- 分类统计信息

### 搜索页面 (search.html)
- 搜索结果展示
- 搜索建议
- 热门搜索词
- 搜索结果分页

### 关于页面 (about.html)
- 个人介绍
- 联系方式
- 博客介绍

## 设计特色

### 苹果风格设计元素
- **大量留白**: 营造干净整洁的视觉效果
- **简约排版**: 强调内容的可读性
- **平滑动画**: 优雅的过渡效果
- **细微阴影**: 提升视觉层次
- **无衬线字体**: 确保各设备清晰度
- **中性色调**: 搭配少量强调色

### 交互效果
- 卡片悬停上浮效果
- 导航栏滚动背景变化
- 按钮点击反馈
- 平滑滚动效果
- 加载动画

## 性能优化

- **图片懒加载**: 提升页面加载速度
- **防抖节流**: 优化搜索和滚动性能
- **代码分割**: 按需加载页面脚本
- **缓存策略**: 合理使用浏览器缓存
- **压缩优化**: CSS和JS文件压缩

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
- 移动端浏览器

## 开发规范

### 代码风格
- 使用 ES6+ 语法
- 采用模块化开发
- 遵循语义化HTML
- 使用 BEM CSS 命名规范

### 文件命名
- HTML文件：小写字母，连字符分隔
- CSS类名：小写字母，连字符分隔
- JavaScript文件：驼峰命名
- 图片文件：小写字母，连字符分隔

## 部署说明

### 静态部署
项目可以部署到任何静态文件服务器：
- GitHub Pages
- Netlify
- Vercel
- 阿里云OSS
- 腾讯云COS

### 配置说明
1. 修改 `js/utils/api.js` 中的 `API_BASE_URL` 为实际的后端API地址
2. 确保后端API支持CORS跨域请求
3. 配置适当的缓存策略

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 邮箱：contact@example.com
- 微信：myblog2024
- GitHub：[项目地址](https://github.com/yourusername/personal-blog-frontend)

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 实现基础页面和功能
- 完成响应式设计
- 集成API接口
