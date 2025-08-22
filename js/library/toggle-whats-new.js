// Toggle What's New panel in Steam Library (оптимизированная версия)
(() => {
  // Конфигурация
  const CONFIG = {
    selectors: {
      targetBlock: '._17uEBe5Ri8TMsnfELvs8-N',
      headerBlock: '._2o5c89vAnrXN8C60QTSMqO',
      contentBlock: '._3fiHsLeD_6rtm6bM9lHlVL'
    },
    storageKey: 'newsPanelCollapsedState',
    timing: {
      transition: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    buttonClasses: {
      animate: ['_14b-hQsLwSwYcELtknxCUX', '_3IIEUTw03Vm3Mk54jlnUaT'],
      exclude: ['_14b-hQsLwSwYcELtknxCUX', '_3IIEUTw03Vm3Mk54jlnUaT', '_1eFe5VbyACJE4RVGpOWKMC']
    }
  };

  // Состояние
  let observers = {
    dom: null,
    resize: null,
    mutation: null
  };
  let cleanupTimeout = null;

  // Очистка ресурсов
  function cleanup() {
    // Отключаем наблюдатели
    Object.values(observers).forEach(observer => observer?.disconnect());
    observers = {
      dom: null,
      resize: null,
      mutation: null
    };
    
    // Очищаем таймеры
    clearTimeout(cleanupTimeout);
    
    // Восстанавливаем оригинальные методы history
    if (window.originalPushState) {
      history.pushState = window.originalPushState;
      delete window.originalPushState;
    }
    if (window.originalReplaceState) {
      history.replaceState = window.originalReplaceState;
      delete window.originalReplaceState;
    }
    
    // Восстанавливаем оригинальную структуру DOM
    const container = document.querySelector('.whats-new-container');
    container?.parentElement?.replaceChildren(...container.childNodes);
    container?.remove();
  }

  // Основная функция настройки
  function setupToggle() {
    const { targetBlock, headerBlock, contentBlock } = CONFIG.selectors;
    const targetEl = document.querySelector(targetBlock);
    const headerEl = document.querySelector(headerBlock);
    const contentEl = document.querySelector(contentBlock);
    
    // Проверка элементов
    if (!targetEl || !headerEl || !contentEl) return;
    if (document.querySelector('.whats-new-container')) return;

    // Создаем контейнер
    const container = document.createElement('div');
    container.className = 'whats-new-container';
    
    // Создаем обертку для заголовка
    const headerContainer = document.createElement('div');
    headerContainer.className = 'whats-new-header';
    headerContainer.appendChild(headerEl);
    
    // Создаем внутренний контент
    const innerContent = document.createElement('div');
    innerContent.className = 'whats-new-inner';
    innerContent.appendChild(contentEl);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'whats-new-content';
    contentContainer.appendChild(innerContent);
    
    // Устанавливаем CSS-переменные для анимации
    contentContainer.style.setProperty('--twn-transition-duration', `${CONFIG.timing.transition}ms`);
    contentContainer.style.setProperty('--twn-transition-easing', CONFIG.timing.easing);
    
    // Вставляем контейнер в DOM
    targetEl.parentNode.insertBefore(container, targetEl);
    container.append(headerContainer, contentContainer);
    
    // Перемещаем остальные элементы
    [...targetEl.childNodes].forEach(child => {
      if (![headerEl, contentEl].includes(child)) {
        container.appendChild(child);
      }
    });
    
    targetEl.remove();

    // Обработка состояния
    let isCollapsed = localStorage.getItem(CONFIG.storageKey) === 'true';
    
    const updateState = (collapsed, animate = true) => {
      // Управление анимацией
      if (!animate) contentContainer.classList.add('no-animation');
      
      // Установка высоты
      contentContainer.style.maxHeight = collapsed ? '0' : `${innerContent.scrollHeight}px`;
      
      requestAnimationFrame(() => {
        headerContainer.classList.toggle('collapsed', collapsed);
        
        // Возвращаем анимацию после установки состояния
        if (!animate) {
          requestAnimationFrame(() => {
            contentContainer.classList.remove('no-animation');
          });
        }
      });

      // Сохраняем состояние
      localStorage.setItem(CONFIG.storageKey, collapsed);
    };

    // Инициализация состояния
    updateState(isCollapsed, false);

    // Обработчик клика с исключением кнопок
    headerContainer.addEventListener('click', (event) => {
      if (CONFIG.buttonClasses.exclude.some(cls => event.target.closest(`.${cls}`))) {
        return;
      }
      
      isCollapsed = !isCollapsed;
      updateState(isCollapsed, true);
    });

    // Обновление высоты контента
    const updateContentHeight = () => {
      if (!isCollapsed) {
        contentContainer.style.maxHeight = `${innerContent.scrollHeight}px`;
      }
    };

    // Наблюдатели за изменениями контента
    observers.resize = new ResizeObserver(updateContentHeight);
    observers.resize.observe(innerContent);
    
    observers.mutation = new MutationObserver(updateContentHeight);
    observers.mutation.observe(innerContent, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Инициализация
  function init() {
    cleanup();

    // Патчим методы history
    const patchHistoryMethod = (method) => {
      const original = history[method];
      history[method] = function(...args) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event(method.toLowerCase()));
        return result;
      };
    };
    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');

    // Безопасная инициализация
    const safeInit = () => {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = setTimeout(setupToggle, 100);
    };

    // Обработчики событий
    ['load', 'popstate', 'pushstate', 'replacestate'].forEach(evt => {
      window.addEventListener(evt, safeInit, { passive: true });
    });

    // Наблюдатель за DOM
    observers.dom = new MutationObserver(safeInit);
    observers.dom.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Первоначальная настройка
    safeInit();
  }

  // Очистка при выгрузке
  window.addEventListener('unload', cleanup, { passive: true });

  // Запуск
  init();
})();