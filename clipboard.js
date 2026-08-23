(() => {
  'use strict';

  async function copyText(text, prefixLabel = 'Texto', event) {
    event?.stopPropagation?.();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast(`${prefixLabel} copiado com sucesso!`, text);
    } catch (error) {
      console.warn('Não foi possível copiar.', error);
    }
  }

  function copyCode(codigo, event) {
    return copyText(codigo, 'Código', event);
  }

  function showToast(message, highlight = '') {
    const toast = document.getElementById('toast-copy');
    const msg = document.getElementById('toast-message');
    if (!toast || !msg) return;

    msg.textContent = message;
    toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
    }, 2500);
  }

  window.AppClipboard = Object.freeze({ copyText, copyCode, showToast });
  window.showToastCustom = showToast;
})();