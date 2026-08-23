(() => {
  'use strict';

  let longPressTimer = null;
  let longPressPointerId = null;
  let longPressTarget = null;

  function getAffectedSubjects(codigo) {
    const prerequisiteLocks = [];
    const corequisiteRelations = [];

    disciplinas.forEach(m => {
      if (AppUtils.extractCodes(m.pre).includes(codigo)) prerequisiteLocks.push(m);
      if (AppUtils.extractCodes(m.co).includes(codigo)) corequisiteRelations.push(m);
    });

    const sortByPeriod = (a, b) => {
      const pa = Number.parseInt(a.periodo, 10) || 99;
      const pb = Number.parseInt(b.periodo, 10) || 99;
      return pa - pb;
    };

    prerequisiteLocks.sort(sortByPeriod);
    corequisiteRelations.sort(sortByPeriod);

    return { prerequisiteLocks, corequisiteRelations };
  }

  function isAvailable(m, concluded, planned) {
    const preOK = AppUtils.extractCodes(m.pre).every(c => concluded.includes(c));
    const coOK = AppUtils.extractCodes(m.co)
      .every(c => concluded.includes(c) || planned.includes(c));
    return preOK && coOK;
  }

  function getStateVisual(m, concluded, planned) {
    if (concluded.includes(m.codigo)) return 'passed';
    return isAvailable(m, concluded, planned) ? 'eligible' : 'blocked';
  }

  function togglePlannerCheck(event, codigo) {
    event.stopPropagation();
    const input = event.currentTarget;
    const current = AppStorage.getPlannerChecked();
    const next = input.checked
      ? [...new Set([...current, codigo])]
      : current.filter(c => c !== codigo);

    AppStorage.setPlannerChecked(next);
    syncPlannerCard(codigo, input.checked);
  }

  function syncPlannerCard(codigo, checked) {
    const card = document.getElementById(`planner-card-${codigo}`);
    const text = document.getElementById(`planner-text-${codigo}`);
    card?.classList.toggle('is-planned', checked);
    text?.classList.toggle('line-through', checked);
    text?.classList.toggle('opacity-60', checked);
  }

  function showCoreqInfo(event, codigo) {
    event?.stopPropagation();
    const m = AppUtils.getMaterial(codigo);
    if (!m || !m.co) return;

    const coNames = AppUtils.extractCodes(m.co).map(c => {
      const mat = AppUtils.getMaterial(c);
      return AppUtils.escapeHTML(mat ? AppUtils.formatName(mat) : c);
    });

    const title = document.getElementById('coreq-title');
    const desc = document.getElementById('coreq-desc');
    if (title) title.textContent = AppUtils.formatName(m);
    if (desc) {
      desc.textContent =
        `Essa matéria possui ${coNames.join(', ')} como co-requisito, ou seja, ` +
        'devem ser cursadas simultaneamente no mesmo período.';
    }

    AppModals.open('modal-coreq', event?.currentTarget || null);
  }

  function buildLocksHTML(m) {
    const affected = getAffectedSubjects(m.codigo);
    const parts = [];

    if (affected.prerequisiteLocks.length) {
      parts.push(
        `<p class="locks-section-title">Tranca por pré-requisito</p>` +
        affected.prerequisiteLocks.map(t =>
          `<div class="lock-item"><span>${AppUtils.escapeHTML(AppUtils.formatName(t))}</span>` +
          `<span>${AppUtils.escapeHTML(AppUtils.displayPeriod(t))}</span></div>`).join('')
      );
    }

    if (affected.corequisiteRelations.length) {
      parts.push(
        `<p class="locks-section-title">Relacionada por correquisito</p>` +
        affected.corequisiteRelations.map(t =>
          `<div class="lock-item"><span>${AppUtils.escapeHTML(AppUtils.formatName(t))}</span>` +
          `<span>${AppUtils.escapeHTML(AppUtils.displayPeriod(t))}</span></div>`).join('')
      );
    }

    if (!parts.length) {
      return '<p class="text-gray-500 text-center font-medium">Não afeta nenhuma disciplina cadastrada.</p>';
    }

    return parts.join('');
  }

  function showLocks(codigo) {
    const m = AppUtils.getMaterial(codigo);
    if (!m) return;

    const affected = getAffectedSubjects(codigo);
    const desc = document.getElementById('locks-desc');
    const list = document.getElementById('locks-list');
    const title = document.getElementById('locks-title');

    if (title) title.textContent = AppUtils.formatName(m);
    if (desc) {
      desc.textContent =
        `${affected.prerequisiteLocks.length} tranca por pré-requisito • ` +
        `${affected.corequisiteRelations.length} relação de correquisito`;
    }
    if (list) list.innerHTML = buildLocksHTML(m);
    AppModals.open('modal-locks');
  }

  function beginLongPress(event, codigo) {
    if (!event || AppUtils.isInteractiveTarget(event.target)) return;
    cancelLongPress();

    longPressPointerId = event.pointerId;
    longPressTarget = event.currentTarget;
    longPressTimer = window.setTimeout(() => {
      longPressTimer = null;
      showLocks(codigo);
    }, 550);
  }

  function cancelLongPress(event) {
    if (event && longPressPointerId !== null && event.pointerId !== longPressPointerId) return;
    if (longPressTimer) window.clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressPointerId = null;
    longPressTarget = null;
  }

  function bindLongPress(scope = document) {
    scope.querySelectorAll('[data-longpress-code]').forEach(card => {
      if (card.dataset.longpressBound === 'true') return;
      card.dataset.longpressBound = 'true';

      card.addEventListener('pointerdown', event => beginLongPress(event, card.dataset.longpressCode));
      card.addEventListener('pointerup', cancelLongPress);
      card.addEventListener('pointercancel', cancelLongPress);
      card.addEventListener('pointerleave', cancelLongPress);
      card.addEventListener('pointermove', event => {
        if (longPressTarget === card && event.pressure === 0) cancelLongPress(event);
      });
    });
  }

  function render(query = '') {
    const container = document.getElementById('planner-list');
    if (!container) return;

    const concluded = Dashboard.getConcludedCodes();
    const planned = AppStorage.getPlannerChecked();
    const normalized = AppSearch.createMatcher(query).normalized;

    const eligible = disciplinas.filter(m => {
      if (concluded.includes(m.codigo)) return false;
      if (normalized) return AppUtils.buildSearchIndex(m).includes(normalized);
      return isAvailable(m, concluded, planned);
    });

    if (!eligible.length) {
      container.innerHTML =
        '<p class="text-center text-gray-500 py-6 font-medium">Nenhuma disciplina encontrada.</p>';
      return;
    }

    const obrigatorias = eligible.filter(m => !Academic.isCond(m.periodo));
    const condicionadas = eligible.filter(m => Academic.isCond(m.periodo));

    const renderItems = items => items.map(m => {
      const affected = getAffectedSubjects(m.codigo);
      const plannerChecked = planned.includes(m.codigo);
      const coButton = m.co
        ? `<button type="button" class="planner-coreq-button" data-coreq-code="${m.codigo}" ` +
          `title="Ver co-requisito" aria-label="Ver co-requisito de ${AppUtils.escapeHTML(AppUtils.formatName(m))}">C</button>`
        : '';

      const lockText = affected.prerequisiteLocks.length || affected.corequisiteRelations.length
        ? `${affected.prerequisiteLocks.length} pré • ${affected.corequisiteRelations.length} co`
        : 'Nenhuma relação';

      return `
        <div id="planner-card-${m.codigo}"
             class="planner-subject-card ${plannerChecked ? 'is-planned' : ''}"
             data-longpress-code="${m.codigo}"
             role="article">
          <div class="planner-subject-row">
            <input type="checkbox"
                   value="${m.codigo}"
                   data-planner-code="${m.codigo}"
                   ${plannerChecked ? 'checked' : ''}
                   class="planner-check h-5 w-5 rounded border-gray-300 text-yellowTheme-600 focus:ring-yellowTheme-500"
                   aria-label="Planejar ${AppUtils.escapeHTML(AppUtils.formatName(m))}">
            <div class="flex-1 min-w-0 transition-all" id="planner-text-${m.codigo}">
              <div class="font-bold text-yellowTheme-800 dark:text-yellowTheme-300 flex items-start justify-between gap-2">
                <span class="flex items-center flex-wrap gap-1.5 min-w-0">
                  ${AppUtils.escapeHTML(AppUtils.formatName(m))} ${coButton}
                </span>
                <button type="button" data-copy-code="${m.codigo}" title="Copiar código"
                        aria-label="Copiar código ${m.codigo}"
                        class="copy-code-button p-1 text-gray-400 hover:text-yellowTheme-600 dark:hover:text-yellowTheme-400">
                  <span aria-hidden="true">⧉</span>
                </button>
              </div>
              <div class="text-xs text-yellowTheme-600 dark:text-yellowTheme-400 mt-0.5">
                <span class="font-bold">${AppUtils.escapeHTML(m.codigo)}</span> • ${AppUtils.escapeHTML(AppUtils.displayPeriod(m))}
              </div>
              <div class="text-xs font-semibold text-red-500 mt-1">
                ${AppUtils.escapeHTML(lockText)}
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    let html = '';

    if (obrigatorias.length) {
      html += `<details class="group mb-3" open>
        <summary class="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-darkBorder text-gray-800 dark:text-gray-100">
          Disciplinas Obrigatórias (${obrigatorias.length})
          <svg class="accordion-chevron w-5 h-5 text-gray-500" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </summary>
        <div class="pt-3 space-y-3 pb-1">${renderItems(obrigatorias)}</div>
      </details>`;
    }

    if (condicionadas.length) {
      html += `<details class="group mb-3">
        <summary class="flex justify-between items-center font-bold cursor-pointer list-none p-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-darkBorder text-gray-800 dark:text-gray-100">
          Escolha Condicionada (${condicionadas.length})
          <svg class="accordion-chevron w-5 h-5 text-gray-500" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
        </summary>
        <div class="pt-3 space-y-3 pb-1">${renderItems(condicionadas)}</div>
      </details>`;
    }

    container.innerHTML = html;
    bindLongPress(container);

    container.querySelectorAll('[data-planner-code]').forEach(input => {
      input.addEventListener('change', event => togglePlannerCheck(event, input.dataset.plannerCode));
    });

    container.querySelectorAll('[data-copy-code]').forEach(button => {
      button.addEventListener('click', event =>
        AppClipboard.copyCode(button.dataset.copyCode, event));
    });

    container.querySelectorAll('[data-coreq-code]').forEach(button => {
      button.addEventListener('click', event =>
        showCoreqInfo(event, button.dataset.coreqCode));
    });
  }

  function refresh() {
    const input = document.getElementById('planner-search-input');
    render(input?.value || '');
  }

  window.Planner = Object.freeze({
    render,
    refresh,
    showCoreqInfo,
    showLocks,
    getAffectedSubjects,
    isAvailable,
    bindLongPress,
    togglePlannerCheck
  });
})();