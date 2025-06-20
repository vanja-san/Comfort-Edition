// scripts/features/library/tlg.js - Toggle List Games
(() => {
  "use strict";

  // Конфигурация в виде констант
  const CLASS_NAMES = {
    COLLAPSED: "custom-collapsed",
    EXPANDED: "custom-expanded-content",
    NO_TRANSITION: "no-transition",
    INITIALIZING: "steam-panel-initializing"
  };

  const SELECTORS = {
    LEFT_PANEL: "div._9sPoVBFyE_vE87mnZJ5aB",
    CONTENT: "div._1ijTaXJJA5YWl_fW2IxcaT",
    MAIN: "div._3x1HklzyDs4TEjACrRO2tB",
    HEADER_BUTTONS: "._3Sb2o_mQ30IDRh0C72QUUu",
    TARGET_BLOCK: "._276E6ijBpjMA2_iTxNhhjc._2g5K_hJWc7jVo81zuejhk2",
    BORDER_ELEMENT: "._1rDh5rXSFZJOqCa4UpnI4z",
  };

  const STYLES = `
    .${CLASS_NAMES.COLLAPSED} {
      width: 0 !important;
      min-width: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    .${CLASS_NAMES.EXPANDED} {
      width: 100% !important;
    }
    
    ${SELECTORS.LEFT_PANEL}, ${SELECTORS.CONTENT} {
      transition: all 0.3s ease-out !important;
    }
    
    .${CLASS_NAMES.NO_TRANSITION} {
      transition: none !important;
    }
    
    .panel-list-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      cursor: pointer;
      position: absolute;
      background: unset;
      color: #8b929a;
      border: none;
      transition: color 0.2s ease;
      font-size: 0;
      z-index: 1000;
      top: 10px;
      left: 21px;
    }

    .panel-list-icon:hover {
      color: #ffffff;
    }

    .hidden-block {
      display: none !important;
    }
    
    body.${CLASS_NAMES.INITIALIZING} ${SELECTORS.LEFT_PANEL},
    body.${CLASS_NAMES.INITIALIZING} ${SELECTORS.CONTENT} {
      transition: none !important;
    }

    ._1rDh5rXSFZJOqCa4UpnI4z {
      transition: border-radius 0.3s ease !important;
    }
  `;

  const STATE_KEY = "steamPanelCollapsed";
  const MAX_ATTEMPTS = 15;
  const RETRY_DELAY = 200;

  const log = (message, isError = false) => {
    console[isError ? "error" : "log"](`[Millennium] ${message}`);
  };

  // Глобальные ссылки
  let styleElement = null;
  let observer = null;
  let currentToggleButton = null;

  // Инициализация стилей
  const initStyles = () => {
    if (!styleElement) {
      styleElement = Object.assign(document.createElement("style"), { textContent: STYLES });
      document.head.append(styleElement);
    }
  };

  // Ожидание элемента с ретраями
  const waitForElement = (selector) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) return resolve(element);
        
        if (++attempts > MAX_ATTEMPTS) {
          return reject(new Error(`Element not found: ${selector}`));
        }
        
        setTimeout(checkElement, RETRY_DELAY);
      };
      
      checkElement();
    });
  };

  // Создание кнопки переключения
  const createToggleButton = () => {
    const button = document.createElement("button");
    button.className = "panel-list-icon";
    button.setAttribute("aria-label", "Toggle sidebar");
    return button;
  };

  // Обновление UI при изменении состояния
  const updateUIState = ({ leftPanel, content, main, targetBlock, borderElement }, isCollapsed) => {
    // Панели и контент
    leftPanel?.classList.toggle(CLASS_NAMES.COLLAPSED, isCollapsed);
    content?.classList.toggle(CLASS_NAMES.EXPANDED, isCollapsed);
    
    // Главный контейнер
    if (main) {
      main.style.justifyContent = isCollapsed ? "center" : "flex-start";
    }
    
    // Целевой блок
    targetBlock?.classList.toggle("hidden-block", isCollapsed);
    
    // Скругление углов
    if (borderElement) {
      borderElement.style.borderTopLeftRadius = isCollapsed ? "6px" : "";
    }
    
    // Сохранение состояния
    localStorage.setItem(STATE_KEY, String(isCollapsed));
    
    return isCollapsed ? 
      '<span class="material-symbols-rounded">left_panel_open</span>' : 
      '<span class="material-symbols-rounded">left_panel_close</span>';
  };

  // Инициализация переключателя
  const initToggleButton = (elements) => {
    const isCollapsed = localStorage.getItem(STATE_KEY) === "true";
    
    // Временное отключение переходов
    elements.leftPanel.classList.add(CLASS_NAMES.NO_TRANSITION);
    elements.content.classList.add(CLASS_NAMES.NO_TRANSITION);
    
    // Начальное состояние
    currentToggleButton.innerHTML = updateUIState(elements, isCollapsed);
    currentToggleButton.classList.toggle("collapsed", isCollapsed);
    
    // Восстановление переходов
    setTimeout(() => {
      elements.leftPanel.classList.remove(CLASS_NAMES.NO_TRANSITION);
      elements.content.classList.remove(CLASS_NAMES.NO_TRANSITION);
    }, 50);
    
    // Обработчик клика
    currentToggleButton.addEventListener("click", () => {
      const newState = !elements.leftPanel.classList.contains(CLASS_NAMES.COLLAPSED);
      currentToggleButton.innerHTML = updateUIState(elements, newState);
      currentToggleButton.classList.toggle("collapsed", newState);
    });
  };

  // Основная инициализация
  const initializePanel = async () => {
    try {
      log("Initializing panel hider");
      initStyles();
      
      document.body.classList.add(CLASS_NAMES.INITIALIZING);
      
      // Ожидаем необходимые элементы
      const elements = {
        leftPanel: await waitForElement(SELECTORS.LEFT_PANEL),
        content: await waitForElement(SELECTORS.CONTENT),
        main: await waitForElement(SELECTORS.MAIN),
        headerButtons: await waitForElement(SELECTORS.HEADER_BUTTONS),
        targetBlock: await waitForElement(SELECTORS.TARGET_BLOCK).catch(() => null),
        borderElement: await waitForElement(SELECTORS.BORDER_ELEMENT).catch(() => null)
      };
      
      // Удаляем старую кнопку если есть
      currentToggleButton?.remove();
      
      // Создаем и размещаем новую кнопку
      currentToggleButton = createToggleButton();
      elements.headerButtons.prepend(currentToggleButton);
      
      // Инициализируем функционал кнопки
      initToggleButton(elements);
      log("Panel hider initialized");
      
      // Убираем класс инициализации
      setTimeout(() => {
        document.body.classList.remove(CLASS_NAMES.INITIALIZING);
      }, 100);
    } catch (error) {
      log(`Initialization failed: ${error.message}`, true);
    }
  };

  // Наблюдатель за изменениями DOM
  const setupMutationObserver = () => {
    observer?.disconnect();
    
    observer = new MutationObserver((mutations) => {
      const shouldReinitialize = mutations.some(mutation => 
        [...mutation.addedNodes].some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches(SELECTORS.HEADER_BUTTONS) || 
           node.querySelector(SELECTORS.HEADER_BUTTONS))
        )
      );
      
      if (shouldReinitialize) initializePanel();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // Инициализация модуля
  initStyles();
  initializePanel();
  setupMutationObserver();
  
  // Повторная инициализация при фокусировке окна
  window.addEventListener("focus", initializePanel);
})();