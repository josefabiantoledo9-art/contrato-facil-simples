import jsPDF from 'jspdf';

export function generatePDF(contractText: string, filename: string): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  const bottomMargin = 25;

  const paragraphs = contractText.split('\n\n');
  let y = 25;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - bottomMargin) {
      doc.addPage();
      y = 25;
    }
  };

  paragraphs.forEach((paragraph, pIdx) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return;

    if (pIdx === 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(trimmed, maxWidth);
      ensureSpace(titleLines.length * 8);
      titleLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 8;
      });
      y += 4;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      return;
    }

    const subLines = trimmed.split('\n');
    subLines.forEach((subLine) => {
      const sub = subLine.trim();
      if (!sub) { y += lineHeight / 2; return; }

      const isSubBold =
        sub.startsWith('CLÁUSULA') ||
        sub.startsWith('CONTRATANTE:') ||
        sub.startsWith('CONTRATADO(A):') ||
        sub.startsWith('PARTE REVELADORA:') ||
        sub.startsWith('PARTE RECEPTORA:') ||
        sub.startsWith('___');
      doc.setFont('helvetica', isSubBold ? 'bold' : 'normal');

      const wrapped = doc.splitTextToSize(sub, maxWidth);
      ensureSpace(wrapped.length * lineHeight);
      wrapped.forEach((wLine: string) => {
        doc.text(wLine, margin, y);
        y += lineHeight;
      });
    });

    y += 4;
  });

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(40);
    doc.setTextColor(200, 200, 200);
    doc.text('ContratoFácil.com.br', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  doc.save(filename);
}
