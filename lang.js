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
    // 选出所有需要懒加载的容器（小项目 + 三视频板块）
    const projectSections = document.querySelectorAll('.small-work-fullscreen, .triple-video-section');

    const observerOptions = {
        root: null,
        threshold: 0.3,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // 支持一个 section 内多个 iframe
            const iframes = entry.target.querySelectorAll('iframe[data-src]');
            if (!iframes.length) return;

            iframes.forEach(iframe => {
                const targetSrc = iframe.getAttribute('data-src');

                if (entry.isIntersecting) {
                    if (iframe.src !== targetSrc) {
                        iframe.src = targetSrc;
                        console.log("Entering view: Loading " + targetSrc);
                    }
                } else {
                    if (iframe.src !== "") {
                        iframe.src = "";
                        console.log("Leaving view: Stopping project");
                    }
                }
            });
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