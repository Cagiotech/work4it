import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const PRIMARY_COLOR: [number, number, number] = [174, 202, 18]; // #aeca12

interface ExportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  summary?: { label: string; value: string }[];
  dateRange?: { from: Date; to: Date };
}

export const exportToPDF = async ({
  title,
  subtitle,
  data,
  columns,
  summary,
  dateRange,
}: ExportOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo text (simulating logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CAGIOTECH', 14, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestão de Ginásios', 14, 30);
  
  // Date on header
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, pageWidth - 14, 22, { align: 'right' });
  if (dateRange) {
    doc.text(
      `Período: ${dateRange.from.toLocaleDateString('pt-PT')} - ${dateRange.to.toLocaleDateString('pt-PT')}`,
      pageWidth - 14,
      30,
      { align: 'right' }
    );
  }
  
  // Title
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 60);
  
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 68);
  }
  
  // Summary boxes if provided
  let yPosition = subtitle ? 78 : 70;
  
  if (summary && summary.length > 0) {
    const boxWidth = (pageWidth - 28 - (summary.length - 1) * 4) / summary.length;
    
    summary.forEach((item, index) => {
      const xPos = 14 + index * (boxWidth + 4);
      
      // Box background
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(xPos, yPosition, boxWidth, 25, 3, 3, 'F');
      
      // Box border with primary color
      doc.setDrawColor(...PRIMARY_COLOR);
      doc.setLineWidth(0.5);
      doc.roundedRect(xPos, yPosition, boxWidth, 25, 3, 3, 'S');
      
      // Label
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(item.label, xPos + 4, yPosition + 9);
      
      // Value
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(item.value, xPos + 4, yPosition + 20);
    });
    
    yPosition += 35;
  }
  
  // Table
  if (data.length > 0) {
    doc.autoTable({
      startY: yPosition,
      head: [columns.map(c => c.header)],
      body: data.map(row => columns.map(c => row[c.dataKey] ?? '-')),
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { left: 14, right: 14 },
      styles: {
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
    });
  }
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Cagiotech © ' + new Date().getFullYear(), 14, pageHeight - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
  
  // Save
  const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportFinancialReport = async (
  transactions: any[],
  summary: { income: number; expenses: number; profit: number; pending: number },
  dateRange: { from: Date; to: Date }
) => {
  await exportToPDF({
    title: 'Relatório Financeiro',
    subtitle: 'Resumo de transações e movimentações financeiras',
    dateRange,
    data: transactions.map(t => ({
      description: t.description,
      category: t.category?.name || '-',
      date: new Date(t.created_at).toLocaleDateString('pt-PT'),
      amount: `${t.type === 'income' ? '+' : '-'}€${Number(t.amount).toFixed(2)}`,
      status: t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : t.status === 'overdue' ? 'Atrasado' : 'Cancelado',
    })),
    columns: [
      { header: 'Descrição', dataKey: 'description' },
      { header: 'Categoria', dataKey: 'category' },
      { header: 'Data', dataKey: 'date' },
      { header: 'Valor', dataKey: 'amount' },
      { header: 'Status', dataKey: 'status' },
    ],
    summary: [
      { label: 'Receita Total', value: `€${summary.income.toFixed(2)}` },
      { label: 'Despesas', value: `€${summary.expenses.toFixed(2)}` },
      { label: 'Lucro Líquido', value: `€${summary.profit.toFixed(2)}` },
      { label: 'Pendente', value: `€${summary.pending.toFixed(2)}` },
    ],
  });
};

export const exportPayrollReport = async (
  payrollData: any[],
  totalSalaries: number,
  dateRange: { from: Date; to: Date }
) => {
  await exportToPDF({
    title: 'Folha Salarial',
    subtitle: 'Relatório de salários e pagamentos a funcionários',
    dateRange,
    data: payrollData.map(p => ({
      name: p.full_name,
      position: p.position || '-',
      classes: p.classes_count || 0,
      base_salary: `€${Number(p.base_salary || 0).toFixed(2)}`,
      commission: `€${Number(p.commission || 0).toFixed(2)}`,
      total: `€${Number(p.total || 0).toFixed(2)}`,
    })),
    columns: [
      { header: 'Funcionário', dataKey: 'name' },
      { header: 'Cargo', dataKey: 'position' },
      { header: 'Aulas', dataKey: 'classes' },
      { header: 'Base', dataKey: 'base_salary' },
      { header: 'Comissões', dataKey: 'commission' },
      { header: 'Total', dataKey: 'total' },
    ],
    summary: [
      { label: 'Total Folha Salarial', value: `€${totalSalaries.toFixed(2)}` },
      { label: 'Funcionários', value: String(payrollData.length) },
    ],
  });
};

export const exportDashboardReport = async (
  stats: {
    totalStudents: number;
    activeClasses: number;
    income: number;
    pendingPayments: number;
  },
  recentActivity: any[],
  dateRange: { from: Date; to: Date }
) => {
  await exportToPDF({
    title: 'Relatório do Dashboard',
    subtitle: 'Resumo geral da empresa',
    dateRange,
    data: recentActivity.map(a => ({
      activity: a.text,
      time: a.time,
    })),
    columns: [
      { header: 'Atividade', dataKey: 'activity' },
      { header: 'Quando', dataKey: 'time' },
    ],
    summary: [
      { label: 'Total Alunos', value: String(stats.totalStudents) },
      { label: 'Aulas Ativas', value: String(stats.activeClasses) },
      { label: 'Receita', value: `€${stats.income.toFixed(2)}` },
      { label: 'Pendente', value: `€${stats.pendingPayments.toFixed(2)}` },
    ],
  });
};
