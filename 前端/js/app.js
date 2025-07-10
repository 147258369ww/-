// 应用主入口文件
class App {
    constructor() {
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupRoutes();
                this.setupGlobalEventListeners();
            });
        } else {
            this.setupRoutes();
            this.setupGlobalEventListeners();
        }
    }

    setupRoutes() {
        // 注册路由
        router.register('/', () => {
            this.loadPage('home');
        });

        router.register('/articles.html', () => {
            this.loadPage('articles');
        });

        router.register('/article.html', (params, query) => {
            this.loadPage('article', { params, query });
        });

        router.register('/categories.html', (params, query) => {
            this.loadPage('categories', { params, query });
        });

        router.register('/search.html', (params, query) => {
            this.loadPage('search', { params, query });
        });

        router.register('/about.html', () => {
            this.loadPage('about');
        });
    }

    async loadPage(pageName, options = {}) {
        try {
            // 动态加载页面脚本
            await this.loadScript(`js/pages/${pageName}.js`);
            
            // 获取页面类
            const PageClass = window[this.getPageClassName(pageName)];
            
            if (PageClass) {
                const page = new PageClass();
                if (page.render) {
                    await page.render(options.params, options.query);
                }
            } else {
                throw new Error(`页面类 ${this.getPageClassName(pageName)} 未找到`);
            }
        } catch (error) {
            console.error(`加载页面 ${pageName} 失败:`, error);
            this.showErrorPage();
        }
    }

    getPageClassName(pageName) {
        // 将页面名转换为类名
        return pageName.charAt(0).toUpperCase() + pageName.slice(1) + 'Page';
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查脚本是否已加载
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupGlobalEventListeners() {
        // 全局错误处理
        window.addEventListener('error', (e) => {
            console.error('全局错误:', e.error);
        });

        // 全局未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise拒绝:', e.reason);
        });

        // 网络状态监听
        window.addEventListener('online', () => {
            api.showMessage('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            api.showMessage('网络连接已断开', 'error');
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 页面变为可见时，可以刷新数据
                this.onPageVisible();
            }
        });
    }

    onPageVisible() {
        // 页面变为可见时的处理逻辑
        // 可以在这里刷新数据或重新连接
    }

    showErrorPage() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <h1 class="text-6xl font-bold text-gray-300 mb-4">500</h1>
                        <h2 class="text-2xl font-semibold text-gray-700 mb-4">页面加载失败</h2>
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

    // 获取应用状态
    getState() {
        return {
            currentRoute: router.getCurrentRoute(),
            isOnline: navigator.onLine,
            timestamp: Date.now()
        };
    }
}

// 初始化应用
const app = new App();

// 导出应用实例
window.app = app;
