// 导航栏组件
class Navbar {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollEffect();
        this.setupMobileMenu();
    }

    // 设置滚动效果
    setupScrollEffect() {
        const navbar = document.getElementById('navbar');
        let lastScrollY = window.scrollY;

        const handleScroll = helpers.throttle(() => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScrollY = currentScrollY;
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }

    // 设置移动端菜单
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                
                // 切换图标
                const icon = mobileMenuBtn.querySelector('i');
                if (mobileMenu.classList.contains('hidden')) {
                    icon.className = 'fas fa-bars text-xl';
                } else {
                    icon.className = 'fas fa-times text-xl';
                }
            });

            // 点击菜单项时关闭菜单
            mobileMenu.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    mobileMenu.classList.add('hidden');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.className = 'fas fa-bars text-xl';
                }
            });

            // 点击外部关闭菜单
            document.addEventListener('click', (e) => {
                if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.className = 'fas fa-bars text-xl';
                }
            });
        }
    }

    // 更新活动导航项
    updateActiveNav(path) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = new URL(link.href).pathname;
            if (linkPath === path || (path === '/' && linkPath === '/')) {
                link.classList.add('active');
            }
        });
    }
}

// 初始化导航栏
window.navbar = new Navbar();
