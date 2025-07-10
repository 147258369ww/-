// 文章列表页组件
class ArticlesPage {
    constructor() {
        this.articles = [];
        this.categories = [];
        this.pagination = {};
        this.currentPage = 1;
        this.currentCategory = null;
        this.currentSort = 'date';
        this.currentOrder = 'desc';
    }

    async render(params, query = {}) {
        // 从URL参数获取设置
        this.currentPage = parseInt(query.page) || 1;
        this.currentCategory = query.category || null;
        this.currentSort = query.sort || 'date';
        this.currentOrder = query.order || 'desc';

        try {
            await this.loadData();
            this.renderPage();
            this.setupEventListeners();
        } catch (error) {
            console.error('加载文章列表失败:', error);
            this.renderError();
        }
    }

    async loadData() {
        // 并行加载数据
        const [articlesResponse, categoriesResponse] = await Promise.all([
            this.loadArticles(),
            api.getCategories()
        ]);

        if (categoriesResponse.success) {
            this.categories = categoriesResponse.data || [];
        }
    }

    async loadArticles() {
        const params = {
            page: this.currentPage,
            limit: 12,
            sort: this.currentSort,
            order: this.currentOrder
        };

        if (this.currentCategory) {
            params.category = this.currentCategory;
        }

        const response = await api.getArticles(params);
        
        if (response.success) {
            this.articles = response.data.articles || [];
            this.pagination = response.data.pagination || {};
        }

        return response;
    }

    renderPage() {
        const mainContent = document.getElementById('mainContent');
        
        const html = `
            <!-- Page Header -->
            <section class="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
                    <div class="absolute bottom-10 left-10 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
                </div>

                <div class="relative max-w-7xl mx-auto px-6 text-center">
                    <h1 class="text-5xl font-bold text-gray-900 mb-6">
                        文章
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">列表</span>
                    </h1>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">探索我的思考与分享，发现有价值的内容</p>
                </div>
            </section>

            <!-- Filters and Content -->
            <section class="max-w-7xl mx-auto px-6 py-12">
                <div class="flex flex-col lg:flex-row gap-8">
                    <!-- Sidebar -->
                    <aside class="lg:w-1/4">
                        ${this.renderSidebar()}
                    </aside>

                    <!-- Main Content -->
                    <main class="lg:w-3/4">
                        <!-- Toolbar -->
                        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-list-ul text-blue-600 mr-2"></i>
                                    <span class="font-medium">共找到 <span class="text-blue-600 font-bold">${this.pagination.total || 0}</span> 篇文章</span>
                                </div>
                                <div class="flex items-center gap-4">
                                    <label class="text-sm font-medium text-gray-700 flex items-center">
                                        <i class="fas fa-sort text-gray-400 mr-2"></i>
                                        排序方式：
                                    </label>
                                    <select id="sortSelect" class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                        <option value="date-desc" ${this.currentSort === 'date' && this.currentOrder === 'desc' ? 'selected' : ''}>最新发布</option>
                                        <option value="date-asc" ${this.currentSort === 'date' && this.currentOrder === 'asc' ? 'selected' : ''}>最早发布</option>
                                        <option value="views-desc" ${this.currentSort === 'views' && this.currentOrder === 'desc' ? 'selected' : ''}>最多阅读</option>
                                        <option value="views-asc" ${this.currentSort === 'views' && this.currentOrder === 'asc' ? 'selected' : ''}>最少阅读</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Articles Grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                            ${this.renderArticles()}
                        </div>

                        <!-- Pagination -->
                        ${this.renderPagination()}
                    </main>
                </div>
            </section>
        `;

        mainContent.innerHTML = html;
    }

    renderSidebar() {
        return `
            <div class="space-y-8">
                <!-- Categories -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <i class="fas fa-folder-open text-blue-600 mr-3"></i>
                        文章分类
                    </h3>
                    <ul class="space-y-3">
                        <li>
                            <a href="/articles.html"
                               class="group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 ${!this.currentCategory ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}">
                                <span class="font-medium">全部文章</span>
                                <span class="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full ${!this.currentCategory ? 'bg-blue-100 text-blue-600' : ''}">${this.getTotalArticleCount()}</span>
                            </a>
                        </li>
                        ${this.categories.map(category => `
                            <li>
                                <a href="/articles.html?category=${category.id}"
                                   class="group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 ${this.currentCategory == category.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}">
                                    <span class="font-medium">${category.name}</span>
                                    <span class="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full ${this.currentCategory == category.id ? 'bg-blue-100 text-blue-600' : ''}">${category.article_count || 0}</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Recent Articles -->
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <i class="fas fa-clock text-green-600 mr-3"></i>
                        最新文章
                    </h3>
                    <div id="recentArticles">
                        <!-- 最新文章将通过JavaScript加载 -->
                    </div>
                </div>
            </div>
        `;
    }

    renderArticles() {
        if (!this.articles.length) {
            return `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-file-alt text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-600 mb-2">暂无文章</h3>
                    <p class="text-gray-500">该分类下还没有文章</p>
                </div>
            `;
        }

        return this.articles.map(article => `
            <article class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-100" onclick="router.navigate('/article.html?id=${article.id}')">
                <div class="aspect-video overflow-hidden">
                    <img
                        src="${article.cover_image || '/images/default-cover.jpg'}"
                        alt="${article.title}"
                        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    >
                </div>
                <div class="p-6">
                    <div class="flex items-center text-sm text-gray-500 mb-3">
                        <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">${article.category_name || '未分类'}</span>
                        <span class="mx-2">•</span>
                        <span>${helpers.formatDate(article.published_at, 'YYYY-MM-DD')}</span>
                    </div>

                    <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">${article.title}</h3>

                    <p class="text-gray-600 mb-4 text-sm line-clamp-3">${helpers.truncateText(article.summary || '', 120)}</p>

                    <div class="flex items-center justify-between">
                        <span class="text-blue-600 font-medium group-hover:underline">阅读全文</span>
                        <span class="text-sm text-gray-500 flex items-center">
                            <i class="far fa-eye mr-1"></i> ${article.view_count || 0}
                        </span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    renderPagination() {
        if (!this.pagination.pages || this.pagination.pages <= 1) {
            return '';
        }

        const { page, pages } = this.pagination;
        let html = '<div class="flex justify-center items-center space-x-2 mt-12">';

        // 上一页
        if (page > 1) {
            html += `<button onclick="articlesPage.goToPage(${page - 1})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
                <i class="fas fa-chevron-left mr-1"></i> 上一页
            </button>`;
        }

        // 页码
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        if (startPage > 1) {
            html += `<button onclick="articlesPage.goToPage(1)" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">1</button>`;
            if (startPage > 2) {
                html += '<span class="px-2 text-gray-400">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button onclick="articlesPage.goToPage(${i})" class="px-4 py-2 border rounded-xl transition-colors ${i === page ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-200 hover:bg-gray-50'}">${i}</button>`;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                html += '<span class="px-2 text-gray-400">...</span>';
            }
            html += `<button onclick="articlesPage.goToPage(${pages})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">${pages}</button>`;
        }

        // 下一页
        if (page < pages) {
            html += `<button onclick="articlesPage.goToPage(${page + 1})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
                下一页 <i class="fas fa-chevron-right ml-1"></i>
            </button>`;
        }

        html += '</div>';
        return html;
    }

    setupEventListeners() {
        // 排序选择
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sort, order] = e.target.value.split('-');
                this.changeSort(sort, order);
            });
        }

        // 加载最新文章
        this.loadRecentArticles();

        // 懒加载图片
        helpers.lazyLoadImages();
    }

    async loadRecentArticles() {
        try {
            const response = await api.getArticles({ limit: 5, sort: 'date', order: 'desc' });
            if (response.success && response.data.articles) {
                this.renderRecentArticles(response.data.articles);
            }
        } catch (error) {
            console.error('加载最新文章失败:', error);
        }
    }

    renderRecentArticles(articles) {
        const container = document.getElementById('recentArticles');
        if (!container) return;

        const html = articles.map(article => `
            <div class="flex items-start space-x-4 mb-6 last:mb-0 group">
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

    getTotalArticleCount() {
        return this.categories.reduce((total, category) => total + (category.article_count || 0), 0);
    }

    goToPage(page) {
        const params = new URLSearchParams();
        params.set('page', page);
        
        if (this.currentCategory) {
            params.set('category', this.currentCategory);
        }
        if (this.currentSort !== 'date') {
            params.set('sort', this.currentSort);
        }
        if (this.currentOrder !== 'desc') {
            params.set('order', this.currentOrder);
        }

        router.navigate(`/articles.html?${params.toString()}`);
    }

    changeSort(sort, order) {
        const params = new URLSearchParams();
        params.set('page', 1); // 重置到第一页
        
        if (this.currentCategory) {
            params.set('category', this.currentCategory);
        }
        if (sort !== 'date') {
            params.set('sort', sort);
        }
        if (order !== 'desc') {
            params.set('order', order);
        }

        router.navigate(`/articles.html?${params.toString()}`);
    }

    renderError() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-gray-700 mb-4">加载失败</h2>
                    <p class="text-gray-600 mb-8">抱歉，文章列表加载时出现了问题。</p>
                    <button onclick="location.reload()" class="btn-primary">重新加载</button>
                </div>
            </div>
        `;
    }
}

// 导出文章列表页组件
window.ArticlesPage = ArticlesPage;
window.articlesPage = new ArticlesPage();
