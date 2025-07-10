// 文章详情页组件
class ArticlePage {
    constructor() {
        this.article = null;
        this.relatedArticles = [];
        this.comments = [];
        this.articleId = null;
    }

    async render(params, query = {}) {
        this.articleId = query.id;
        
        if (!this.articleId) {
            this.renderError('文章ID不能为空');
            return;
        }

        try {
            await this.loadArticle();
            this.renderPage();
            this.setupEventListeners();
            
            // 并行加载相关数据
            Promise.all([
                this.loadRelatedArticles(),
                this.loadComments()
            ]).then(() => {
                this.updateRelatedArticles();
                this.updateComments();
            });
        } catch (error) {
            console.error('加载文章详情失败:', error);
            this.renderError('加载文章失败，请稍后重试');
        }
    }

    async loadArticle() {
        const response = await api.getArticle(this.articleId);
        
        if (response.success) {
            this.article = response.data;
            document.title = `${this.article.title} - 个人博客`;
        } else {
            throw new Error('文章加载失败');
        }
    }

    async loadRelatedArticles() {
        if (!this.article) return;

        try {
            const response = await api.getArticles({
                limit: 3,
                category: this.article.category_id,
                exclude: this.article.id
            });
            
            if (response.success) {
                this.relatedArticles = response.data.articles || [];
            }
        } catch (error) {
            console.error('加载相关文章失败:', error);
        }
    }

    async loadComments() {
        if (!this.article) return;

        try {
            const response = await api.getComments(this.article.id);
            
            if (response.success) {
                this.comments = response.data.comments || [];
            }
        } catch (error) {
            console.error('加载评论失败:', error);
        }
    }

    renderPage() {
        if (!this.article) return;

        const mainContent = document.getElementById('mainContent');
        
        const html = `
            <!-- Article Header -->
            <header class="relative py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
                    <div class="absolute bottom-10 left-10 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
                </div>

                <div class="relative max-w-4xl mx-auto px-6">
                    <!-- 面包屑导航 -->
                    <nav class="mb-8">
                        <div class="flex items-center text-sm text-gray-600">
                            <a href="/" class="hover:text-blue-600 transition-colors">首页</a>
                            <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
                            <a href="/articles.html" class="hover:text-blue-600 transition-colors">文章</a>
                            <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
                            <span class="text-gray-900">${this.article.title}</span>
                        </div>
                    </nav>

                    <!-- 分类标签 -->
                    <div class="mb-6">
                        <a href="/categories.html?id=${this.article.category_id}"
                           class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
                            <i class="fas fa-tag mr-2"></i>
                            ${this.article.category_name || '未分类'}
                        </a>
                    </div>

                    <!-- 文章标题 -->
                    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">${this.article.title}</h1>

                    <!-- 文章摘要 -->
                    ${this.article.summary ? `
                        <p class="text-xl text-gray-600 mb-8 leading-relaxed">${this.article.summary}</p>
                    ` : ''}

                    <!-- 文章元信息 -->
                    <div class="flex flex-wrap items-center gap-6 text-gray-600">
                        <div class="flex items-center">
                            <i class="far fa-calendar-alt mr-2 text-blue-600"></i>
                            <span>${helpers.formatDate(this.article.published_at, 'YYYY-MM-DD')}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="far fa-eye mr-2 text-green-600"></i>
                            <span>${this.article.view_count || 0} 次阅读</span>
                        </div>
                        <div class="flex items-center">
                            <i class="far fa-clock mr-2 text-purple-600"></i>
                            <span>约 ${this.estimateReadingTime(this.article.content)} 分钟阅读</span>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Article Content -->
            <section class="py-16">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="flex flex-col lg:flex-row gap-12">
                        <!-- Main Content -->
                        <article class="lg:w-3/4">
                            <!-- Cover Image -->
                            ${this.article.cover_image ? `
                                <div class="mb-12 rounded-2xl overflow-hidden shadow-lg">
                                    <img
                                        src="${this.article.cover_image}"
                                        alt="${this.article.title}"
                                        class="w-full h-auto"
                                    >
                                </div>
                            ` : ''}

                            <!-- Article Body -->
                            <div class="prose prose-lg max-w-none article-content">
                                ${this.article.content || ''}
                            </div>

                            <!-- Tags -->
                            ${this.renderTags()}

                            <!-- Comments Section -->
                            <div class="mt-20" id="commentsSection">
                                <h3 class="text-3xl font-bold text-gray-900 mb-8 flex items-center">
                                    <i class="fas fa-comments text-blue-600 mr-3"></i>
                                    评论讨论
                                </h3>

                                <!-- Comment Form -->
                                <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl mb-12 border border-gray-100">
                                    <h4 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <i class="fas fa-edit text-green-600 mr-3"></i>
                                        发表评论
                                    </h4>
                                    <form id="commentForm" class="space-y-6">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label for="commentName" class="block text-sm font-medium text-gray-700 mb-2">姓名 *</label>
                                                <input
                                                    type="text"
                                                    id="commentName"
                                                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                    placeholder="请输入您的姓名"
                                                    required
                                                >
                                            </div>
                                            <div>
                                                <label for="commentEmail" class="block text-sm font-medium text-gray-700 mb-2">邮箱 *</label>
                                                <input
                                                    type="email"
                                                    id="commentEmail"
                                                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                    placeholder="请输入您的邮箱"
                                                    required
                                                >
                                            </div>
                                        </div>
                                        <div>
                                            <label for="commentContent" class="block text-sm font-medium text-gray-700 mb-2">评论内容 *</label>
                                            <textarea
                                                id="commentContent"
                                                rows="5"
                                                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                placeholder="分享您的想法..."
                                                required
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <i class="fas fa-paper-plane mr-2"></i>
                                            提交评论
                                        </button>
                                    </form>
                                </div>

                                <!-- Comments List -->
                                <div id="commentsList">
                                    <div class="text-center py-12 text-gray-500">
                                        <i class="fas fa-spinner fa-spin mr-2"></i> 加载评论中...
                                    </div>
                                </div>
                            </div>
                        </article>

                        <!-- Sidebar -->
                        <aside class="lg:w-1/4">
                            <!-- Table of Contents -->
                            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 sticky top-24">
                                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <i class="fas fa-list-ul text-blue-600 mr-3"></i>
                                    目录
                                </h3>
                                <div id="tableOfContents">
                                    <!-- 目录将通过JavaScript生成 -->
                                </div>
                            </div>

                            <!-- Related Articles -->
                            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <i class="fas fa-newspaper text-green-600 mr-3"></i>
                                    相关文章
                                </h3>
                                <div id="relatedArticles">
                                    <div class="text-center py-8 text-gray-500">
                                        <i class="fas fa-spinner fa-spin mr-2"></i> 加载中...
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            <!-- Newsletter Section -->
            <section class="py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="max-w-3xl mx-auto text-center">
                        <h2 class="text-4xl font-bold mb-6">喜欢这篇文章？</h2>
                        <p class="text-xl opacity-90 mb-10">订阅我的博客，第一时间获取最新的文章和资源更新通知</p>

                        <form class="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" id="subscribeForm">
                            <div class="flex-1 relative">
                                <i class="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="email"
                                    id="subscribeEmail"
                                    placeholder="请输入您的邮箱地址"
                                    class="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    required
                                >
                            </div>
                            <button
                                type="submit"
                                class="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl font-medium text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                            >
                                立即订阅
                            </button>
                        </form>

                        <p class="mt-6 text-sm opacity-80">
                            我们尊重您的隐私，您可以随时取消订阅
                        </p>
                    </div>
                </div>
            </section>
        `;

        mainContent.innerHTML = html;

        // 生成目录
        this.generateTableOfContents();
    }

    renderTags() {
        // 模拟一些标签（实际项目中应该从API获取）
        const tags = this.article.tags || ['技术', '前端开发', 'JavaScript', 'Web开发'];

        if (!tags.length) {
            return '';
        }

        return `
            <div class="mt-12 pt-8 border-t border-gray-200">
                <div class="flex items-center mb-4">
                    <i class="fas fa-tags text-blue-600 mr-2"></i>
                    <h4 class="text-lg font-semibold text-gray-900">相关标签</h4>
                </div>
                <div class="flex flex-wrap gap-3">
                    ${tags.map(tag => `
                        <a href="/search.html?q=${encodeURIComponent(tag)}"
                           class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm font-medium hover:from-blue-100 hover:to-purple-100 transition-all duration-200 transform hover:scale-105">
                            <i class="fas fa-hashtag mr-1 text-xs"></i>
                            ${tag}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateRelatedArticles() {
        const container = document.getElementById('relatedArticles');
        if (!container) return;

        if (!this.relatedArticles.length) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-newspaper text-4xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500">暂无相关文章</p>
                </div>
            `;
            return;
        }

        const html = this.relatedArticles.map(article => `
            <div class="group flex items-start space-x-4 mb-6 last:mb-0 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                    <img
                        src="${article.cover_image || '/images/default-cover.jpg'}"
                        alt="${article.title}"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    >
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                        <a href="/article.html?id=${article.id}">${article.title}</a>
                    </h4>
                    <div class="flex items-center text-xs text-gray-500">
                        <i class="far fa-calendar-alt mr-1"></i>
                        <span>${helpers.formatDate(article.published_at)}</span>
                        <span class="mx-2">•</span>
                        <i class="far fa-eye mr-1"></i>
                        <span>${article.view_count || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateComments() {
        const container = document.getElementById('commentsList');
        if (!container) return;

        if (!this.comments.length) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <i class="fas fa-comments text-5xl text-gray-300 mb-4"></i>
                    <h4 class="text-xl font-semibold text-gray-600 mb-2">暂无评论</h4>
                    <p class="text-gray-500">来发表第一条评论，开启讨论吧！</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-900 flex items-center">
                    <i class="fas fa-comment-dots text-blue-600 mr-2"></i>
                    共 ${this.comments.length} 条评论
                </h4>
            </div>
            <div class="space-y-6">
                ${this.comments.map(comment => `
                    <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex items-start space-x-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                                ${comment.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center mb-2">
                                    <h4 class="text-gray-900 font-semibold mr-3">${comment.author_name}</h4>
                                    <div class="flex items-center text-sm text-gray-500">
                                        <i class="far fa-clock mr-1"></i>
                                        <span>${helpers.formatDate(comment.created_at, 'YYYY-MM-DD HH:mm')}</span>
                                    </div>
                                </div>
                                <div class="text-gray-700 leading-relaxed">
                                    ${comment.content.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = html;
    }

    generateTableOfContents() {
        const container = document.getElementById('tableOfContents');
        if (!container) return;

        const articleContent = document.querySelector('.article-content');
        if (!articleContent) return;

        const headings = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (!headings.length) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-list-ul text-3xl text-gray-300 mb-3"></i>
                    <p class="text-gray-500 text-sm">无目录结构</p>
                </div>
            `;
            return;
        }

        // 为每个标题添加ID
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }
        });

        // 生成目录HTML
        const tocHtml = Array.from(headings).map((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const indent = Math.max(0, (level - 1) * 16); // 根据标题级别设置缩进
            const isActive = index === 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50';

            return `
                <div class="mb-1" style="padding-left: ${indent}px">
                    <a
                        href="#${heading.id}"
                        class="toc-link ${isActive} text-sm block py-2 px-3 rounded-lg transition-all duration-200"
                        onclick="articlePage.scrollToHeading('${heading.id}')"
                        data-heading-id="${heading.id}"
                    >
                        <span class="flex items-center">
                            <span class="w-1 h-1 bg-current rounded-full mr-2 opacity-60"></span>
                            ${heading.textContent}
                        </span>
                    </a>
                </div>
            `;
        }).join('');

        container.innerHTML = tocHtml;

        // 添加滚动监听，高亮当前章节
        this.setupTocScrollSpy();
    }

    scrollToHeading(id) {
        const heading = document.getElementById(id);
        if (heading) {
            const offset = 80; // 导航栏高度 + 一些额外空间
            const elementPosition = heading.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
        }
    }

    // 设置目录滚动监听
    setupTocScrollSpy() {
        const headings = document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6');
        const tocLinks = document.querySelectorAll('.toc-link');

        if (!headings.length || !tocLinks.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const tocLink = document.querySelector(`[data-heading-id="${id}"]`);

                if (entry.isIntersecting) {
                    // 移除所有活动状态
                    tocLinks.forEach(link => {
                        link.classList.remove('text-blue-600', 'bg-blue-50');
                        link.classList.add('text-gray-600');
                    });

                    // 添加当前活动状态
                    if (tocLink) {
                        tocLink.classList.remove('text-gray-600');
                        tocLink.classList.add('text-blue-600', 'bg-blue-50');
                    }
                }
            });
        }, {
            rootMargin: '-80px 0px -80% 0px',
            threshold: 0.1
        });

        headings.forEach(heading => {
            observer.observe(heading);
        });
    }

    // 估算阅读时间（基于中文阅读速度）
    estimateReadingTime(content) {
        if (!content) return 1;

        // 移除HTML标签
        const textContent = content.replace(/<[^>]*>/g, '');
        // 中文字符数
        const chineseChars = (textContent.match(/[\u4e00-\u9fa5]/g) || []).length;
        // 英文单词数
        const englishWords = (textContent.match(/[a-zA-Z]+/g) || []).length;

        // 中文阅读速度约300字/分钟，英文约200词/分钟
        const readingTime = Math.ceil((chineseChars / 300) + (englishWords / 200));

        return Math.max(1, readingTime);
    }

    setupEventListeners() {
        // 评论表单提交
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCommentSubmit();
            });
        }

        // 订阅表单
        const subscribeForm = document.getElementById('subscribeForm');
        if (subscribeForm) {
            subscribeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSubscribe();
            });
        }

        // 懒加载图片
        helpers.lazyLoadImages();
    }

    async handleCommentSubmit() {
        const nameInput = document.getElementById('commentName');
        const emailInput = document.getElementById('commentEmail');
        const contentInput = document.getElementById('commentContent');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const content = contentInput.value.trim();

        if (!name || !email || !content) {
            api.showMessage('请填写所有必填字段', 'error');
            return;
        }

        if (!helpers.validateEmail(email)) {
            api.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        try {
            const commentData = {
                author_name: name,
                author_email: email,
                content: content
            };

            await api.submitComment(this.articleId, commentData);
            
            // 清空表单
            nameInput.value = '';
            emailInput.value = '';
            contentInput.value = '';

            // 重新加载评论
            await this.loadComments();
            this.updateComments();
        } catch (error) {
            console.error('提交评论失败:', error);
        }
    }

    async handleSubscribe() {
        const emailInput = document.getElementById('subscribeEmail');
        const email = emailInput.value.trim();

        if (!email) {
            api.showMessage('请输入邮箱地址', 'error');
            return;
        }

        if (!helpers.validateEmail(email)) {
            api.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        try {
            await api.subscribe(email);
            emailInput.value = '';
        } catch (error) {
            console.error('订阅失败:', error);
        }
    }

    renderError(message) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-gray-700 mb-4">文章加载失败</h2>
                    <p class="text-gray-600 mb-8">${message || '抱歉，文章加载时出现了问题。'}</p>
                    <div class="space-x-4">
                        <button onclick="location.reload()" class="btn-primary">重新加载</button>
                        <a href="/articles.html" class="btn-secondary">返回文章列表</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// 导出文章详情页组件
window.ArticlePage = ArticlePage;
window.articlePage = new ArticlePage();
