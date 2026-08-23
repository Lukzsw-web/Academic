(() => {
  'use strict';

  const LEGACY_KEYS = {
    checked: 'farma_checked_v4',
    plannerChecked: 'planner_checked_v1',
    theme: 'theme'
  };

  const STORAGE_KEYS = Object.freeze({
    state: 'planejador:state:v1',
    theme: 'planejador:theme:v1'
  });

  const STORAGE_VERSION = 1;
  let cachedState = null;

  function cloneState(state) {
    return {
      version: STORAGE_VERSION,
      checked: Array.isArray(state?.checked) ? [...new Set(state.checked.map(String))] : [],
      plannerChecked: Array.isArray(state?.plannerChecked) ? [...new Set(state.plannerChecked.map(String))] : []
    };
  }

  function safeParse(raw, fallback) {
    try {
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function readState() {
    if (cachedState) return cloneState(cachedState);

    const modernRaw = localStorage.getItem(STORAGE_KEYS.state);
    const modern = safeParse(modernRaw, null);

    if (modern && modern.version === STORAGE_VERSION) {
      cachedState = cloneState(modern);
      return cloneState(cachedState);
    }

    const legacy = {
      checked: safeParse(localStorage.getItem(LEGACY_KEYS.checked), []),
      plannerChecked: safeParse(localStorage.getItem(LEGACY_KEYS.plannerChecked), [])
    };

    cachedState = cloneState(legacy);
    persistState(cachedState);

    return cloneState(cachedState);
  }

  function persistState(state) {
    const next = cloneState(state);
    next.version = STORAGE_VERSION;
    cachedState = next;
    try {
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(next));
      return true;
    } catch (error) {
      console.warn('Não foi possível salvar o estado local do aplicativo.', error);
      return false;
    }
  }

  function getState() {
    return readState();
  }

  function updateState(patch) {
    const next = { ...readState(), ...patch };
    return persistState(next);
  }

  function getChecked() {
    return readState().checked;
  }

  function setChecked(codes) {
    return updateState({ checked: codes });
  }

  function getPlannerChecked() {
    return readState().plannerChecked;
  }

  function setPlannerChecked(codes) {
    return updateState({ plannerChecked: codes });
  }

  function getTheme() {
    const modern = localStorage.getItem(STORAGE_KEYS.theme);
    if (modern === 'dark' || modern === 'light') return modern;

    const legacy = localStorage.getItem(LEGACY_KEYS.theme);
    if (legacy === 'dark' || legacy === 'light') {
      try { localStorage.setItem(STORAGE_KEYS.theme, legacy); } catch {}
      return legacy;
    }

    return null;
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    try { localStorage.setItem(STORAGE_KEYS.theme, theme); } catch {}
  }

  function clearDisciplineState() {
    return persistState({ version: STORAGE_VERSION, checked: [], plannerChecked: [] });
  }

  window.AppStorage = Object.freeze({
    STORAGE_KEYS,
    STORAGE_VERSION,
    getState,
    updateState,
    getChecked,
    setChecked,
    getPlannerChecked,
    setPlannerChecked,
    getTheme,
    setTheme,
    clearDisciplineState
  });
})();