function initToggleButton() {
    if (document.querySelector('.custom-news-icon')) return;
    
    const container = document.querySelector('._3Sb2o_mQ30IDRh0C72QUUu');
    const targetBlock = document.querySelector('._17uEBe5Ri8TMsnfELvs8-N');
    if (!container || !targetBlock) return;
    
    let wrapper = targetBlock.parentElement;
    if (!wrapper) return;
    
    // Создаем контейнер для анимации
    const animationContainer = document.createElement('div');
    animationContainer.className = 'header-animation-container';
    wrapper.parentNode.insertBefore(animationContainer, wrapper);
    animationContainer.appendChild(wrapper);
    
    // Добавляем CSS для плавной анимации
    const css = `
        .header-animation-container {
            overflow: hidden;
            transition: height 0.3s ease;
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    
    const storageKey = 'newsPanelCollapsedState';
    const isCollapsed = localStorage.getItem(storageKey) === 'true';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'custom-news-icon';
    toggleBtn.title = 'Свернуть/развернуть новости';
    container.style.position = 'relative';
    container.appendChild(toggleBtn);
    
    // Функция для обновления высоты контейнера
    const updateHeight = () => {
        if (animationContainer.style.height !== '0px') {
            animationContainer.style.height = `${wrapper.offsetHeight}px`;
        }
    };
    
    // Установка начального состояния
    if (isCollapsed) {
        animationContainer.style.height = '0px';
        toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_open</span>';
        toggleBtn.classList.add('collapsed');
    } else {
        // Отложенная инициализация высоты
        setTimeout(() => {
            animationContainer.style.height = `${wrapper.offsetHeight}px`;
        }, 50);
        toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_close</span>';
    }
    
    // Обработчик клика
    toggleBtn.addEventListener('click', () => {
        const currentlyCollapsed = toggleBtn.classList.contains('collapsed');
        
        if (currentlyCollapsed) {
            // Разворачивание с анимацией
            animationContainer.style.height = `${wrapper.offsetHeight}px`;
            toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_close</span>';
            toggleBtn.classList.remove('collapsed');
            localStorage.setItem(storageKey, 'false');
        } else {
            // Сворачивание
            animationContainer.style.height = '0px';
            toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_open</span>';
            toggleBtn.classList.add('collapsed');
            localStorage.setItem(storageKey, 'true');
        }
    });
    
    // Резиновый Observer
    const resizeObserver = new ResizeObserver(() => {
        if (!toggleBtn.classList.contains('collapsed')) {
            animationContainer.style.height = 'auto';
            const newHeight = wrapper.offsetHeight;
            animationContainer.style.height = `${newHeight}px`;
        }
    });
    resizeObserver.observe(wrapper);
    
    // Обновление при изменении контента
    const mutationObserver = new MutationObserver(updateHeight);
    mutationObserver.observe(wrapper, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Обновление при изменении видимости
    const visibilityObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) updateHeight();
    }, { threshold: 0.1 });
    visibilityObserver.observe(targetBlock);
}

// Инициализация с двойной проверкой
function safeInit() {
    if (!document.querySelector('.custom-news-icon') && 
        document.querySelector('._17uEBe5Ri8TMsnfELvs8-N')) {
        initToggleButton();
    }
}

window.addEventListener('load', () => {
    setTimeout(safeInit, 1000);
});

const observer = new MutationObserver(safeInit);
observer.observe(document.body, { childList: true, subtree: true });

// Перехват SPA-переходов
const handleSPANavigation = () => setTimeout(safeInit, 300);
window.addEventListener('popstate', handleSPANavigation);
window.addEventListener('pushstate', handleSPANavigation);
window.addEventListener('replacestate', handleSPANavigation);