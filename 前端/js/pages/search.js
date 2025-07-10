// 搜索页面组件
class SearchPage {
    constructor() {
        this.query = '';
        this.results = [];
        this.pagination = {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
        };
        this.popularTerms = [];
    }

    async render(params, query = {}) {
        try {
            this.query = query.q || '';
            const page = parseInt(query.page) || 1;
            
            if (this.query) {
                // 显示加载状态
                this.renderLoading();
                
                // 获取搜索结果
                const response = await api.searchArticles(this.query, {
                    page: page,
                    limit: this.pagination.limit
                });
                
                if (response.success) {
                    this.results = response.data.results || [];
                    this.pagination = response.data.pagination || this.pagination;
                }
                
                // 渲染搜索结果
                this.renderResults();
            } else {
                // 获取热门搜索词
                const popularResponse = await api.getPopularSearchTerms(10);
                if (popularResponse.success) {
                    this.popularTerms = popularResponse.data || [];
                }
                
                // 渲染搜索页面
                this.renderSearchPage();
            }
        } catch (error) {
            console.error('搜索失败:', error);
            this.renderError();
        }
    }

    renderLoading() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-6 py-16">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">搜索结果: "${this.query}"</h1>
                <div class="flex justify-center py-12">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
    }

    renderResults() {
        const mainContent = document.getElementById('mainContent');

        let html = `
            <!-- 搜索结果头部 -->
            <section class="py-16 bg-gray-50">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8">
                        <div>
                            <h1 class="text-4xl font-bold text-gray-900 mb-4">
                                搜索结果: <span class="text-blue-600">"${this.query}"</span>
                            </h1>
                            <div class="flex items-center text-gray-600">
                                <i class="fas fa-search mr-2"></i>
                                <span>找到 <span class="font-semibold text-blue-600">${this.pagination.total}</span> 条结果</span>
                            </div>
                        </div>

                        <!-- 新搜索框 -->
                        <div class="mt-6 md:mt-0">
                            <form id="newSearchForm" class="flex">
                                <input
                                    type="text"
                                    id="newSearchInput"
                                    value="${this.query}"
                                    placeholder="重新搜索..."
                                    class="px-4 py-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                >
                                <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-r-xl hover:bg-blue-700 transition-colors">
                                    <i class="fas fa-search"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 搜索结果内容 -->
            <section class="py-16">
                <div class="max-w-7xl mx-auto px-6">
        `;

        if (this.results.length > 0) {
            html += `
                <div class="space-y-8 mb-16">
                    ${this.renderSearchItems()}
                </div>
                ${this.renderPagination()}
            `;
        } else {
            html += `
                <div class="text-center py-20">
                    <i class="fas fa-search text-6xl text-gray-300 mb-6"></i>
                    <h2 class="text-3xl font-bold text-gray-700 mb-4">未找到相关结果</h2>
                    <p class="text-xl text-gray-600 mb-8">尝试使用不同的关键词或浏览下面的热门搜索</p>
                    <div class="space-x-4">
                        <a href="/" class="btn-primary">返回首页</a>
                        <a href="/articles.html" class="btn-secondary">浏览文章</a>
                    </div>
                </div>

                <!-- 热门搜索词 -->
                <div class="mt-16">
                    <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">热门搜索</h3>
                    <div id="popularTermsContainer" class="bg-gray-50 rounded-2xl p-8"></div>
                </div>
            `;
        }

        html += `
                </div>
            </section>
        `;

        mainContent.innerHTML = html;

        // 设置新搜索表单事件
        const newSearchForm = document.getElementById('newSearchForm');
        const newSearchInput = document.getElementById('newSearchInput');

        if (newSearchForm && newSearchInput) {
            newSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = newSearchInput.value.trim();
                if (query && query !== this.query) {
                    router.navigate(`/search.html?q=${encodeURIComponent(query)}`);
                }
            });
        }

        // 如果没有结果，获取并显示热门搜索词
        if (this.results.length === 0) {
            this.loadPopularTerms();
        }
    }

    renderSearchItems() {
        return this.results.map(result => `
            <div class="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                <a href="/article.html?id=${result.id}" class="block">
                    <div class="flex flex-col lg:flex-row">
                        ${result.cover_image ? `
                            <div class="lg:w-1/3 aspect-video lg:aspect-square overflow-hidden">
                                <img
                                    src="${result.cover_image}"
                                    alt="${result.title}"
                                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                >
                            </div>
                        ` : ''}
                        <div class="flex-1 p-8">
                            <!-- 元信息 -->
                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                                <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">${result.category_name || '未分类'}</span>
                                <div class="flex items-center">
                                    <i class="far fa-calendar-alt mr-1"></i>
                                    <span>${helpers.formatDate(result.published_at, 'YYYY-MM-DD')}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="far fa-eye mr-1"></i>
                                    <span>${result.view_count || 0} 次阅读</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-chart-line mr-1"></i>
                                    <span>相关度 ${Math.round((result.relevance_score || 0.8) * 100)}%</span>
                                </div>
                            </div>

                            <!-- 标题 -->
                            <h2 class="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2">
                                ${this.highlightSearchTerm(result.title, this.query)}
                            </h2>

                            <!-- 摘要 -->
                            <p class="text-gray-600 mb-6 text-lg leading-relaxed line-clamp-3">
                                ${this.highlightSearchTerm(helpers.truncateText(result.summary || '', 200), this.query)}
                            </p>

                            <!-- 阅读按钮 -->
                            <div class="flex items-center justify-between">
                                <span class="text-blue-600 font-medium group-hover:underline flex items-center">
                                    阅读全文
                                    <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
    }

    renderSearchPage() {
        const mainContent = document.getElementById('mainContent');

        let html = `
            <!-- 搜索页面头部 -->
            <section class="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-10 right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
                    <div class="absolute bottom-10 left-10 w-40 h-40 bg-purple-100 rounded-full opacity-20"></div>
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-10"></div>
                </div>

                <div class="relative max-w-4xl mx-auto px-6 text-center">
                    <h1 class="text-5xl font-bold text-gray-900 mb-8">
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">搜索</span>
                        文章
                    </h1>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-12">输入关键词，找到你感兴趣的内容</p>

                    <!-- 搜索表单 -->
                    <form id="searchForm" class="max-w-3xl mx-auto">
                        <div class="relative">
                            <input
                                type="text"
                                id="searchPageInput"
                                placeholder="输入关键词搜索..."
                                class="w-full px-6 py-5 pl-14 bg-white border border-gray-200 rounded-2xl text-gray-900 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                            <i class="fas fa-search absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
                            <button type="submit" class="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all">
                                搜索
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <!-- 热门搜索词部分 -->
            <section class="py-16 bg-white">
                <div class="max-w-5xl mx-auto px-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                        <i class="fas fa-fire text-orange-500 mr-3"></i>
                        热门搜索
                    </h2>
                    <div id="popularTermsContainer" class="bg-gray-50 rounded-2xl p-8 border border-gray-100"></div>
                </div>
            </section>
        `;

        mainContent.innerHTML = html;

        // 加载热门搜索词
        this.loadPopularTerms();

        // 设置搜索表单事件
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchPageInput');

        if (searchForm && searchInput) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    router.navigate(`/search.html?q=${encodeURIComponent(query)}`);
                }
            });

            // 自动聚焦搜索框
            searchInput.focus();
        }
    }

    async loadPopularTerms() {
        try {
            if (this.popularTerms.length === 0) {
                const response = await api.getPopularSearchTerms(10);
                if (response.success) {
                    this.popularTerms = response.data || [];
                }
            }
            
            const container = document.getElementById('popularTermsContainer');
            if (container && this.popularTerms.length > 0) {
                search.renderPopularTerms(container, this.popularTerms);
            }
        } catch (error) {
            console.error('获取热门搜索词失败:', error);
        }
    }

    // 高亮搜索词
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;

        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>');
    }

    // 渲染分页
    renderPagination() {
        if (!this.pagination.pages || this.pagination.pages <= 1) {
            return '';
        }

        const { page, pages } = this.pagination;
        let html = '<div class="flex justify-center items-center space-x-2">';

        // 上一页
        if (page > 1) {
            html += `<button onclick="searchPage.goToPage(${page - 1})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
                <i class="fas fa-chevron-left mr-1"></i> 上一页
            </button>`;
        }

        // 页码
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        if (startPage > 1) {
            html += `<button onclick="searchPage.goToPage(1)" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">1</button>`;
            if (startPage > 2) {
                html += '<span class="px-2 text-gray-400">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button onclick="searchPage.goToPage(${i})" class="px-4 py-2 border rounded-xl transition-colors ${i === page ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'border-gray-200 hover:bg-gray-50'}">${i}</button>`;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                html += '<span class="px-2 text-gray-400">...</span>';
            }
            html += `<button onclick="searchPage.goToPage(${pages})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">${pages}</button>`;
        }

        // 下一页
        if (page < pages) {
            html += `<button onclick="searchPage.goToPage(${page + 1})" class="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
                下一页 <i class="fas fa-chevron-right ml-1"></i>
            </button>`;
        }

        html += '</div>';
        return html;
    }

    goToPage(page) {
        router.navigate(`/search.html?q=${encodeURIComponent(this.query)}&page=${page}`);
    }

    handlePageChange(page) {
        this.goToPage(page);
    }

    renderError() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-6 py-16">
                <div class="text-center py-12">
                    <h2 class="text-2xl font-semibold text-gray-700 mb-4">搜索失败</h2>
                    <p class="text-gray-600 mb-8">抱歉，搜索过程中出现了问题。</p>
                    <button onclick="location.reload()" class="btn-primary">重试</button>
                </div>
            </div>
        `;
    }
}

// 导出搜索页面组件
window.SearchPage = SearchPage;
