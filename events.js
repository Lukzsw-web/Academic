(() => {
  'use strict';

  function bindGlobalActions() {
    document.getElementById('settings-button')?.addEventListener('click', event =>
      AppModals.open('modal-settings', event.currentTarget));

    document.getElementById('info-button')?.addEventListener('click', event =>
      AppModals.open('modal-info', event.currentTarget));

    document.getElementById('theme-toggle')?.addEventListener('click', AppTheme.toggle);
    document.getElementById('clear-all-button')?.addEventListener('click', Dashboard.clearDisciplineData);
    document.getElementById('pdf-button')?.addEventListener('click', AppPDF.exportPDF);

    document.querySelectorAll('[data-modal-open]').forEach(button => {
      button.addEventListener('click', () => AppModals.open(button.dataset.modalOpen, button));
    });

    document.querySelectorAll('[data-modal-close]').forEach(button => {
      button.addEventListener('click', () => AppModals.close(button.dataset.modalClose));
    });

    document.querySelectorAll('[data-copy-email]').forEach(button => {
      button.addEventListener('click', event =>
        AppClipboard.copyText(button.dataset.copyEmail, 'E-mail', event));
    });

    document.addEventListener('click', event => {
      const main = document.getElementById('search-wrapper');
      const planner = document.getElementById('planner-search-wrapper');
      if (main && !main.contains(event.target)) {
        document.getElementById('search-suggestions')?.classList.add('hidden');
      }
      if (planner && !planner.contains(event.target)) {
        document.getElementById('planner-search-suggestions')?.classList.add('hidden');
      }
    });
  }

  function registerLongPressForSubjects() {
    document.querySelectorAll('.subject-card[data-longpress-code]').forEach(card => {
      if (card.dataset.longpressBound === 'true') return;
      card.dataset.longpressBound = 'true';

      let timer = null;
      let pointerId = null;

      const cancel = event => {
        if (event && pointerId !== null && event.pointerId !== pointerId) return;
        if (timer) clearTimeout(timer);
        timer = null;
        pointerId = null;
      };

      card.addEventListener('pointerdown', event => {
        if (AppUtils.isInteractiveTarget(event.target)) return;
        cancel();
        pointerId = event.pointerId;
        timer = setTimeout(() => {
          timer = null;
          const m = AppUtils.getMaterial(card.dataset.longpressCode);
          if (!m) return;

          const concluded = Dashboard.getConcludedCodes();
          document.getElementById('det-nome').textContent = AppUtils.formatName(m);
          document.getElementById('det-cod').textContent = m.codigo;
          document.getElementById('det-per').textContent = AppUtils.displayPeriod(m);
          document.getElementById('det-cred').textContent = Academic.creditsOf(m);
          document.getElementById('det-ch').textContent = `${Academic.hoursOf(m)} Horas`;

          const pre = document.getElementById('det-pre');
          const co = document.getElementById('det-co');
          const renderReqs = req => {
            if (!req) return 'Nenhum';
            return AppUtils.extractCodes(req).map(code => {
              const mat = AppUtils.getMaterial(code);
              return `${mat ? AppUtils.formatName(mat) : code}${mat && !Academic.isCond(mat.periodo) ? ` (${AppUtils.displayPeriod(mat)})` : ''}${concluded.includes(code) ? ' ✓' : ''}`;
            }).join('\n');
          };
          pre.textContent = renderReqs(m.pre);
          co.textContent = renderReqs(m.co);

          const copy = document.getElementById('det-copy-btn');
          if (copy) {
            copy.onclick = event => AppClipboard.copyCode(m.codigo, event);
            copy.setAttribute('aria-label', `Copiar código ${m.codigo}`);
          }

          AppModals.open('modal-details');
        }, 600);
      });

      ['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
        card.addEventListener(type, cancel));
      card.addEventListener('pointermove', event => {
        if (event.pressure === 0) cancel(event);
      });
    });
  }

  function initialize() {
    bindGlobalActions();
    registerLongPressForSubjects();
  }

  window.AppEvents = Object.freeze({ initialize, registerLongPressForSubjects });
})();