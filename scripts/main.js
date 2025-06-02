// Динамическая загрузка скриптов
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Загрузка всех скриптов
async function initTheme() {
  try {
    await loadScript('scripts/utils.js');
    await loadScript('scripts/features/custom-tooltips.js');
    console.log('Theme scripts loaded');
  } catch (error) {
    console.error('Script loading error:', error);
  }
}

// Запуск инициализации
document.addEventListener('DOMContentLoaded', initTheme);