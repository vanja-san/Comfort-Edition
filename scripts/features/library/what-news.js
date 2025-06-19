function initToggleButton() {
  if (document.querySelector(".custom-news-icon")) return;

  const container = document.querySelector("._3Sb2o_mQ30IDRh0C72QUUu");
  const targetBlock = document.querySelector("._17uEBe5Ri8TMsnfELvs8-N");
  if (!container || !targetBlock) return;

  const wrapper = targetBlock.parentElement;
  if (!wrapper) return;

  // Добавляем класс-обертку для анимации
  wrapper.classList.add("_17uEBe5Ri8TMsnfELvs8-N-wrapper");

  // Создаем контейнер для анимации
  const animationContainer = document.createElement("div");
  animationContainer.className = "header-animation-container";
  wrapper.before(animationContainer);
  animationContainer.append(wrapper);

  // Добавляем ВСЕ необходимые стили
  document.head.insertAdjacentHTML(
    "beforeend",
    `
        <style>
            /* Добавляем стили для родительского контейнера */
            ._17uEBe5Ri8TMsnfELvs8-N-wrapper {
              overflow: hidden !important;
              transition: height 0.3s ease-in-out !important;
            }
            
            /* Стили для анимации скрытия/раскрытия */
            ._17uEBe5Ri8TMsnfELvs8-N {
              transition: transform 0.3s ease-in-out !important;
            }
            
            /* Стиль для скрытого состояния */
            ._17uEBe5Ri8TMsnfELvs8-N.hidden {
              transform: translateY(-100%) !important;
            }
            
            .custom-news-icon {
              position: absolute;
              background: unset;
              top: 10px;
              left: 48px;
              z-index: 1001;
              color: #8b929a;
              border: none;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 0;
              transition: all 0.2s ease;
            }
            
            .custom-news-icon.collapsed {
              background: unset;
            }
            
            /* Контейнер для анимации */
            .header-animation-container {
              overflow: hidden !important;
              transition: height 0.3s ease-in-out !important;
            }
            
            .custom-news-icon .material-symbols-rounded {
              transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .custom-news-icon:hover .material-symbols-rounded {
              color: #fff;
            }
        </style>
    `
  );

  const storageKey = "newsPanelCollapsedState";
  const isCollapsed = localStorage.getItem(storageKey) === "true";
  const toggleBtn = document.createElement("button");

  toggleBtn.className = "custom-news-icon";
  toggleBtn.setAttribute("aria-label", "Toggle What News");
  toggleBtn.innerHTML = isCollapsed
    ? '<span class="material-symbols-rounded">top_panel_open</span>'
    : '<span class="material-symbols-rounded">top_panel_close</span>';

  container.style.position = "relative";
  container.append(toggleBtn);

  if (isCollapsed) {
    toggleBtn.classList.add("collapsed");
    animationContainer.style.height = "0";
  } else {
    // Инициализируем высоту после рендера
    requestAnimationFrame(() => {
      animationContainer.style.height = `${wrapper.offsetHeight}px`;
    });
  }

  // Общая функция для обновления высоты
  const updateHeight = () => {
    if (!toggleBtn.classList.contains("collapsed")) {
      animationContainer.style.height = `${wrapper.offsetHeight}px`;
    }
  };

  // Обработчик переключения
  toggleBtn.addEventListener("click", () => {
    const wasCollapsed = toggleBtn.classList.toggle("collapsed");

    if (wasCollapsed) {
      animationContainer.style.height = "0";
      toggleBtn.innerHTML =
        '<span class="material-symbols-rounded">top_panel_open</span>';
    } else {
      toggleBtn.innerHTML =
        '<span class="material-symbols-rounded">top_panel_close</span>';
      animationContainer.style.height = `${wrapper.offsetHeight}px`;
    }

    localStorage.setItem(storageKey, wasCollapsed.toString());
  });

  // Общий обработчик изменений
  const handleChanges = () => {
    if (!toggleBtn.classList.contains("collapsed")) {
      animationContainer.style.height = "auto";
      requestAnimationFrame(() => {
        animationContainer.style.height = `${wrapper.offsetHeight}px`;
      });
    }
  };

  // Наблюдатели
  const resizeObserver = new ResizeObserver(handleChanges);
  resizeObserver.observe(wrapper);

  const mutationObserver = new MutationObserver(handleChanges);
  mutationObserver.observe(wrapper, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// Инициализация с защитой от дублирования
function safeInit() {
  if (
    !document.querySelector(".custom-news-icon") &&
    document.querySelector("._17uEBe5Ri8TMsnfELvs8-N")
  ) {
    initToggleButton();
  }
}

// Управление SPA-навигацией
const handleNavigation = () => requestAnimationFrame(safeInit);

// Основная инициализация
window.addEventListener("load", () => {
  requestAnimationFrame(safeInit);
});

// Глобальные наблюдатели
new MutationObserver(safeInit).observe(document.body, {
  childList: true,
  subtree: true,
});

// SPA обработчики
["popstate", "pushstate", "replacestate"].forEach((event) => {
  window.addEventListener(event, handleNavigation);
});

// Патчинг History API
const patchHistoryMethod = (method) => {
  const original = history[method];
  history[method] = function () {
    const result = original.apply(this, arguments);
    window.dispatchEvent(new Event(method.toLowerCase()));
    return result;
  };
};

patchHistoryMethod("pushState");
patchHistoryMethod("replaceState");
