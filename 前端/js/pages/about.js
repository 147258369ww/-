// 关于页面组件
class AboutPage {
    constructor() {
        // 关于页面是静态内容，不需要从API获取数据
    }

    async render() {
        this.renderPage();
    }

    renderPage() {
        const mainContent = document.getElementById('mainContent');
        
        const html = `
            <div class="max-w-7xl mx-auto px-6 py-16">
                <!-- 页面标题 -->
                <div class="text-center mb-16">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">关于我</h1>
                    <div class="w-24 h-1 bg-blue-600 mx-auto"></div>
                </div>
                
                <!-- 个人介绍部分 -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
                    <div class="md:col-span-1">
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <img
                                src="/images/avatar.svg"
                                alt="个人头像"
                                class="w-48 h-48 rounded-full mx-auto mb-6 object-cover"
                            >
                            <h2 class="text-2xl font-bold text-gray-900 text-center mb-4">博主</h2>
                            <div class="flex justify-center space-x-4 mb-6">
                                <a href="#" class="text-gray-600 hover:text-blue-600">
                                    <i class="fab fa-github text-xl"></i>
                                </a>
                                <a href="#" class="text-gray-600 hover:text-blue-600">
                                    <i class="fab fa-weixin text-xl"></i>
                                </a>
                                <a href="#" class="text-gray-600 hover:text-blue-600">
                                    <i class="fab fa-weibo text-xl"></i>
                                </a>
                            </div>
                            <div class="space-y-3 text-gray-600">
                                <div class="flex items-center">
                                    <i class="fas fa-map-marker-alt w-6"></i>
                                    <span>中国，北京</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-envelope w-6"></i>
                                    <span>contact@example.com</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-briefcase w-6"></i>
                                    <span>全栈开发工程师</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="md:col-span-2">
                        <h3 class="text-2xl font-bold text-gray-900 mb-6">个人简介</h3>
                        <div class="prose prose-lg max-w-none text-gray-700">
                            <p>你好！我是一名热爱技术和设计的全栈开发工程师，拥有多年的Web开发经验。我喜欢探索新技术，解决复杂问题，并创造用户友好的数字体验。</p>
                            <p>在这个博客中，我将分享我的技术见解、项目经验以及对设计和用户体验的思考。我相信技术应该服务于人，而不是相反。</p>
                            <p>除了编程，我还喜欢摄影、阅读和旅行。这些爱好帮助我保持创造力，并从不同角度看待问题。</p>
                            <p>如果你对我的文章有任何问题或想法，欢迎通过邮件或社交媒体联系我。我很乐意与你交流！</p>
                        </div>
                        
                        <h3 class="text-2xl font-bold text-gray-900 mt-12 mb-6">专业技能</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div class="flex justify-between mb-2">
                                    <span class="font-medium text-gray-700">前端开发</span>
                                    <span>90%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: 90%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between mb-2">
                                    <span class="font-medium text-gray-700">后端开发</span>
                                    <span>85%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: 85%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between mb-2">
                                    <span class="font-medium text-gray-700">UI/UX设计</span>
                                    <span>75%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: 75%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between mb-2">
                                    <span class="font-medium text-gray-700">数据库</span>
                                    <span>80%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5">
                                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: 80%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 博客介绍部分 -->
                <div class="bg-gray-50 rounded-lg p-8 mb-20">
                    <h3 class="text-2xl font-bold text-gray-900 mb-6">关于本博客</h3>
                    <div class="prose prose-lg max-w-none text-gray-700">
                        <p>这个博客创建于2024年，旨在分享我在技术领域的学习和思考。内容主要涵盖前端开发、后端技术、设计思想以及我的个人项目。</p>
                        <p>博客采用现代化的技术栈构建，前端使用HTML5、CSS3和JavaScript，结合Tailwind CSS实现响应式设计；后端基于Node.js和Express，数据存储使用MySQL。</p>
                        <p>我希望这个博客不仅是我个人知识的记录，也能成为与志同道合者交流的平台。无论你是技术爱好者还是专业开发者，都希望你能在这里找到有价值的内容。</p>
                    </div>
                </div>
                
                <!-- 联系表单 -->
                <div class="max-w-3xl mx-auto">
                    <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">联系我</h3>
                    <form id="contactForm" class="bg-white rounded-lg shadow-sm p-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label for="name" class="block text-gray-700 font-medium mb-2">姓名</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                            </div>
                            <div>
                                <label for="email" class="block text-gray-700 font-medium mb-2">邮箱</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                            </div>
                        </div>
                        <div class="mb-6">
                            <label for="subject" class="block text-gray-700 font-medium mb-2">主题</label>
                            <input 
                                type="text" 
                                id="subject" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                        </div>
                        <div class="mb-6">
                            <label for="message" class="block text-gray-700 font-medium mb-2">消息</label>
                            <textarea 
                                id="message" 
                                rows="5" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            ></textarea>
                        </div>
                        <div class="text-center">
                            <button 
                                type="submit" 
                                class="btn-primary"
                            >
                                发送消息
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
        
        // 设置联系表单事件
        this.setupContactForm();
    }
    
    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // 获取表单数据
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const subject = document.getElementById('subject').value;
                const message = document.getElementById('message').value;
                
                // 这里可以添加表单验证逻辑
                
                // 显示成功消息（实际项目中应该发送到后端）
                api.showMessage('消息已发送，感谢您的反馈！', 'success');
                
                // 重置表单
                contactForm.reset();
            });
        }
    }
}

// 导出关于页面组件
window.AboutPage = AboutPage;
