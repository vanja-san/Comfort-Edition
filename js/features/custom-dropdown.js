// Находим выпадающее меню
const menu = document.querySelector('.PP7LM0Ow1K5qkR8WElLpt');

if (menu) {
  // Применяем стили для смещения
  menu.style.top = '40px';
  menu.style.left = '60px';
  menu.style.maxHeight = 'none';
  
  // Разрешаем переполнение
  const container = document.querySelector('._3Knd7Am6tTwTTu605YN4IX');
  if (container) {
    container.style.overflow = 'visible';
  }
}