// Toggle What's New panel in Steam Library
(() => {
  const CONFIG = {
    selectors: {
      container: '._3Sb2o_mQ30IDRh0C72QUUu',
      targetBlock: '._17uEBe5Ri8TMsnfELvs8-N'
    },
    storageKey: 'newsPanelCollapsedState',
    timing: {
      transition: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  };

  let domObserver = null;
  let resizeObserver = null;
  let mutationObserver = null;
  let checkTimeout = null;
  let cleanupTimeout = null;

  function injectStyles() {
    if (document.getElementById('twn-toggle-styles')) return;
    const style = document.createElement('style');
    style.id = 'twn-toggle-styles';
    style.textContent = `
      ._17uEBe5Ri8TMsnfELvs8-N-wrapper {
        overflow: hidden !important;
        transition: height ${CONFIG.timing.transition}ms ${CONFIG.timing.easing} !important;
      }
      ._17uEBe5Ri8TMsnfELvs8-N {
        transition: transform ${CONFIG.timing.transition}ms ${CONFIG.timing.easing} !important;
      }
      ._17uEBe5Ri8TMsnfELvs8-N.hidden {
        transform: translateY(-100%) !important;
      }
      .custom-news-icon {
        position: absolute;
        background: unset;
        top: 10px;
        left: 48px;
        z-index: 1001;
        color: #ffffff;
        opacity: 0.3;
        border: none;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0;
        transition: opacity .2s ease;
      }
      .header-animation-container {
        overflow: hidden !important;
        transition: height ${CONFIG.timing.transition}ms ${CONFIG.timing.easing} !important;
      }
      .custom-news-icon:hover {
        opacity: 1;
      }
      .no-animation {
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function cleanup() {
    domObserver?.disconnect();
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    
    domObserver = null;
    resizeObserver = null;
    mutationObserver = null;
    
    clearTimeout(checkTimeout);
    clearTimeout(cleanupTimeout);
    
    document.getElementById('twn-toggle-styles')?.remove();
    document.querySelector('.custom-news-icon')?.remove();

    // Remove history patches
    if (window.originalPushState) {
      history.pushState = window.originalPushState;
      delete window.originalPushState;
    }
    if (window.originalReplaceState) {
      history.replaceState = window.originalReplaceState;
      delete window.originalReplaceState;
    }
  }

  async function setupToggle() {
    injectStyles();
    const container = document.querySelector(CONFIG.selectors.container);
    const targetBlock = document.querySelector(CONFIG.selectors.targetBlock);
    
    if (!container) return;

    if (!targetBlock) {
      checkTimeout = setTimeout(() => {
        if (!document.querySelector(CONFIG.selectors.targetBlock)) {
          console.warn('[Comfort Edition] Панель "What\'s New" (Что нового) не загружена или отсутствует на странице.');
        }
      }, 2000);
      return;
    }

    // Prevent duplicates
    if (document.querySelector('.custom-news-icon')) return;

    const wrapper = targetBlock.parentElement;
    if (!wrapper) return;

    wrapper.classList.add('_17uEBe5Ri8TMsnfELvs8-N-wrapper');
    const animationContainer = document.createElement('div');
    animationContainer.className = 'header-animation-container';
    wrapper.before(animationContainer);
    animationContainer.append(wrapper);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'custom-news-icon';
    toggleBtn.setAttribute('aria-label', 'Toggle What News');
    container.style.position = 'relative';

    let isCollapsed = localStorage.getItem(CONFIG.storageKey) === 'true';
    
    function updateState(collapsed, animate = true) {
      // Добавляем класс no-animation для предотвращения анимации при необходимости
      if (!animate) {
        animationContainer.classList.add('no-animation');
        wrapper.classList.add('no-animation');
      }

      const icon = collapsed ? 'top_panel_open' : 'top_panel_close';
      const height = collapsed ? '0' : `${wrapper.offsetHeight}px`;

      requestAnimationFrame(() => {
        toggleBtn.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
        toggleBtn.classList.toggle('collapsed', collapsed);
        animationContainer.style.height = height;

        // Удаляем класс no-animation после применения стилей
        if (!animate) {
          requestAnimationFrame(() => {
            animationContainer.classList.remove('no-animation');
            wrapper.classList.remove('no-animation');
          });
        }
      });

      localStorage.setItem(CONFIG.storageKey, collapsed);
    }

    // Initial state - всегда без анимации
    updateState(isCollapsed, false);
    container.append(toggleBtn);

    // Click handler - с анимацией
    toggleBtn.addEventListener('click', () => {
      isCollapsed = !toggleBtn.classList.contains('collapsed');
      updateState(isCollapsed, true);
    });

    // Height updates
    const updateHeight = () => {
      if (!toggleBtn.classList.contains('collapsed')) {
        requestAnimationFrame(() => {
          // Обновляем высоту без анимации
          animationContainer.classList.add('no-animation');
          animationContainer.style.height = `${wrapper.offsetHeight}px`;
          requestAnimationFrame(() => {
            animationContainer.classList.remove('no-animation');
          });
        });
      }
    };

    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(wrapper);
    
    mutationObserver?.disconnect();
    mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(updateHeight);
    });
    mutationObserver.observe(wrapper, { 
      childList: true, 
      subtree: true, 
      characterData: true 
    });
  }

  function init() {
    cleanup();

    // Store original history methods
    if (!window.originalPushState) {
      window.originalPushState = history.pushState;
      window.originalReplaceState = history.replaceState;
    }

    // Patch history
    ['pushState', 'replaceState'].forEach(method => {
      const original = history[method];
      history[method] = function () {
        const result = original.apply(this, arguments);
        window.dispatchEvent(new Event(method.toLowerCase()));
        return result;
      };
    });

    const safeInit = () => {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = setTimeout(setupToggle, 100);
    };

    // Event listeners
    window.addEventListener('load', safeInit, { passive: true });
    ['popstate', 'pushstate', 'replacestate'].forEach(evt => 
      window.addEventListener(evt, safeInit, { passive: true })
    );

    // DOM observer
    domObserver = new MutationObserver(safeInit);
    domObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Initial setup
    setupToggle();
  }

  // Cleanup on unload
  window.addEventListener('unload', cleanup, { passive: true });

  // Start
  init();
})();