// Toggle List Games - Sidebar toggle for Steam Library
(() => {
  const CONFIG = {
    collapsed: 'custom-collapsed',
    expanded: 'custom-expanded-content',
    noTransition: 'no-transition',
    initializing: 'steam-panel-initializing',
    hiddenBlock: 'hidden-block',
    selectors: {
      leftPanel: 'div._9sPoVBFyE_vE87mnZJ5aB',
      content: 'div._1ijTaXJJA5YWl_fW2IxcaT',
      main: 'div._3x1HklzyDs4TEjACrRO2tB',
      headerButtons: '._3Sb2o_mQ30IDRh0C72QUUu',
      targetBlock: '._276E6ijBpjMA2_iTxNhhjc._2g5K_hJWc7jVo81zuejhk2',
      borderElement: '._1rDh5rXSFZJOqCa4UpnI4z'
    },
    stateKey: 'steamPanelCollapsed',
    timing: {
      transition: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  };

  let observer = null;
  let focusHandler = null;
  let cleanupTimeout = null;
  let initTimeout = null;

  function waitForElement(selector, maxTries = 15, delay = 200) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      let tries = 0;
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        } else if (++tries >= maxTries) {
          clearInterval(interval);
          reject(`Element not found: ${selector}`);
        }
      }, delay);
    });
  }

  function cleanup() {
    observer?.disconnect();
    observer = null;
    
    if (focusHandler) {
      window.removeEventListener('focus', focusHandler);
      focusHandler = null;
    }

    clearTimeout(cleanupTimeout);
    clearTimeout(initTimeout);
  }

  async function setupToggle() {
    try {
      document.body.classList.add(CONFIG.initializing);

      const [
        leftPanel, content, main, headerButtons,
        toggleButtonContainer
      ] = await Promise.all([
        waitForElement(CONFIG.selectors.leftPanel),
        waitForElement(CONFIG.selectors.content),
        waitForElement(CONFIG.selectors.main),
        waitForElement(CONFIG.selectors.headerButtons),
        waitForElement('._1ZS_xta5HMXzR8JgxDH6n7')
      ]);

      const targetBlock = document.querySelector(CONFIG.selectors.targetBlock);
      const borderElement = document.querySelector(CONFIG.selectors.borderElement);

      // Remove old button if present
      document.querySelector('.panel-list-icon')?.remove();

      // Create button
      const btn = document.createElement('button');
      btn.className = 'panel-list-icon';
      btn.setAttribute('aria-label', 'Toggle sidebar');
      toggleButtonContainer.appendChild(btn);

      // State
      let isCollapsed = localStorage.getItem(CONFIG.stateKey) === 'true';

      function setState(collapsed, animate = true) {
        if (!animate) {
          leftPanel.classList.add(CONFIG.noTransition);
          content.classList.add(CONFIG.noTransition);
          requestAnimationFrame(() => {
            leftPanel.classList.remove(CONFIG.noTransition);
            content.classList.remove(CONFIG.noTransition);
          });
        }

        // Cache DOM lookups
        const icon = collapsed ? 'left_panel_open' : 'left_panel_close';
        const justifyContent = collapsed ? 'center' : 'flex-start';
        const borderRadius = collapsed ? '6px' : '';

        requestAnimationFrame(() => {
          leftPanel.classList.toggle(CONFIG.collapsed, collapsed);
          content.classList.toggle(CONFIG.expanded, collapsed);
          main.style.justifyContent = justifyContent;
          leftPanel.style.width = collapsed ? '0' : '';
          targetBlock?.classList.toggle(CONFIG.hiddenBlock, collapsed);
          if (borderElement) {
            borderElement.style.borderTopLeftRadius = borderRadius;
          }
          btn.innerHTML = `<span class="material-symbols-rounded">${icon}</span>`;
          btn.classList.toggle('collapsed', collapsed);
        });

        localStorage.setItem(CONFIG.stateKey, collapsed);
      }

      // Initial state without animation
      setState(isCollapsed, false);

      // Click handler with animation
      const clickHandler = () => {
        isCollapsed = !leftPanel.classList.contains(CONFIG.collapsed);
        setState(isCollapsed, true);
      };

      btn.addEventListener('click', clickHandler);

      cleanupTimeout = setTimeout(() => {
        document.body.classList.remove(CONFIG.initializing);
      }, CONFIG.timing.transition);

    } catch (e) {
      console.error('[Comfort Edition] Ошибка инициализации:', e);
    }
  }

  function init() {
    cleanup();

    observer = new MutationObserver(mutations => {
      if (mutations.some(m => Array.from(m.addedNodes).some(n =>
        n.nodeType === 1 && (n.matches?.(CONFIG.selectors.headerButtons) || n.querySelector?.(CONFIG.selectors.headerButtons))
      ))) {
        setupToggle();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    focusHandler = () => {
      clearTimeout(initTimeout);
      initTimeout = setTimeout(setupToggle, 100);
    };
    
    window.addEventListener('focus', focusHandler, { passive: true });
    setupToggle();
  }

  // Cleanup on unload
  window.addEventListener('unload', cleanup, { passive: true });

  // Start
  init();
})();