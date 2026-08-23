(() => {
  'use strict';

  function getPlannerCodes() {
    return AppStorage.getPlannerChecked();
  }

  function writeWrapped(doc, text, x, y, maxWidth, lineHeight = 5) {
    const lines = doc.splitTextToSize(String(text), maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  }

  async function exportPDF() {
    if (!window.jspdf?.jsPDF) {
      alert('O gerador de PDF ainda não está disponível. Abra o aplicativo uma vez com conexão para carregar o componente.');
      return;
    }

    const metrics = Academic.summarize(Dashboard.getConcludedCodes());
    const planned = new Set(getPlannerCodes());
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const maxWidth = pageWidth - (margin * 2);
    let y = 18;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    y = writeWrapped(doc, 'Planejador Acadêmico - Farmácia UFRJ', margin, y, maxWidth, 7) + 2;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    y = writeWrapped(
      doc,
      `Progresso: ${metrics.graduationPercent}% • Créditos: ${metrics.totalCreditosPossuidos}/${Academic.totals.totalCreditosGraduacao} • Horas: ${metrics.totalHorasPossuidas}/${Academic.totals.totalHorasGraduacao}`,
      margin, y, maxWidth, 5
    );
    y = writeWrapped(
      doc,
      `Obrigatórias: ${metrics.obrigCount}/${Academic.totals.obrigatoriasDisciplinas} • Condicionadas: ${metrics.condCount} selecionadas • Meta condicionada: ${Academic.totals.metaCondCreditos} créd./${Academic.totals.metaCondHoras}h`,
      margin, y + 1, maxWidth, 5
    );

    y += 4;
    doc.setFont(undefined, 'bold');
    doc.text('Disciplinas concluídas', margin, y);
    y += 7;
    doc.setFont(undefined, 'normal');

    const concluded = new Set(Dashboard.getConcludedCodes());
    disciplinas.forEach(m => {
      if (!concluded.has(m.codigo)) return;
      const text = `[X] ${m.codigo} - ${AppUtils.formatName(m)} (${AppUtils.displayPeriod(m)})`;
      if (y > pageHeight - 18) {
        doc.addPage();
        y = 18;
      }
      y = writeWrapped(doc, text, margin, y, maxWidth, 5) + 1;
    });

    if (planned.size) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 18;
      } else {
        y += 5;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Planejamento atual', margin, y);
      y += 7;
      doc.setFont(undefined, 'normal');

      disciplinas.filter(m => planned.has(m.codigo)).forEach(m => {
        if (y > pageHeight - 18) {
          doc.addPage();
          y = 18;
        }
        y = writeWrapped(
          doc,
          `[PLANEJADA] ${m.codigo} - ${AppUtils.formatName(m)} (${AppUtils.displayPeriod(m)})`,
          margin, y, maxWidth, 5
        ) + 1;
      });
    }

    const blob = doc.output('blob');
    const file = new File([blob], 'grade-academica.pdf', { type: 'application/pdf' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Minha Grade Acadêmica',
          text: 'Confira meu progresso acadêmico.'
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    doc.save('grade-academica.pdf');
  }

  window.AppPDF = Object.freeze({ exportPDF });
})();