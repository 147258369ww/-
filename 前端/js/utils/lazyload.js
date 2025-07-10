// 图片懒加载工具类
class LazyLoad {
    constructor(options = {}) {
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        };
        
        this.observer = null;
        this.images = new Set();
        this.init();
    }

    init() {
        // 检查浏览器是否支持 Intersection Observer
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.options
            );
        } else {
            // 降级处理：直接加载所有图片
            this.loadAllImages();
        }
    }

    // 处理图片进入视口
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
                this.images.delete(entry.target);
            }
        });
    }

    // 加载单个图片
    loadImage(img) {
        return new Promise((resolve, reject) => {
            const imageLoader = new Image();
            
            imageLoader.onload = () => {
                // 图片加载成功
                img.src = img.dataset.src;
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
                
                // 移除 data-src 属性
                delete img.dataset.src;
                
                resolve(img);
            };
            
            imageLoader.onerror = () => {
                // 图片加载失败，使用默认图片
                img.src = img.dataset.fallback || '/images/default-cover.jpg';
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-error');
                
                reject(new Error('Image load failed'));
            };
            
            // 开始加载图片
            imageLoader.src = img.dataset.src;
        });
    }

    // 观察图片元素
    observe(img) {
        if (!img || this.images.has(img)) return;
        
        // 添加懒加载样式
        img.classList.add('lazy-loading');
        
        // 设置占位符
        if (!img.src && !img.dataset.src) return;
        
        if (img.dataset.src && !img.src) {
            img.src = this.createPlaceholder(img);
        }
        
        this.images.add(img);
        
        if (this.observer) {
            this.observer.observe(img);
        } else {
            // 降级处理
            this.loadImage(img);
        }
    }

    // 创建占位符
    createPlaceholder(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布大小
        canvas.width = img.offsetWidth || 300;
        canvas.height = img.offsetHeight || 200;
        
        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f3f4f6');
        gradient.addColorStop(1, '#e5e7eb');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加加载图标
        ctx.fillStyle = '#9ca3af';
        ctx.font = '24px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📷', canvas.width / 2, canvas.height / 2);
        
        return canvas.toDataURL();
    }

    // 批量观察图片
    observeAll(selector = 'img[data-src]') {
        const images = document.querySelectorAll(selector);
        images.forEach(img => this.observe(img));
    }

    // 停止观察图片
    unobserve(img) {
        if (this.observer && this.images.has(img)) {
            this.observer.unobserve(img);
            this.images.delete(img);
        }
    }

    // 停止观察所有图片
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.images.clear();
    }

    // 降级处理：加载所有图片
    loadAllImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.loadImage(img);
        });
    }

    // 预加载关键图片
    preloadCritical(urls) {
        if (!Array.isArray(urls)) urls = [urls];
        
        return Promise.all(
            urls.map(url => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                });
            })
        );
    }

    // 获取图片加载统计
    getStats() {
        return {
            observing: this.images.size,
            loaded: document.querySelectorAll('img.lazy-loaded').length,
            error: document.querySelectorAll('img.lazy-error').length
        };
    }
}

// 创建全局懒加载实例
const lazyLoad = new LazyLoad({
    rootMargin: '100px', // 提前100px开始加载
    threshold: 0.1
});

// 页面加载完成后初始化懒加载
document.addEventListener('DOMContentLoaded', () => {
    lazyLoad.observeAll();
});

// 监听动态内容变化
const contentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // 检查新添加的图片
                const images = node.querySelectorAll ? node.querySelectorAll('img[data-src]') : [];
                images.forEach(img => lazyLoad.observe(img));
                
                // 检查节点本身是否是图片
                if (node.tagName === 'IMG' && node.dataset.src) {
                    lazyLoad.observe(node);
                }
            }
        });
    });
});

// 开始观察DOM变化
contentObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 导出懒加载实例
window.lazyLoad = lazyLoad;
