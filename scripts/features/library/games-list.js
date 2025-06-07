// features/hider-panel.js
(() => {
  "use strict";

  const CLASS_NAMES = {
    COLLAPSED: "custom-collapsed",
    EXPANDED: "custom-expanded-content",
    NO_TRANSITION: "no-transition",
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
    
    /* Добавляем общие transition для элементов */
    ${SELECTORS.LEFT_PANEL}, ${SELECTORS.CONTENT} {
      transition: all 0.3s ease !important;
    }
    
    /* Временное отключение transition */
    .${CLASS_NAMES.NO_TRANSITION} {
      transition: none !important;
    }
    
    .panel-list-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      top: 1.5px;
      left: 8px;
      cursor: pointer;
      z-index: 1000;
      position: relative;
      background: unset;
      color: #bfcbd4;
      border: none;
      transition: all 0.2s ease;
      font-size: 0;
    }

    .panel-list-icon:hover {
      color: #ffffff;
    }

    .panel-list-icon.collapsed {
      background: unset;
    }

    .hidden-block {
      display: none !important;
    }
    
    /* Защита от мигания при загрузке */
    body.steam-panel-initializing ${SELECTORS.LEFT_PANEL},
    body.steam-panel-initializing ${SELECTORS.CONTENT} {
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

  let styleElement = null;
  let observer = null;
  let currentToggleButton = null;

  const injectStyles = () => {
    if (styleElement && document.head.contains(styleElement)) return;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.textContent = STYLES;
    }
    document.head.appendChild(styleElement);
  };

  const waitForElement = async (selector, attempts = 0) => {
    const element = document.querySelector(selector);
    if (element) return element;

    if (attempts >= MAX_ATTEMPTS) {
      throw new Error(`Element ${selector} not found`);
    }

    await new Promise((r) => setTimeout(r, RETRY_DELAY));
    return waitForElement(selector, attempts + 1);
  };

  const createToggleButton = () => {
    const button = document.createElement("button");
    button.className = "panel-list-icon";
    button.setAttribute("aria-label", "Toggle sidebar");
    // Начальная иконка
    button.innerHTML = '<span class="material-symbols-rounded">left_panel_close</span>';
    return button;
  };

  const setupToggleButton = (button, leftPanel, content, main, targetBlock) => {
    const isCollapsed = localStorage.getItem(STATE_KEY) === "true";

    // Добавляем класс для плавных переходов
    leftPanel.classList.add(CLASS_NAMES.NO_TRANSITION);
    content.classList.add(CLASS_NAMES.NO_TRANSITION);

    const updateUI = (collapsed) => {
      if (leftPanel) {
        leftPanel.classList.toggle(CLASS_NAMES.COLLAPSED, collapsed);
      }

      if (content) {
        content.classList.toggle(CLASS_NAMES.EXPANDED, collapsed);
      }

      if (main) {
        main.style.justifyContent = collapsed ? "center" : "flex-start";
      }

      button.classList.toggle("collapsed", collapsed);
      localStorage.setItem(STATE_KEY, String(collapsed));

      // Изменяем иконку в зависимости от состояния
      if (collapsed) {
        button.innerHTML = '<span class="material-symbols-rounded">left_panel_open</span>';
      } else {
        button.innerHTML = '<span class="material-symbols-rounded">left_panel_close</span>';
      }

      if (targetBlock) {
        if (collapsed) {
          targetBlock.classList.add("hidden-block");
        } else {
          targetBlock.classList.remove("hidden-block");
        }
      }

      // Обработка скругления для целевого элемента
      const borderElement = document.querySelector(SELECTORS.BORDER_ELEMENT);
      if (borderElement) {
        if (collapsed) {
          borderElement.style.borderTopLeftRadius = "6px";
          borderElement.style.transition = "border-radius 0.3s ease";
        } else {
          borderElement.style.borderTopLeftRadius = "";
        }
      }
    };

    // Применяем начальное состояние без анимации
    updateUI(isCollapsed);

    // Включаем анимацию после небольшой задержки
    setTimeout(() => {
      leftPanel.classList.remove(CLASS_NAMES.NO_TRANSITION);
      content.classList.remove(CLASS_NAMES.NO_TRANSITION);
    }, 50);

    button.addEventListener("click", () => {
      const currentState = leftPanel.classList.contains(CLASS_NAMES.COLLAPSED);
      updateUI(!currentState);
    });
  };

  const initialize = async () => {
    try {
      log("Initializing panel hider");
      injectStyles();

      document.body.classList.add("steam-panel-initializing");

      const [leftPanel, content, main, headerButtons, targetBlock] =
        await Promise.all([
          waitForElement(SELECTORS.LEFT_PANEL),
          waitForElement(SELECTORS.CONTENT),
          waitForElement(SELECTORS.MAIN),
          waitForElement(SELECTORS.HEADER_BUTTONS),
          waitForElement(SELECTORS.TARGET_BLOCK).catch(() => null),
        ]);

      if (currentToggleButton && currentToggleButton.parentNode) {
        currentToggleButton.parentNode.removeChild(currentToggleButton);
      }

      currentToggleButton = createToggleButton();
      headerButtons.insertBefore(currentToggleButton, headerButtons.firstChild);

      setupToggleButton(
        currentToggleButton,
        leftPanel,
        content,
        main,
        targetBlock
      );
      log("Panel hider initialized successfully");

      if (!targetBlock) {
        log("Target block not found, hiding feature will be disabled", true);
      }

      setTimeout(() => {
        document.body.classList.remove("steam-panel-initializing");
      }, 100);
    } catch (error) {
      log(`Initialization failed: ${error.message}`, true);
    }
  };

  const setupObserver = () => {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      const needsReinit = mutations.some((mutation) => {
        return Array.from(mutation.addedNodes).some((node) => {
          return (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches(SELECTORS.HEADER_BUTTONS) ||
              node.querySelector(SELECTORS.HEADER_BUTTONS))
          );
        });
      });

      if (needsReinit) {
        initialize();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  injectStyles();
  initialize();
  setupObserver();

  window.addEventListener("focus", initialize);
})();