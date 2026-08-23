(() => {
  'use strict';

  const active = new Set();
  let lastFocused = null;

  function getModal(id) {
    return document.getElementById(id);
  }

  function focusable(modal) {
    return [...modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.hidden && el.offsetParent !== null);
  }

  function trapFocus(modal, event) {
    if (event.key !== 'Tab') return;
    const nodes = focusable(modal);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function open(id, opener = null) {
    const modal = getModal(id);
    if (!modal) return;

    lastFocused = opener || document.activeElement;
    active.add(id);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const first = focusable(modal)[0];
    if (first) requestAnimationFrame(() => first.focus());

    if (id === 'modal-planner') {
      const input = document.getElementById('planner-search-input');
      if (input) input.value = '';
      Planner.render('');
    }
  }

  function close(id) {
    const modal = getModal(id);
    if (!modal) return;

    active.delete(id);
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    if (!active.size) document.body.classList.remove('modal-open');

    if (!active.size && lastFocused?.focus) {
      try { lastFocused.focus(); } catch {}
      lastFocused = null;
    }
  }

  function closeTopmost() {
    const ids = [...active];
    if (ids.length) close(ids[ids.length - 1]);
  }

  function initialize() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.setAttribute('aria-hidden', 'true');
      modal.addEventListener('click', event => {
        if (event.target === modal) close(modal.id);
      });

      modal.querySelector('.modal-content')?.addEventListener('click', event => {
        event.stopPropagation();
      });

      modal.addEventListener('keydown', event => trapFocus(modal, event));
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeTopmost();
    });
  }

  window.AppModals = Object.freeze({ open, close, closeTopmost, initialize });
})();