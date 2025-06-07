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
        if (!isCollapsed) {
            animationContainer.style.height = `${wrapper.offsetHeight}px`;
        }
    };
    
    // Установка начального состояния
    if (isCollapsed) {
        animationContainer.style.height = '0px';
        // ИКОНКА ДЛЯ СВЕРНУТОГО СОСТОЯНИЯ (предлагает развернуть)
        toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_open</span>';
        toggleBtn.classList.add('collapsed');
    } else {
        // ИКОНКА ДЛЯ РАЗВЕРНУТОГО СОСТОЯНИЯ (предлагает свернуть)
        toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_close</span>';
        
        // Двойное обновление для корректного расчета высоты
        setTimeout(() => {
            animationContainer.style.height = 'auto';
            const height = wrapper.offsetHeight;
            animationContainer.style.height = `${height}px`;
        }, 100);
    }
    
    // Обработчик клика
    toggleBtn.addEventListener('click', () => {
        const isCollapsedNow = toggleBtn.classList.contains('collapsed');
        
        if (isCollapsedNow) {
            // Разворачивание
            animationContainer.style.height = `${wrapper.offsetHeight}px`;
            // Меняем на иконку "свернуть"
            toggleBtn.innerHTML = '<span class="material-symbols-rounded">top_panel_close</span>';
            toggleBtn.classList.remove('collapsed');
            localStorage.setItem(storageKey, 'false');
        } else {
            // Сворачивание
            animationContainer.style.height = '0px';
            // Меняем на иконку "развернуть"
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
    const mutationObserver = new MutationObserver(() => {
        if (!toggleBtn.classList.contains('collapsed')) {
            animationContainer.style.height = 'auto';
            const newHeight = wrapper.offsetHeight;
            animationContainer.style.height = `${newHeight}px`;
        }
    });
    mutationObserver.observe(wrapper, {
        childList: true,
        subtree: true,
        characterData: true
    });
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
const handleSPANavigation = () => setTimeout(safeInit, 500);
window.addEventListener('popstate', handleSPANavigation);

// Патчинг для SPA
history.pushState = ((f) => function pushState() {
    const ret = f.apply(this, arguments);
    window.dispatchEvent(new Event('pushstate'));
    return ret;
})(history.pushState);

history.replaceState = ((f) => function replaceState() {
    const ret = f.apply(this, arguments);
    window.dispatchEvent(new Event('replacestate'));
    return ret;
})(history.replaceState);

window.addEventListener('pushstate', handleSPANavigation);
window.addEventListener('replacestate', handleSPANavigation);