(() => {
  'use strict';

  function getConcludedCodes() {
    return [...document.querySelectorAll('.subject-card input.subject-check[type="checkbox"]:checked')]
      .map(cb => cb.value);
  }

  function showSaveStatus() {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.classList.remove('opacity-0');
    clearTimeout(showSaveStatus.timer);
    showSaveStatus.timer = setTimeout(() => el.classList.add('opacity-0'), 1600);
  }

  function persistCheckedState() {
    AppStorage.setChecked(getConcludedCodes());
    showSaveStatus();
    updateDashboard();
    applySelectedVisualization();
  }

  function restoreCheckedState() {
    const stored = new Set(AppStorage.getChecked());
    document.querySelectorAll('.subject-card input.subject-check[type="checkbox"]').forEach(cb => {
      cb.checked = stored.has(cb.value);
    });
  }

  function setProgress(id, percent) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function updateDashboard() {
    const metrics = Academic.summarize(getConcludedCodes());

    document.getElementById('count-obrig-feitas-painel').textContent = metrics.obrigCount;
    document.getElementById('count-obrig-total-painel').textContent = Academic.totals.obrigatoriasDisciplinas;
    document.getElementById('count-obrig-feitas').textContent = metrics.obrigCount;
    document.getElementById('count-obrig-faltam').textContent =
      Math.max(0, Academic.totals.obrigatoriasDisciplinas - metrics.obrigCount);
    document.getElementById('percent-obrig').textContent = `${metrics.obrigPercent}%`;
    setProgress('bar-obrig', metrics.obrigPercent);

    document.getElementById('count-cond-feitas').textContent = metrics.condCount;
    document.getElementById('count-cond-faltam').textContent =
      Math.max(0, Academic.totals.condicionadasDisciplinas - metrics.condCount);
    document.getElementById('text-cond-progress').textContent =
      `${metrics.condCreditos} créd. • ${metrics.condHoras}h`;
    setProgress('bar-cond', metrics.condPercent);

    document.getElementById('text-cond-meta').textContent =
      `Meta: ${Academic.totals.metaCondCreditos} créd. / ${Academic.totals.metaCondHoras}h`;
    document.getElementById('text-cond-meta').classList.toggle('hidden', metrics.condComplete);
    document.getElementById('icon-cond-exclamation').classList.toggle('hidden', !metrics.condComplete);

    document.getElementById('percent-total').textContent = `${metrics.graduationPercent}%`;
    document.getElementById('total-creditos').textContent = metrics.totalCreditosPossuidos;
    document.getElementById('total-horas').textContent = metrics.totalHorasPossuidas;

    const creditTarget = document.getElementById('total-creditos-meta');
    const hoursTarget = document.getElementById('total-horas-meta');
    if (creditTarget) creditTarget.textContent = Academic.totals.totalCreditosGraduacao;
    if (hoursTarget) hoursTarget.textContent = Academic.totals.totalHorasGraduacao;

    return metrics;
  }

  function applyCardStatus(card, status) {
    if (!card) return;
    card.classList.remove('status-default', 'status-passed', 'status-eligible', 'status-blocked');
    card.classList.add(`status-${status}`);
  }

  function isEligible(m, concluded) {
    const preOK = AppUtils.extractCodes(m.pre).every(c => concluded.includes(c));
    const coOK = AppUtils.extractCodes(m.co).every(c => concluded.includes(c));
    return preOK && coOK;
  }

  function applySelectedVisualization(concluded = getConcludedCodes()) {
    disciplinas.forEach(m => {
      const card = document.getElementById(`card-${m.codigo}`);
      if (!card) return;
      applyCardStatus(
        card,
        concluded.includes(m.codigo)
          ? 'passed'
          : isEligible(m, concluded)
            ? 'eligible'
            : 'blocked'
      );
    });
  }

  function clearDisciplineData() {
    const hasAny = getConcludedCodes().length || AppStorage.getPlannerChecked().length;
    if (!hasAny) return;
    if (!confirm('Tem certeza que deseja desmarcar todas as disciplinas e limpar o planejamento?')) return;

    AppStorage.clearDisciplineState();
    document.querySelectorAll('.subject-card input.subject-check[type="checkbox"]')
      .forEach(cb => { cb.checked = false; });

    Planner.refresh();
    updateDashboard();
    applySelectedVisualization([]);
    showSaveStatus();
  }

  function marcarTudo(periodo) {
    if (Academic.isCond(periodo) &&
        !confirm('Tem certeza que deseja marcar todas de Escolha Condicionada?')) return;

    document.querySelectorAll(`.subject-card input.subject-check[data-periodo="${CSS.escape(periodo)}"]`)
      .forEach(cb => { cb.checked = true; });

    persistCheckedState();
  }

  function limparTudo(periodo) {
    document.querySelectorAll(`.subject-card input.subject-check[data-periodo="${CSS.escape(periodo)}"]`)
      .forEach(cb => { cb.checked = false; });

    persistCheckedState();
  }

  window.Dashboard = Object.freeze({
    getConcludedCodes,
    persistCheckedState,
    restoreCheckedState,
    updateDashboard,
    applySelectedVisualization,
    clearDisciplineData,
    marcarTudo,
    limparTudo
  });
})();