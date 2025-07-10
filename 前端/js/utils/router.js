// 简单的前端路由管理器
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        // 监听浏览器前进后退
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        // 监听页面加载
        window.addEventListener('DOMContentLoaded', () => {
            this.handleRoute();
        });

        // 拦截链接点击
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href) {
                const url = new URL(e.target.href);
                // 只处理同域名的链接
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    this.navigate(url.pathname + url.search);
                }
            }
        });
    }

    // 注册路由
    register(path, handler) {
        this.routes[path] = handler;
    }

    // 导航到指定路径
    navigate(path) {
        if (path !== window.location.pathname + window.location.search) {
            history.pushState(null, '', path);
        }
        this.handleRoute();
    }

    // 处理当前路由
    handleRoute() {
        const path = window.location.pathname;
        const search = window.location.search;
        const fullPath = path + search;

        // 更新导航栏活动状态
        this.updateNavigation(path);

        // 查找匹配的路由
        let handler = null;
        let params = {};

        // 精确匹配
        if (this.routes[path]) {
            handler = this.routes[path];
        } else {
            // 参数匹配
            for (const route in this.routes) {
                const match = this.matchRoute(route, path);
                if (match) {
                    handler = this.routes[route];
                    params = match.params;
                    break;
                }
            }
        }

        if (handler) {
            this.currentRoute = { path, params, search };
            handler(params, this.getQueryParams());
        } else {
            // 404处理
            this.handle404();
        }
    }

    // 路由匹配
    matchRoute(route, path) {
        const routeParts = route.split('/');
        const pathParts = path.split('/');

        if (routeParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (routePart.startsWith(':')) {
                // 参数匹配
                const paramName = routePart.slice(1);
                params[paramName] = pathPart;
            } else if (routePart !== pathPart) {
                // 不匹配
                return null;
            }
        }

        return { params };
    }

    // 获取查询参数
    getQueryParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    }

    // 更新导航栏活动状态
    updateNavigation(path) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = new URL(link.href).pathname;
            if (linkPath === path || (path === '/' && linkPath === '/')) {
                link.classList.add('active');
            }
        });
    }

    // 404处理
    handle404() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
                        <h2 class="text-2xl font-semibold text-gray-700 mb-4">页面未找到</h2>
                        <p class="text-gray-600 mb-8">抱歉，您访问的页面不存在。</p>
                        <a href="/" class="btn-primary">返回首页</a>
                    </div>
                </div>
            `;
        }
    }

    // 获取当前路由信息
    getCurrentRoute() {
        return this.currentRoute;
    }

    // 重定向
    redirect(path) {
        this.navigate(path);
    }
}

// 创建全局路由实例
const router = new Router();

// 导出路由实例
window.router = router;
