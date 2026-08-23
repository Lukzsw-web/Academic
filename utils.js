(() => {
  'use strict';

  const html = document.documentElement;

  function normalizeStr(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactNormalized(value = '') {
    return normalizeStr(value).replace(/\s+/g, '');
  }

  function formatName(mat) {
    const suffix = disciplinaAjustes?.[mat.codigo] || '';
    return `${mat.nome}${suffix}`;
  }

  function displayPeriod(mat) {
    return Academic.isCond(mat.periodo) ? Academic.PERIODO_COND : `${mat.periodo}º Período`;
  }

  function extractCodes(value) {
    return value ? String(value).match(/[A-Z]{3}[A-Z0-9]{3}/g) || [] : [];
  }

  function buildSearchIndex(mat) {
    return compactNormalized([
      formatName(mat),
      mat.codigo,
      displayPeriod(mat),
      `${mat.periodo} periodo`
    ].join(' '));
  }

  function getMaterial(codigo) {
    return disciplinas.find(d => d.codigo === codigo) || null;
  }

  function escapeHTML(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function isInteractiveTarget(target) {
    return Boolean(target?.closest?.(
      'button, input, select, textarea, a, summary, [role="button"], [role="option"], [contenteditable="true"]'
    ));
  }

  window.AppUtils = Object.freeze({
    normalizeStr,
    compactNormalized,
    formatName,
    displayPeriod,
    extractCodes,
    buildSearchIndex,
    getMaterial,
    escapeHTML,
    isInteractiveTarget,
    html
  });
})();