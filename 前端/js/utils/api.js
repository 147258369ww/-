// API 配置和工具函数
const API_BASE_URL = 'http://localhost:3000';

// API 工具类
class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.setupAxios();
    }

    setupAxios() {
        // 设置默认配置
        axios.defaults.baseURL = this.baseURL;
        axios.defaults.timeout = 10000;
        axios.defaults.headers.common['Content-Type'] = 'application/json';

        // 请求拦截器
        axios.interceptors.request.use(
            (config) => {
                // 显示加载动画
                this.showLoading();
                return config;
            },
            (error) => {
                this.hideLoading();
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        axios.interceptors.response.use(
            (response) => {
                this.hideLoading();
                return response;
            },
            (error) => {
                this.hideLoading();
                this.handleError(error);
                return Promise.reject(error);
            }
        );
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }

    handleError(error) {
        console.error('API Error:', error);
        
        let message = '网络请求失败，请稍后重试';
        
        if (error.response) {
            // 服务器响应错误
            const { status, data } = error.response;
            switch (status) {
                case 400:
                    message = data.message || '请求参数错误';
                    break;
                case 404:
                    message = '请求的资源不存在';
                    break;
                case 500:
                    message = '服务器内部错误';
                    break;
                default:
                    message = data.message || `请求失败 (${status})`;
            }
        } else if (error.request) {
            // 网络错误
            message = '网络连接失败，请检查网络设置';
        }

        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type} fixed top-20 right-4 z-50 max-w-sm`;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // 文章相关API
    async getArticles(params = {}) {
        try {
            const response = await axios.get('/api/articles', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getArticle(id) {
        try {
            const response = await axios.get(`/api/articles/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 分类相关API
    async getCategories() {
        try {
            const response = await axios.get('/api/categories');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getCategory(id) {
        try {
            const response = await axios.get(`/api/categories/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getCategoryArticles(id, params = {}) {
        try {
            const response = await axios.get(`/api/categories/${id}/articles`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 搜索相关API
    async searchArticles(query, params = {}) {
        try {
            const response = await axios.get('/api/search', { 
                params: { q: query, ...params } 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getSearchSuggestions(query, limit = 5) {
        try {
            const response = await axios.get('/api/search/suggestions', { 
                params: { q: query, limit } 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getPopularSearchTerms(limit = 10) {
        try {
            const response = await axios.get('/api/search/popular', { 
                params: { limit } 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 订阅相关API
    async subscribe(email) {
        try {
            const response = await axios.post('/api/subscribe', { email });
            this.showMessage('订阅成功！', 'success');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async unsubscribe(email) {
        try {
            const response = await axios.post('/api/subscribe/unsubscribe', { email });
            this.showMessage('取消订阅成功！', 'success');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 评论相关API
    async getComments(articleId, params = {}) {
        try {
            const response = await axios.get(`/api/articles/${articleId}/comments`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async submitComment(articleId, commentData) {
        try {
            const response = await axios.post(`/api/articles/${articleId}/comments`, commentData);
            this.showMessage('评论提交成功，等待审核！', 'success');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

// 创建全局API实例
const api = new ApiClient();

// 导出API实例
window.api = api;
