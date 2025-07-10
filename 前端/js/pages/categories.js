// 分类页面组件
class CategoriesPage {
    constructor() {
        this.categories = [];
        this.selectedCategory = null;
        this.categoryArticles = [];
        this.pagination = {};
        this.currentPage = 1;
    }

    async render(params, query = {}) {
        this.selectedCategory = query.id ? parseInt(query.id) : null;
        this.currentPage = parseInt(query.page) || 1;

        try {
            await this.loadCategories();
            
            if (this.selectedCategory) {
                await this.loadCategoryArticles();
                this.renderCategoryDetail();
            } else {
                this.renderCategoriesOverview();
            }
            
            this.setupEventListeners();
        } catch (error) {
            console.error('加载分类页面失败:', error);
            this.renderError();
        }
    }

    async loadCategories() {
        const response = await api.getCategories();
        
        if (response.success) {
            this.categories = response.data || [];
        }
    }

    async loadCategoryArticles() {
        if (!this.selectedCategory) return;

        const response = await api.getCategoryArticles(this.selectedCategory, {
            page: this.currentPage,
            limit: 12
        });
        
        if (response.success) {
            this.categoryArticles = response.data.articles || [];
            this.pagination = response.data.pagination || {};
        }
    }

    renderCategoriesOverview() {
        const mainContent = document.getElementById('mainContent');

        const html = `
            <!-- Page Header -->
            <section class="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
                    <div class="absolute bottom-10 left-10 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-10"></div>
                </div>

                <div class="relative max-w-7xl mx-auto px-6 text-center">
                    <h1 class="text-5xl font-bold text-gray-900 mb-6">
                        文章
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">分类</span>
                    </h1>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">探索不同主题的精彩内容，找到你感兴趣的领域</p>
                    <div class="flex items-center justify-center text-gray-500">
                        <i class="fas fa-folder-open mr-2"></i>
                        <span>共 ${this.categories.length} 个分类</span>
                    </div>
                </div>
            </section>

            <!-- Categories Grid -->
            <section class="max-w-7xl mx-auto px-6 py-20">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    ${this.renderCategoriesGrid()}
                </div>
            </section>
        `;

        mainContent.innerHTML = html;
    }

    renderCategoryDetail() {
        const category = this.categories.find(cat => cat.id === this.selectedCategory);
        if (!category) {
            this.renderError('分类不存在');
            return;
        }

        const mainContent = document.getElementById('mainContent');

        const html = `
            <!-- Category Header -->
            <section class="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
                    <div class="absolute bottom-10 left-10 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
                </div>

                <div class="relative max-w-7xl mx-auto px-6">
                    <!-- 面包屑导航 -->
                    <nav class="mb-8">
                        <div class="flex items-center text-sm text-gray-600">
                            <a href="/" class="hover:text-blue-600 transition-colors">首页</a>
                            <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
                            <a href="/categories.html" class="hover:text-blue-600 transition-colors">分类</a>
                            <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
                            <span class="text-gray-900">${category.name}</span>
                        </div>
                    </nav>

                    <!-- 分类信息 -->
                    <div class="flex flex-col md:flex-row items-start md:items-center mb-8">
                        <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-blue-600 text-3xl mr-6 mb-4 md:mb-0 flex-shrink-0">
                            <i class="fas ${this.getCategoryIcon(category.name)}"></i>
                        </div>
                        <div class="flex-1">
                            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">${category.name}</h1>
                            <p class="text-xl text-gray-600 mb-4">${category.description || '探索这个分类下的精彩内容'}</p>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-file-alt mr-2 text-blue-600"></i>
                                <span class="font-medium">共 ${category.article_count || 0} 篇文章</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Articles List -->
            <section class="max-w-7xl mx-auto px-6 py-20">
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">文章列表</h2>
                    <div class="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    ${this.renderCategoryArticles()}
                </div>

                <!-- Pagination -->
                ${this.renderPagination()}
            </section>
        `;

        mainContent.innerHTML = html;
    }

    renderCategoriesGrid() {
        if (!this.categories.length) {
            return `
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-folder-open text-6xl text-gray-300 mb-6"></i>
                    <h3 class="text-2xl font-semibold text-gray-600 mb-4">暂无分类</h3>
                    <p class="text-gray-500 text-lg">还没有创建任何分类，敬请期待</p>
                </div>
            `;
        }

        return this.categories.map(category => `
            <div class="group bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-100" onclick="router.navigate('/categories.html?id=${category.id}')">
                <!-- 图标 -->
                <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas ${this.getCategoryIcon(category.name)} text-3xl text-blue-600"></i>
                </div>

                <!-- 分类名称 -->
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">${category.name}</h3>

                <!-- 文章数量 -->
                <div class="flex items-center justify-center text-gray-600 mb-4">
                    <i class="fas fa-file-alt mr-2 text-sm"></i>
                    <span class="font-medium">${category.article_count || 0} 篇文章</span>
                </div>

                <!-- 描述 -->
                ${category.description ? `
                    <p class="text-gray-500 text-sm mb-4 line-clamp-2">${helpers.truncateText(category.description, 80)}</p>
                ` : ''}

                <!-- 悬停效果 -->
                <div class="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span class="text-blue-600 font-medium">探索更多 →</span>
                </div>
            </div>
        `).join('');
    }

    renderCategoryArticles() {
        if (!this.categoryArticles.length) {
            return `
                <div class="col-span-full text-center py-20">
                    <i class="fas fa-file-alt text-6xl text-gray-300 mb-6"></i>
                    <h3 class="text-2xl font-semibold text-gray-600 mb-4">暂无文章</h3>
                    <p class="text-gray-500 text-lg">该分类下还没有文章，敬请期待</p>
                    <div class="mt-8">
                        <a href="/articles.html" class="btn-primary">浏览其他文章</a>
                    </div>
                </div>
            `;
        }

        return this.categoryArticles.map(article => `
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
                        <i class="far fa-calendar-alt mr-1"></i>
                        <span>${helpers.formatDate(article.published_at, 'YYYY-MM-DD')}</span>
                        <span class="mx-2">•</span>
                        <i class="far fa-eye mr-1"></i>
                        <span>${article.view_count || 0} 次阅读</span>
                    </div>

                    <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">${article.title}</h3>

                    <p class="text-gray-600 mb-4 text-sm line-clamp-3">${helpers.truncateText(article.summary || '', 120)}</p>

                    <div class="flex items-center justify-between">
                        <span class="text-blue-600 font-medium group-hover:underline">阅读全文</span>
                        <i class="fas fa-arrow-right text-blue-600 transform group-hover:translate-x-1 transition-transform"></i>
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
        let html = '<div class="flex justify-center items-center space-x-2 mt-16">';

        // 上一页
        if (page > 1) {
            html += `<button onclick="categoriesPage.goToPage(${page - 1})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
                <i class="fas fa-chevron-left mr-1"></i> 上一页
            </button>`;
        }

        // 页码
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        if (startPage > 1) {
            html += `<button onclick="categoriesPage.goToPage(1)" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">1</button>`;
            if (startPage > 2) {
                html += '<span class="px-2 text-gray-400">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button onclick="categoriesPage.goToPage(${i})" class="px-4 py-2 border rounded-xl transition-colors ${i === page ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-200 hover:bg-gray-50'}">${i}</button>`;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                html += '<span class="px-2 text-gray-400">...</span>';
            }
            html += `<button onclick="categoriesPage.goToPage(${pages})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">${pages}</button>`;
        }

        // 下一页
        if (page < pages) {
            html += `<button onclick="categoriesPage.goToPage(${page + 1})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
                下一页 <i class="fas fa-chevron-right ml-1"></i>
            </button>`;
        }

        html += '</div>';
        return html;
    }

    getCategoryIcon(categoryName) {
        const iconMap = {
            '技术': 'fa-code',
            '设计': 'fa-paint-brush',
            '生活': 'fa-heart',
            '旅行': 'fa-plane',
            '摄影': 'fa-camera',
            '音乐': 'fa-music',
            '电影': 'fa-film',
            '读书': 'fa-book',
            '美食': 'fa-utensils',
            '运动': 'fa-running',
            '人工智能': 'fa-robot',
            '前端开发': 'fa-laptop-code',
            '后端开发': 'fa-server',
            '移动开发': 'fa-mobile-alt',
            '数据库': 'fa-database',
            '云计算': 'fa-cloud',
            '网络安全': 'fa-shield-alt',
            '产品设计': 'fa-drafting-compass',
            '用户体验': 'fa-users',
            '创业': 'fa-rocket',
            '投资理财': 'fa-chart-line'
        };
        
        return iconMap[categoryName] || 'fa-folder';
    }

    setupEventListeners() {
        // 懒加载图片
        helpers.lazyLoadImages();
    }

    goToPage(page) {
        if (!this.selectedCategory) return;

        const params = new URLSearchParams();
        params.set('id', this.selectedCategory);
        params.set('page', page);

        router.navigate(`/categories.html?${params.toString()}`);
    }

    renderError(message = '加载分类失败') {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-gray-700 mb-4">${message}</h2>
                    <p class="text-gray-600 mb-8">抱歉，页面加载时出现了问题。</p>
                    <div class="space-x-4">
                        <button onclick="location.reload()" class="btn-primary">重新加载</button>
                        <a href="/" class="btn-secondary">返回首页</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// 导出分类页面组件
window.CategoriesPage = CategoriesPage;
window.categoriesPage = new CategoriesPage();
