(() => {
  'use strict';

  function updateStaticTargets() {
    const creditTarget = document.getElementById('total-creditos-meta');
    const hourTarget = document.getElementById('total-horas-meta');
    if (creditTarget) creditTarget.textContent = Academic.totals.totalCreditosGraduacao;
    if (hourTarget) hourTarget.textContent = Academic.totals.totalHorasGraduacao;

    const condMeta = document.getElementById('text-cond-meta');
    if (condMeta) {
      condMeta.textContent =
        `Meta: ${Academic.totals.metaCondCreditos} créd. / ${Academic.totals.metaCondHoras}h`;
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' })
        .catch(error => console.warn('Service worker não pôde ser registrado.', error));
    });
  }

  function initialize() {
    updateStaticTargets();
    AppTheme.initialize();
    AppModals.initialize();
    AppRender.initialize();
    AppEvents.initialize();
    AppSearch.initialize();
    registerServiceWorker();
  }

  window.openModal = AppModals.open;
  window.closeModal = AppModals.close;
  window.toggleThemeFromSettings = AppTheme.toggle;
  window.copyTextToClipboard = AppClipboard.copyText;
  window.copyCodeToClipboard = AppClipboard.copyCode;
  window.confirmarLimparSelecao = Dashboard.clearDisciplineData;
  window.compartilharGradePDF = AppPDF.exportPDF;
  window.showCoreqInfo = Planner.showCoreqInfo;
  window.togglePlannerCheck = (event, codigo) => Planner?.togglePlannerCheck?.(event, codigo);
  window.marcarTudo = Dashboard.marcarTudo;
  window.limparTudo = Dashboard.limparTudo;

  document.addEventListener('DOMContentLoaded', initialize);
})();