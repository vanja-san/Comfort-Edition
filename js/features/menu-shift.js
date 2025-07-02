(() => {
  const CONFIG = {
    selectors: {
      backButton: '._25lBLzuVeYAUG279up4xP8',
      activeClass: '_1LYTHQzcI1u6tcxbbcc5V3',
      topMenu: '._1Ky59qmywxOUtNcI1cgmkX',
      leftMenu: '._3Z3ohQ8-1NKnCZkbS6fvy',
      topHeader: '._39oUCO1OuizVPwcnnv88no'
    },
    classes: {
      shifted: 'menu-shifted'
    },
    zIndex: {
      backActive: {
        leftMenu: 1001,
        topMenu: 999
      },
      backInactive: {
        leftMenu: 999,
        topMenu: 1001
      }
    },
    retryDelay: 500,
    maxRetries: 10
  };

  class MenuShiftHandler {
    constructor() {
      this.initialized = false;
      this.observer = null;
      this.retryCount = 0;
    }

    async waitForElement(selector, timeout = 5000) {
      return new Promise((resolve) => {
        if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
          if (document.querySelector(selector)) {
            observer.disconnect();
            resolve(document.querySelector(selector));
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    }

    async waitForElements() {
      try {
        const [backButton, topMenu, leftMenu] = await Promise.all([
          this.waitForElement(CONFIG.selectors.backButton),
          this.waitForElement(CONFIG.selectors.topMenu),
          this.waitForElement(CONFIG.selectors.leftMenu)
        ]);

        return backButton && topMenu && leftMenu;
      } catch (error) {
        console.error('[Menu Shift] Error waiting for elements:', error);
        return false;
      }
    }

    injectStyles() {
      try {
        const existingStyle = document.getElementById('menu-shift-styles');
        if (existingStyle) return;

        const style = document.createElement('style');
        style.id = 'menu-shift-styles';
        style.textContent = `
          .${CONFIG.classes.shifted} {
            margin-left: 38px !important;
            transition: margin-left 0.3s ease !important;
          }
        `;
        document.head.appendChild(style);
      } catch (error) {
        console.error('[Menu Shift] Style injection failed:', error);
      }
    }

    updateMenuState() {
      try {
        const backButton = document.querySelector(CONFIG.selectors.backButton);
        const topMenu = document.querySelector(CONFIG.selectors.topMenu);
        const leftMenu = document.querySelector(CONFIG.selectors.leftMenu);
        const topHeader = document.querySelector(CONFIG.selectors.topHeader);
        
        if (!backButton || !topMenu || !leftMenu || !topHeader) {
          return false;
        }

        const isBackButtonActive = backButton.classList.contains(CONFIG.selectors.activeClass);
        
        if (isBackButtonActive) {
          topMenu.classList.add(CONFIG.classes.shifted);
          leftMenu.style.zIndex = CONFIG.zIndex.backActive.leftMenu;
          topHeader.style.zIndex = CONFIG.zIndex.backActive.topMenu;
        } else {
          topMenu.classList.remove(CONFIG.classes.shifted);
          leftMenu.style.zIndex = CONFIG.zIndex.backInactive.leftMenu;
          topHeader.style.zIndex = CONFIG.zIndex.backInactive.topMenu;
        }

        return true;
      } catch (error) {
        console.error('[Menu Shift] State update failed:', error);
        return false;
      }
    }

    setupObserver() {
      try {
        if (this.observer) {
          this.observer.disconnect();
        }

        const leftMenu = document.querySelector(CONFIG.selectors.leftMenu);
        if (!leftMenu) return false;

        this.observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                mutation.target.matches(CONFIG.selectors.backButton)) {
              this.updateMenuState();
              break;
            }
          }
        });

        this.observer.observe(leftMenu, {
          attributes: true,
          attributeFilter: ['class'],
          subtree: true
        });

        return true;
      } catch (error) {
        console.error('[Menu Shift] Observer setup failed:', error);
        return false;
      }
    }

    handleNavigation() {
      setTimeout(() => this.updateMenuState(), 100);
    }

    async initializeWhenReady() {
      if (await this.waitForElements()) {
        this.injectStyles();
        if (this.updateMenuState() && this.setupObserver()) {
          window.addEventListener('popstate', () => this.handleNavigation());

          ['pushState', 'replaceState'].forEach(eventType => {
            const original = window.history[eventType];
            window.history[eventType] = (...args) => {
              const result = original.apply(window.history, args);
              this.handleNavigation();
              return result;
            };
          });

          this.initialized = true;
          return true;
        }
      }

      if (this.retryCount < CONFIG.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.initializeWhenReady(), CONFIG.retryDelay);
      } else {
        console.error('[Menu Shift] Failed to initialize after maximum retries');
      }
    }

    init() {
      if (this.initialized) return;
      this.initializeWhenReady();
    }
  }

  const handler = new MenuShiftHandler();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => handler.init());
  } else {
    handler.init();
  }
})();