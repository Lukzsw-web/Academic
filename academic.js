(() => {
  'use strict';

  const PERIODO_COND = 'Escolha Condicionada';
  const META_COND_CRED = 12;
  const META_COND_HORAS = 180;

  const isCond = (periodo) => periodo === PERIODO_COND;
  const creditsOf = (mat) => Number(mat?.cred) || 0;
  const hoursOf = (mat) => Number(mat?.ch) || 0;

  const obrigatorias = disciplinas.filter(d => !isCond(d.periodo));
  const condicionadas = disciplinas.filter(d => isCond(d.periodo));

  const totals = Object.freeze({
    obrigatoriasDisciplinas: obrigatorias.length,
    condicionadasDisciplinas: condicionadas.length,
    obrigatoriasCreditos: obrigatorias.reduce((sum, d) => sum + creditsOf(d), 0),
    obrigatoriasHoras: obrigatorias.reduce((sum, d) => sum + hoursOf(d), 0),
    metaCondCreditos: META_COND_CRED,
    metaCondHoras: META_COND_HORAS,
    totalCreditosGraduacao: obrigatorias.reduce((sum, d) => sum + creditsOf(d), 0) + META_COND_CRED,
    totalHorasGraduacao: obrigatorias.reduce((sum, d) => sum + hoursOf(d), 0) + META_COND_HORAS
  });

  function summarize(checkedCodes = []) {
    const checked = new Set(checkedCodes);
    let obrigCreditos = 0;
    let obrigHoras = 0;
    let obrigCount = 0;
    let condCreditos = 0;
    let condHoras = 0;
    let condCount = 0;

    disciplinas.forEach(mat => {
      if (!checked.has(mat.codigo)) return;
      if (isCond(mat.periodo)) {
        condCount++;
        condCreditos += creditsOf(mat);
        condHoras += hoursOf(mat);
      } else {
        obrigCount++;
        obrigCreditos += creditsOf(mat);
        obrigHoras += hoursOf(mat);
      }
    });

    const condCreditProgress = Math.min(1, condCreditos / META_COND_CRED);
    const condHourProgress = Math.min(1, condHoras / META_COND_HORAS);
    const condProgress = Math.min(condCreditProgress, condHourProgress);
    const equivalentCredits = obrigCreditos + (META_COND_CRED * condProgress);
    const graduationPercent = Math.min(
      100,
      Math.round((equivalentCredits / totals.totalCreditosGraduacao) * 100)
    );

    return {
      obrigCount,
      obrigCreditos,
      obrigHoras,
      condCount,
      condCreditos,
      condHoras,
      totalCheckedCount: obrigCount + condCount,
      totalCreditosPossuidos: obrigCreditos + condCreditos,
      totalHorasPossuidas: obrigHoras + condHoras,
      obrigPercent: totals.obrigatoriasDisciplinas
        ? Math.round((obrigCount / totals.obrigatoriasDisciplinas) * 100)
        : 0,
      condCreditPercent: Math.min(100, Math.round((condCreditos / META_COND_CRED) * 100)),
      condHourPercent: Math.min(100, Math.round((condHoras / META_COND_HORAS) * 100)),
      condPercent: Math.min(100, Math.round(condProgress * 100)),
      condComplete: condCreditos >= META_COND_CRED && condHoras >= META_COND_HORAS,
      equivalentCredits,
      graduationPercent,
      remainingGraduationCredits: Math.max(0, totals.totalCreditosGraduacao - equivalentCredits),
      remainingGraduationHours: Math.max(0, totals.totalHorasGraduacao - (obrigHoras + Math.min(condHoras, META_COND_HORAS)))
    };
  }

  window.Academic = Object.freeze({
    PERIODO_COND,
    META_COND_CRED,
    META_COND_HORAS,
    totals,
    isCond,
    creditsOf,
    hoursOf,
    summarize
  });
})();