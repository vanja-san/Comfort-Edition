// Загрузчик с обработкой ошибок
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const fullPath = `/skins/Comfort-Edition/${src}`;

    const script = document.createElement('script');
    script.src = fullPath;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initTheme() {
  try {
    await loadScript('scripts/features/library/list-games.js');
    await loadScript('scripts/features/library/what-news.js');
  } catch (error) {
    console.error('[Millennium] Ошибка загрузки:', error);
  }
}

// Асинхронный запуск
(function() {
  if (document.readyState === 'complete') {
    setTimeout(initTheme, 100);
  } else {
    window.addEventListener('load', () => setTimeout(initTheme, 100));
  }
})();