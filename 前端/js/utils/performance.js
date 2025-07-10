// 性能监控工具类
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = {};
        this.init();
    }

    init() {
        // 监控页面加载性能
        this.monitorPageLoad();
        
        // 监控资源加载
        this.monitorResourceLoad();
        
        // 监控用户交互
        this.monitorUserInteraction();
        
        // 监控内存使用
        this.monitorMemoryUsage();
    }

    // 监控页面加载性能
    monitorPageLoad() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    
                    this.metrics.pageLoad = {
                        // DNS查询时间
                        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                        // TCP连接时间
                        tcpConnect: navigation.connectEnd - navigation.connectStart,
                        // 请求响应时间
                        request: navigation.responseEnd - navigation.requestStart,
                        // DOM解析时间
                        domParse: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        // 页面完全加载时间
                        pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
                        // 总时间
                        total: navigation.loadEventEnd - navigation.navigationStart
                    };
                    
                    // 首次绘制时间
                    const fp = paint.find(entry => entry.name === 'first-paint');
                    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
                    
                    if (fp) this.metrics.pageLoad.firstPaint = fp.startTime;
                    if (fcp) this.metrics.pageLoad.firstContentfulPaint = fcp.startTime;
                    
                    this.reportMetrics('pageLoad', this.metrics.pageLoad);
                }, 0);
            });
        }
    }

    // 监控资源加载
    monitorResourceLoad() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        const resourceType = this.getResourceType(entry.name);
                        
                        if (!this.metrics.resources) {
                            this.metrics.resources = {};
                        }
                        
                        if (!this.metrics.resources[resourceType]) {
                            this.metrics.resources[resourceType] = {
                                count: 0,
                                totalSize: 0,
                                totalTime: 0,
                                errors: 0
                            };
                        }
                        
                        const resource = this.metrics.resources[resourceType];
                        resource.count++;
                        resource.totalSize += entry.transferSize || 0;
                        resource.totalTime += entry.duration;
                        
                        // 检查是否加载失败
                        if (entry.responseEnd === 0) {
                            resource.errors++;
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
            this.observers.resource = observer;
        }
    }

    // 监控用户交互
    monitorUserInteraction() {
        const interactions = ['click', 'scroll', 'keydown', 'touchstart'];
        
        interactions.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                if (!this.metrics.interactions) {
                    this.metrics.interactions = {};
                }
                
                if (!this.metrics.interactions[eventType]) {
                    this.metrics.interactions[eventType] = 0;
                }
                
                this.metrics.interactions[eventType]++;
            }, { passive: true });
        });
    }

    // 监控内存使用
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                this.metrics.memory = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
                };
            }, 30000); // 每30秒检查一次
        }
    }

    // 获取资源类型
    getResourceType(url) {
        const extension = url.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return 'image';
        } else if (['js'].includes(extension)) {
            return 'script';
        } else if (['css'].includes(extension)) {
            return 'stylesheet';
        } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
            return 'font';
        } else {
            return 'other';
        }
    }

    // 测量函数执行时间
    measureFunction(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        if (!this.metrics.functions) {
            this.metrics.functions = {};
        }
        
        if (!this.metrics.functions[name]) {
            this.metrics.functions[name] = {
                calls: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0
            };
        }
        
        const func = this.metrics.functions[name];
        const duration = end - start;
        
        func.calls++;
        func.totalTime += duration;
        func.averageTime = func.totalTime / func.calls;
        func.minTime = Math.min(func.minTime, duration);
        func.maxTime = Math.max(func.maxTime, duration);
        
        return result;
    }

    // 测量异步函数执行时间
    async measureAsyncFunction(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        if (!this.metrics.asyncFunctions) {
            this.metrics.asyncFunctions = {};
        }
        
        if (!this.metrics.asyncFunctions[name]) {
            this.metrics.asyncFunctions[name] = {
                calls: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0
            };
        }
        
        const func = this.metrics.asyncFunctions[name];
        const duration = end - start;
        
        func.calls++;
        func.totalTime += duration;
        func.averageTime = func.totalTime / func.calls;
        func.minTime = Math.min(func.minTime, duration);
        func.maxTime = Math.max(func.maxTime, duration);
        
        return result;
    }

    // 获取所有性能指标
    getMetrics() {
        return { ...this.metrics };
    }

    // 获取性能报告
    getReport() {
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.getMetrics()
        };
        
        return report;
    }

    // 报告性能指标
    reportMetrics(type, data) {
        // 在开发环境下输出到控制台
        if (process.env.NODE_ENV === 'development') {
            console.group(`Performance Metrics: ${type}`);
            console.table(data);
            console.groupEnd();
        }
        
        // 这里可以添加发送到分析服务的逻辑
        // analytics.track('performance', { type, data });
    }

    // 清理观察器
    cleanup() {
        Object.values(this.observers).forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
    }

    // 导出性能数据
    exportData() {
        const data = this.getReport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
});

// 导出性能监控实例
window.performanceMonitor = performanceMonitor;
