// 搜索组件
class Search {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.suggestionsContainer = document.getElementById('searchSuggestions');
        this.currentQuery = '';
        this.isSearching = false;
        this.init();
    }

    init() {
        if (this.searchInput) {
            this.setupSearchInput();
            this.setupKeyboardNavigation();
        }
    }

    setupSearchInput() {
        // 防抖搜索建议
        const debouncedSearch = helpers.debounce(async (query) => {
            if (query.length >= 2) {
                await this.fetchSuggestions(query);
            } else {
                this.hideSuggestions();
            }
        }, 300);

        // 输入事件
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.currentQuery = query;
            
            if (query) {
                debouncedSearch(query);
            } else {
                this.hideSuggestions();
            }
        });

        // 获得焦点时显示建议
        this.searchInput.addEventListener('focus', () => {
            if (this.currentQuery.length >= 2) {
                this.showSuggestions();
            }
        });

        // 失去焦点时隐藏建议（延迟以允许点击建议）
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideSuggestions();
            }, 200);
        });

        // 回车搜索
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(this.currentQuery);
            }
        });
    }

    setupKeyboardNavigation() {
        let selectedIndex = -1;

        this.searchInput.addEventListener('keydown', (e) => {
            const suggestions = this.suggestionsContainer.querySelectorAll('.search-suggestion');
            
            if (suggestions.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
                    this.updateSelection(suggestions, selectedIndex);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    this.updateSelection(suggestions, selectedIndex);
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                        const suggestion = suggestions[selectedIndex].textContent;
                        this.performSearch(suggestion);
                    } else {
                        this.performSearch(this.currentQuery);
                    }
                    break;
                    
                case 'Escape':
                    this.hideSuggestions();
                    this.searchInput.blur();
                    break;
            }
        });
    }

    updateSelection(suggestions, selectedIndex) {
        suggestions.forEach((suggestion, index) => {
            if (index === selectedIndex) {
                suggestion.classList.add('bg-gray-100');
                this.searchInput.value = suggestion.textContent;
            } else {
                suggestion.classList.remove('bg-gray-100');
            }
        });

        if (selectedIndex === -1) {
            this.searchInput.value = this.currentQuery;
        }
    }

    async fetchSuggestions(query) {
        try {
            this.isSearching = true;
            const response = await api.getSearchSuggestions(query, 5);
            
            if (response.success && response.data.length > 0) {
                this.renderSuggestions(response.data);
                this.showSuggestions();
            } else {
                this.hideSuggestions();
            }
        } catch (error) {
            console.error('获取搜索建议失败:', error);
            this.hideSuggestions();
        } finally {
            this.isSearching = false;
        }
    }

    renderSuggestions(suggestions) {
        const html = suggestions.map(suggestion => `
            <div class="search-suggestion" onclick="search.performSearch('${suggestion}')">
                <i class="fas fa-search text-gray-400 mr-3"></i>
                ${this.highlightQuery(suggestion, this.currentQuery)}
            </div>
        `).join('');

        this.suggestionsContainer.innerHTML = html;
    }

    highlightQuery(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    showSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.classList.remove('hidden');
        }
    }

    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.classList.add('hidden');
        }
    }

    performSearch(query) {
        if (!query.trim()) return;

        this.hideSuggestions();
        this.searchInput.value = query;
        
        // 导航到搜索结果页
        router.navigate(`/search.html?q=${encodeURIComponent(query)}`);
    }

    // 获取热门搜索词
    async getPopularTerms() {
        try {
            const response = await api.getPopularSearchTerms(8);
            return response.success ? response.data : [];
        } catch (error) {
            console.error('获取热门搜索词失败:', error);
            return [];
        }
    }

    // 渲染热门搜索词
    renderPopularTerms(container, terms) {
        if (!container || !terms.length) return;

        const html = `
            <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">热门搜索</h3>
                <div class="flex flex-wrap gap-2">
                    ${terms.map(term => `
                        <button 
                            class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                            onclick="search.performSearch('${term.term}')"
                        >
                            ${term.term}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
}

// 初始化搜索组件
window.search = new Search();
