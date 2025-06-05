// features/hider-panel.js
(() => {
  'use strict';

  const CLASS_NAMES = {
    COLLAPSED: 'custom-collapsed',
    EXPANDED: 'custom-expanded-content'
  };

  const SELECTORS = {
    LEFT_PANEL: 'div._9sPoVBFyE_vE87mnZJ5aB',
    CONTENT: 'div._1ijTaXJJA5YWl_fW2IxcaT',
    MAIN: 'div._3x1HklzyDs4TEjACrRO2tB',
    HEADER_BUTTONS: '._3Sb2o_mQ30IDRh0C72QUUu',
    TARGET_BLOCK: '._276E6ijBpjMA2_iTxNhhjc._2g5K_hJWc7jVo81zuejhk2' // Добавленный селектор
  };

  const STYLES = `
    .${CLASS_NAMES.COLLAPSED} {
      width: 0 !important;
      min-width: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: all 0.3s ease !important;
    }
    
    .${CLASS_NAMES.EXPANDED} {
      width: 100% !important;
      transition: all 0.3s ease !important;
    }
    
    .panel-toggle {
      display: inline-block;
      width: 32px;
      height: 16px;
      margin-right: 10px;
      cursor: pointer;
      z-index: 1000;
      position: relative;
      background-color: #555;
      border-radius: 8px;
      transition: background-color 0.3s;
      vertical-align: middle;
    }
    
    .panel-toggle:hover {
      background-color: #666;
    }
    
    .panel-toggle .toggle-handle {
      position: absolute;
      top: 2px;
      width: 12px;
      height: 12px;
      background-color: #b8b6b4;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    /* Свернутое состояние (панель скрыта) - бегунок слева */
    .panel-toggle.collapsed {
      background-color: #3A3A3A;
    }
    
    .panel-toggle.collapsed .toggle-handle {
      left: 2px;
      background-color: #e6e6e6;
    }
    
    /* Развернутое состояние (панель видна) - бегунок справа */
    .panel-toggle:not(.collapsed) .toggle-handle {
      left: 18px;
    }
    
    /* Стили для скрытия целевого блока */
    .hidden-block {
      display: none !important;
    }
  `;

  const STATE_KEY = 'steamPanelCollapsed';
  const MAX_ATTEMPTS = 15;
  const RETRY_DELAY = 200;

  const log = (message, isError = false) => {
    console[isError ? 'error' : 'log'](`[Millennium] ${message}`);
  };

  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
  };

  const waitForElement = async (selector, attempts = 0) => {
    const element = document.querySelector(selector);
    if (element) return element;
    
    if (attempts >= MAX_ATTEMPTS) {
      throw new Error(`Element ${selector} not found`);
    }
    
    await new Promise(r => setTimeout(r, RETRY_DELAY));
    return waitForElement(selector, attempts + 1);
  };

  const createToggleButton = () => {
    const button = document.createElement('div');
    button.className = 'panel-toggle';
    button.setAttribute('aria-label', 'Toggle sidebar');
    button.innerHTML = '<div class="toggle-handle"></div>';
    return button;
  };

  const setupToggleButton = (button, leftPanel, content, main, targetBlock) => {
    const isCollapsed = localStorage.getItem(STATE_KEY) === 'true';
    
    const updateUI = (collapsed) => {
      leftPanel.classList.toggle(CLASS_NAMES.COLLAPSED, collapsed);
      content.classList.toggle(CLASS_NAMES.EXPANDED, collapsed);
      main.style.justifyContent = collapsed ? 'center' : 'flex-start';
      
      button.classList.toggle('collapsed', collapsed);
      localStorage.setItem(STATE_KEY, String(collapsed));
      
      // Управление видимостью целевого блока
      if (targetBlock) {
        if (collapsed) {
          targetBlock.classList.add('hidden-block');
        } else {
          targetBlock.classList.remove('hidden-block');
        }
      }
    };

    button.addEventListener('click', () => {
      const currentState = leftPanel.classList.contains(CLASS_NAMES.COLLAPSED);
      updateUI(!currentState);
    });

    updateUI(isCollapsed);
  };

  const initialize = async () => {
    try {
      log('Initializing panel hider');
      injectStyles();

      // Ищем все необходимые элементы, включая целевой блок
      const [leftPanel, content, main, headerButtons, targetBlock] = await Promise.all([
        waitForElement(SELECTORS.LEFT_PANEL),
        waitForElement(SELECTORS.CONTENT),
        waitForElement(SELECTORS.MAIN),
        waitForElement(SELECTORS.HEADER_BUTTONS),
        waitForElement(SELECTORS.TARGET_BLOCK).catch(() => null) // Если блок не найден - не прерываем выполнение
      ]);

      const toggleButton = createToggleButton();
      headerButtons.insertBefore(toggleButton, headerButtons.firstChild);
      
      setupToggleButton(toggleButton, leftPanel, content, main, targetBlock);
      log('Panel hider initialized successfully');
      
      if (!targetBlock) {
        log('Target block not found, hiding feature will be disabled', true);
      }
    } catch (error) {
      log(`Initialization failed: ${error.message}`, true);
    }
  };

  // Start initialization
  initialize();
})();