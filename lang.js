// 1. 语言切换逻辑
function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(el => {
        el.innerHTML = el.getAttribute(`data-${lang}`);
    });
}

// 2. 核心：自动加载/停止 iframe 的“开关”
function initProjectObserver() {
    // 选出所有全屏作品的容器
    const projectSections = document.querySelectorAll('.small-work-fullscreen');
    
    const observerOptions = {
        root: null, // 默认以浏览器视口为准
        threshold: 0.4, // 只要露出 10% 就开始加载
        rootMargin: "0px" 
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const iframe = entry.target.querySelector('iframe');
            if (!iframe) return;

            const targetSrc = iframe.getAttribute('data-src');

            if (entry.isIntersecting) {
                // 滚入视口：把 data-src 填入 src，p5.js 开始运行
                if (iframe.src !== targetSrc) {
                    iframe.src = targetSrc;
                    console.log("Entering view: Loading " + targetSrc);
                }
            } else {
                // 滚出视口：清空 src，强制关掉音乐和进程
                if (iframe.src !== "") {
                    iframe.src = "";
                    console.log("Leaving view: Stopping project");
                }
            }
        });
    }, observerOptions);

    projectSections.forEach(section => {
        observer.observe(section);
    });
}

// 3. 汉堡菜单：点击链接后自动关闭
function initHamburgerClose() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
}

// 4. 页面启动器
window.onload = () => {
    // 执行语言检查
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    setLanguage(savedLang);

    // 启动观察器
    initProjectObserver();

    // 汉堡菜单关闭
    initHamburgerClose();
};