// 首页组件
class HomePage {
    constructor() {
        this.featuredArticles = [];
        this.categories = [];
    }

    async render() {
        try {
            // 并行获取数据
            const [articlesResponse, categoriesResponse] = await Promise.all([
                api.getArticles({ limit: 6, sort: 'date', order: 'desc' }),
                api.getCategories()
            ]);

            if (articlesResponse.success) {
                this.featuredArticles = articlesResponse.data.articles || [];
            }

            if (categoriesResponse.success) {
                this.categories = categoriesResponse.data || [];
            }

            this.renderPage();
            this.setupEventListeners();
        } catch (error) {
            console.error('加载首页数据失败:', error);
            this.renderError();
        }
    }

    renderPage() {
        const mainContent = document.getElementById('mainContent');

        const html = `
            <!-- Hero Section -->
            <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <!-- 背景装饰 -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
                    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full opacity-20 animate-pulse" style="animation-delay: 1s;"></div>
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-10 animate-spin" style="animation-duration: 20s;"></div>
                </div>

                <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                        探索创意的
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">无限可能</span>
                    </h1>
                    <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                        在这里，我们分享设计灵感、技术创新和生活感悟，一起探索数字世界的无限可能
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a href="/articles.html" class="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                            开始阅读
                        </a>
                        <a href="/about.html" class="btn-secondary text-lg px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300">
                            了解更多
                        </a>
                    </div>
                </div>

                <!-- 滚动提示 -->
                <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div class="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                        <div class="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
                    </div>
                </div>
            </section>

            <!-- Categories Section -->
            <section class="py-20 bg-white">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-bold text-gray-900 mb-4">热门分类</h2>
                        <p class="text-xl text-gray-600 max-w-2xl mx-auto">探索不同领域的精彩内容，找到你感兴趣的话题</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" id="categoriesGrid">
                        ${this.renderCategories()}
                    </div>
                </div>
            </section>

            <!-- Featured Articles Section -->
            <section class="py-20 bg-gray-50">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-16">
                        <div>
                            <h2 class="text-4xl font-bold text-gray-900 mb-4">精选文章</h2>
                            <p class="text-xl text-gray-600">最新的思考与分享，值得你花时间阅读</p>
                        </div>
                        <a href="/articles.html" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-lg group mt-4 md:mt-0">
                            查看全部
                            <i class="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                        </a>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="articlesGrid">
                        ${this.renderFeaturedArticles()}
                    </div>
                </div>
            </section>

            <!-- Newsletter Section -->
            <section class="py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="max-w-3xl mx-auto text-center">
                        <h2 class="text-4xl font-bold mb-6">订阅更新</h2>
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
    }

    renderCategories() {
        if (!this.categories.length) {
            return `
                <div class="col-span-full text-center py-16">
                    <i class="fas fa-folder-open text-5xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">暂无分类</h3>
                    <p class="text-gray-500">分类正在整理中</p>
                </div>
            `;
        }

        return this.categories.slice(0, 4).map(category => `
            <div class="group bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer" onclick="router.navigate('/categories.html?id=${category.id}')">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <i class="fas ${this.getCategoryIcon(category.name)} text-2xl text-blue-600"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">${category.name}</h3>
                <p class="text-gray-600">${category.article_count || 0} 篇文章</p>
                <div class="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span class="text-blue-600 font-medium">探索更多 →</span>
                </div>
            </div>
        `).join('');
    }

    renderFeaturedArticles() {
        if (!this.featuredArticles.length) {
            return `
                <div class="col-span-full text-center py-16">
                    <i class="fas fa-newspaper text-5xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">暂无文章</h3>
                    <p class="text-gray-500">敬请期待精彩内容</p>
                </div>
            `;
        }

        return this.featuredArticles.map(article => `
            <article class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2" onclick="router.navigate('/article.html?id=${article.id}')">
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
                        <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">${article.category_name || '未分类'}</span>
                        <span class="mx-2">•</span>
                        <span>${helpers.formatDate(article.published_at, 'YYYY-MM-DD')}</span>
                    </div>

                    <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">${article.title}</h3>

                    <p class="text-gray-600 mb-4 text-sm line-clamp-3">${helpers.truncateText(article.summary || '', 120)}</p>

                    <div class="flex items-center justify-between">
                        <span class="text-blue-600 font-medium group-hover:underline">阅读全文</span>
                        <span class="text-sm text-gray-500">
                            <i class="far fa-eye mr-1"></i> ${article.view_count || 0}
                        </span>
                    </div>
                </div>
            </article>
        `).join('');
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
            '前端开发': 'fa-laptop-code'
        };
        
        return iconMap[categoryName] || 'fa-folder';
    }

    setupEventListeners() {
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

    renderError() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <h2 class="text-2xl font-semibold text-gray-700 mb-4">加载失败</h2>
                    <p class="text-gray-600 mb-8">抱歉，页面加载时出现了问题。</p>
                    <button onclick="location.reload()" class="btn-primary">重新加载</button>
                </div>
            </div>
        `;
    }
}

// 导出首页组件
window.HomePage = HomePage;
