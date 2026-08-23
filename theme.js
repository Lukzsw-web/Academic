(() => {
  'use strict';
  const html = document.documentElement;

  function applyTheme(theme, { persist = true } = {}) {
    const isDark = theme === 'dark';
    html.classList.toggle('dark', isDark);
    html.classList.toggle('light', !isDark);
    if (persist) AppStorage.setTheme(isDark ? 'dark' : 'light');
    updateUI();
  }

  function getInitialTheme() {
    const stored = AppStorage.getTheme();
    if (stored) return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateUI() {
    const isDark = html.classList.contains('dark');
    const thumb = document.getElementById('theme-toggle-thumb');
    if (thumb) thumb.classList.toggle('is-dark', isDark);

    const label = document.getElementById('settings-theme-label');
    if (label) label.textContent = isDark ? 'Modo escuro' : 'Modo claro';

    document.getElementById('settings-theme-icon-sun')?.classList.toggle('hidden', isDark);
    document.getElementById('settings-theme-icon-moon')?.classList.toggle('hidden', !isDark);
  }

  function toggle() {
    applyTheme(html.classList.contains('dark') ? 'light' : 'dark');
  }

  function initialize() {
    applyTheme(getInitialTheme(), { persist: false });
    updateUI();
  }

  window.AppTheme = Object.freeze({ applyTheme, toggle, initialize, updateUI });
})();