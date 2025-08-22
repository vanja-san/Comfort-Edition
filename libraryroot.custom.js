// Загрузчик скриптов с обработкой ошибок
const loadScript = src => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = `/skins/Comfort-Edition/${src}`;
  script.onload = resolve;
  script.onerror = () => reject(`[Millennium] Ошибка загрузки: ${src}`);
  document.head.append(script);
});

// Инициализация темы
const initTheme = async () => {
  const scripts = [
    'js/library/toggle-list-games.js',
    'js/library/toggle-whats-new.js'
  ];

  for (const script of scripts) {
    try {
      await loadScript(script);
    } catch (error) {
      console.error(error);
    }
  }
};

// Асинхронный запуск с задержкой
const runWithDelay = fn => setTimeout(fn, 100);

document.readyState === 'complete'
  ? runWithDelay(initTheme)
  : window.addEventListener('load', () => runWithDelay(initTheme));