(() => {
  'use strict';

  const searchers = new Map();

  function aliasToTarget(alias) {
    const normalizedAlias = AppUtils.normalizeStr(alias);
    const target = aliasesPesquisaDisciplinas?.[normalizedAlias];
    return target ? AppUtils.compactNormalized(target) : null;
  }

  function expandSearchAliases(rawText) {
    const original = AppUtils.normalizeStr(rawText);
    if (!original) return '';

    const tokens = original.split(/\s+/).filter(Boolean);
    const expanded = tokens.map(token => {
      const target = aliasToTarget(token);
      return target || token;
    });

    return AppUtils.compactNormalized(expanded.join(' '));
  }

  function createMatcher(query) {
    return {
      raw: query,
      normalized: expandSearchAliases(query)
    };
  }

  function getMatches(query, { excludeConcluded = false } = {}) {
    const matcher = createMatcher(query);
    if (!matcher.normalized) return [];

    const concluded = excludeConcluded ? new Set(Dashboard.getConcludedCodes()) : null;
    return disciplinas.filter(m => {
      if (concluded?.has(m.codigo)) return false;
      return AppUtils.buildSearchIndex(m).includes(matcher.normalized);
    });
  }

  function renderSuggestions(box, matches, onSelect, inputId) {
    if (!box) return;
    box.replaceChildren();

    matches.slice(0, 5).forEach((m, index) => {
      const option = document.createElement('div');
      option.className = 'search-suggestion';
      option.setAttribute('role', 'option');
      option.setAttribute('tabindex', '-1');
      option.dataset.index = String(index);
      option.dataset.codigo = m.codigo;
      option.setAttribute('aria-selected', index === 0 ? 'true' : 'false');

      const main = document.createElement('div');
      main.className = 'search-suggestion-main';

      const name = document.createElement('div');
      name.className = 'search-suggestion-name';
      name.textContent = AppUtils.formatName(m);

      const meta = document.createElement('div');
      meta.className = 'search-suggestion-meta';
      meta.textContent = `${m.codigo} • ${AppUtils.displayPeriod(m)}`;

      main.append(name, meta);
      option.appendChild(main);

      option.addEventListener('mousedown', e => e.preventDefault());
      option.addEventListener('click', () => onSelect(m.codigo));
      option.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(m.codigo);
        }
      });
      box.appendChild(option);
    });

    box.classList.toggle('hidden', matches.length === 0);
    const input = document.getElementById(inputId);
    if (input) input.setAttribute('aria-expanded', String(matches.length > 0));
  }

  function updateSuggestionFocus(box, direction) {
    const options = [...box.querySelectorAll('[role="option"]')];
    if (!options.length) return;
    const current = options.findIndex(o => o.getAttribute('aria-selected') === 'true');
    const next = current < 0 ? (direction > 0 ? 0 : options.length - 1)
      : (current + direction + options.length) % options.length;

    options.forEach((option, index) => {
      const active = index === next;
      option.setAttribute('aria-selected', String(active));
      if (active) option.scrollIntoView({ block: 'nearest' });
    });
  }

  function getFocusedIndex(box) {
    const options = [...box.querySelectorAll('[role="option"]')];
    return options.findIndex(o => o.getAttribute('aria-selected') === 'true');
  }

  function selectFocused(box, onSelect) {
    const options = [...box.querySelectorAll('[role="option"]')];
    const index = getFocusedIndex(box);
    if (index >= 0) onSelect(options[index].dataset.codigo);
  }

  function setup({ inputId, clearId, buttonId, boxId, excludeConcluded, onSearch, onSelect }) {
    const input = document.getElementById(inputId);
    const clear = document.getElementById(clearId);
    const button = document.getElementById(buttonId);
    const box = document.getElementById(boxId);
    if (!input || !clear || !box) return;

    const state = { matches: [] };
    searchers.set(inputId, state);

    const update = () => {
      const query = input.value;
      clear.classList.toggle('hidden', query.trim().length === 0);
      state.matches = getMatches(query, { excludeConcluded });
      renderSuggestions(box, state.matches, onSelect, inputId);
      onSearch(query);
    };

    input.addEventListener('input', update);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        if (!box.classList.contains('hidden')) {
          e.preventDefault();
          updateSuggestionFocus(box, 1);
        }
      } else if (e.key === 'ArrowUp') {
        if (!box.classList.contains('hidden')) {
          e.preventDefault();
          updateSuggestionFocus(box, -1);
        }
      } else if (e.key === 'Enter') {
        if (!box.classList.contains('hidden') && box.children.length) {
          e.preventDefault();
          selectFocused(box, onSelect);
        }
      } else if (e.key === 'Escape') {
        box.classList.add('hidden');
        input.setAttribute('aria-expanded', 'false');
      }
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) update();
    });

    clear.addEventListener('click', () => {
      input.value = '';
      update();
      input.focus();
    });

    button?.addEventListener('click', () => input.focus());

    return { update };
  }

  function filterMain(query) {
    const normalized = createMatcher(query).normalized;
    document.querySelectorAll('.subject-card').forEach(card => {
      const visible = !normalized || card.dataset.search.includes(normalized);
      card.hidden = !visible;
    });
  }

  function selectMain(codigo) {
    const m = AppUtils.getMaterial(codigo);
    if (!m) return;
    const input = document.getElementById('search-input');
    if (input) input.value = AppUtils.formatName(m);
    document.getElementById('search-suggestions')?.classList.add('hidden');
    input?.setAttribute('aria-expanded', 'false');
    filterMain(input?.value || '');

    const card = document.getElementById(`card-${codigo}`);
    const details = card?.closest('details');
    if (details) details.open = true;
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function filterPlanner(query) {
    Planner.render(query);
  }

  function selectPlanner(codigo) {
    const m = AppUtils.getMaterial(codigo);
    if (!m) return;
    const input = document.getElementById('planner-search-input');
    if (input) input.value = AppUtils.formatName(m);
    document.getElementById('planner-search-suggestions')?.classList.add('hidden');
    input?.setAttribute('aria-expanded', 'false');
    Planner.render(input?.value || '');
  }

  function initialize() {
    setup({
      inputId: 'search-input',
      clearId: 'clear-search-button',
      buttonId: 'search-button',
      boxId: 'search-suggestions',
      excludeConcluded: false,
      onSearch: filterMain,
      onSelect: selectMain
    });

    setup({
      inputId: 'planner-search-input',
      clearId: 'planner-clear-search-button',
      buttonId: 'planner-search-button',
      boxId: 'planner-search-suggestions',
      excludeConcluded: true,
      onSearch: filterPlanner,
      onSelect: selectPlanner
    });
  }

  window.AppSearch = Object.freeze({
    expandSearchAliases,
    createMatcher,
    getMatches,
    initialize,
    filterMain,
    filterPlanner,
    selectMain,
    selectPlanner
  });
})();