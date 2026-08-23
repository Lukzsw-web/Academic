(() => {
  'use strict';

  function renderSubjectCards() {
    const periodosMap = {};
    disciplinas.forEach(d => {
      (periodosMap[d.periodo] ||= []).push(d);
    });

    const periodos = Object.keys(periodosMap).sort((a, b) => {
      if (a === Academic.PERIODO_COND) return 1;
      if (b === Academic.PERIODO_COND) return -1;
      return Number.parseInt(a, 10) - Number.parseInt(b, 10);
    });

    const container = document.getElementById('accordions-container');
    if (!container) return;
    container.replaceChildren();

    periodos.forEach((periodo, index) => {
      const wrap = document.createElement('div');
      wrap.className = 'mb-4 bg-white dark:bg-darkCard rounded-xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden';

      const details = document.createElement('details');
      details.className = 'group';
      details.dataset.periodo = periodo;
      details.open = index === 0;

      const summary = document.createElement('summary');
      summary.className =
        'flex justify-between items-center font-bold cursor-pointer list-none p-5 text-lg bg-yellow-50/50 dark:bg-darkBg hover:bg-yellow-100 dark:hover:bg-gray-800 transition-colors';
      summary.innerHTML = `<span>${AppUtils.escapeHTML(AppUtils.displayPeriod({periodo}))}</span>
        <svg class="accordion-chevron w-6 h-6 text-gray-500 dark:text-gray-400" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>`;

      if (Academic.isCond(periodo)) {
        const info = document.createElement('button');
        info.type = 'button';
        info.className = 'period-info-button';
        info.setAttribute('aria-label', 'Informações sobre Escolha Condicionada');
        info.innerHTML = 'ⓘ';
        info.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          AppModals.open('modal-cond-info', info);
        });
        summary.querySelector('span').append(' ', info);
      }

      const content = document.createElement('div');
      content.className = 'accordion-content p-5 border-t border-yellowTheme-100 dark:border-darkBorder';

      const controls = document.createElement('div');
      controls.className = 'flex gap-2 mb-4';

      const mark = document.createElement('button');
      mark.type = 'button';
      mark.className = 'flex-1 bg-yellowTheme-100 dark:bg-yellowTheme-900/40 text-yellowTheme-700 dark:text-yellowTheme-300 py-2 rounded-lg text-sm font-bold hover:bg-yellowTheme-200 transition';
      mark.textContent = 'Marcar Tudo';
      mark.addEventListener('click', () => Dashboard.marcarTudo(periodo));

      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'flex-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition';
      clear.textContent = 'Limpar Tudo';
      clear.addEventListener('click', () => Dashboard.limparTudo(periodo));

      controls.append(mark, clear);
      content.appendChild(controls);

      periodosMap[periodo].forEach(m => {
        const label = document.createElement('label');
        label.id = `card-${m.codigo}`;
        label.className = 'subject-card status-default flex items-center p-4 mb-2 rounded-lg cursor-pointer no-select';
        label.dataset.periodo = periodo;
        label.dataset.search = AppUtils.buildSearchIndex(m);
        label.dataset.longpressCode = m.codigo;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'subject-check form-checkbox h-5 w-5 text-yellowTheme-600 rounded mr-4 focus:ring-yellowTheme-500';
        checkbox.value = m.codigo;
        checkbox.dataset.periodo = periodo;
        checkbox.setAttribute('aria-label', `Marcar ${AppUtils.formatName(m)} como concluída`);

        const body = document.createElement('div');
        body.className = 'flex-1 min-w-0';

        const name = document.createElement('div');
        name.className =
          'subject-name text-gray-800 dark:text-gray-100 leading-tight mb-1 flex items-center gap-1.5 flex-wrap';
        name.append(document.createTextNode(AppUtils.formatName(m)));

        if (m.co) {
          const co = document.createElement('button');
          co.type = 'button';
          co.className = 'coreq-button';
          co.textContent = 'C';
          co.title = 'Ver co-requisito';
          co.setAttribute('aria-label', `Ver co-requisito de ${AppUtils.formatName(m)}`);
          co.addEventListener('click', event => Planner.showCoreqInfo(event, m.codigo));
          name.append(' ', co);
        }

        const meta = document.createElement('div');
        meta.className = 'subject-meta truncate flex items-center gap-1.5';
        meta.innerHTML = `<span class="font-extrabold">${AppUtils.escapeHTML(m.codigo)}</span>`;

        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className =
          'copy-code-button p-0.5 text-gray-500 dark:text-gray-300 hover:text-yellowTheme-600 dark:hover:text-yellowTheme-400';
        copy.title = 'Copiar código';
        copy.setAttribute('aria-label', `Copiar código ${m.codigo}`);
        copy.textContent = '⧉';
        copy.addEventListener('click', event => AppClipboard.copyCode(m.codigo, event));

        meta.append(' ', copy, ` • ${Academic.creditsOf(m)} créd. • ${Academic.hoursOf(m)} Horas.`);
        body.append(name, meta);
        label.append(checkbox, body);
        content.appendChild(label);

        checkbox.addEventListener('change', Dashboard.persistCheckedState);
      });

      details.append(summary, content);
      wrap.appendChild(details);
      container.appendChild(wrap);
    });

  }

  function initialize() {
    renderSubjectCards();
    Dashboard.restoreCheckedState();
    Dashboard.updateDashboard();
    Dashboard.applySelectedVisualization();
  }

  window.AppRender = Object.freeze({ renderSubjectCards, initialize });
})();