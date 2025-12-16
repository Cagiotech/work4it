import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIMARY_COLOR: [number, number, number] = [174, 202, 18]; // #aeca12
const SECONDARY_COLOR: [number, number, number] = [100, 100, 100];

interface ExportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  summary?: { label: string; value: string }[];
  dateRange?: { from: Date; to: Date };
  companyName?: string;
}

const addHeader = (doc: jsPDF, title: string, subtitle?: string, dateRange?: { from: Date; to: Date }) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Logo text
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
  
  return subtitle ? 78 : 70;
};

const addSummaryBoxes = (doc: jsPDF, summary: { label: string; value: string }[], yPosition: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
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
  
  return yPosition + 35;
};

const addTable = (doc: jsPDF, data: any[], columns: { header: string; dataKey: string }[], startY: number) => {
  if (data.length > 0) {
    autoTable(doc, {
      startY,
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
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.internal.pages.length - 1;
  const pageWidth = doc.internal.pageSize.getWidth();
  
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
};

export const exportToPDF = async ({
  title,
  subtitle,
  data,
  columns,
  summary,
  dateRange,
}: ExportOptions) => {
  const doc = new jsPDF();
  
  let yPosition = addHeader(doc, title, subtitle, dateRange);
  
  if (summary && summary.length > 0) {
    yPosition = addSummaryBoxes(doc, summary, yPosition);
  }
  
  addTable(doc, data, columns, yPosition);
  addFooter(doc);
  
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
    expenses?: number;
    pendingPayments: number;
  },
  recentActivity: any[],
  dateRange: { from: Date; to: Date }
) => {
  const doc = new jsPDF();
  
  let yPosition = addHeader(doc, 'Relatório do Dashboard', 'Resumo geral da empresa', dateRange);
  
  // Summary boxes
  const summaryItems = [
    { label: 'Total Alunos', value: String(stats.totalStudents) },
    { label: 'Aulas Ativas', value: String(stats.activeClasses) },
    { label: 'Receita', value: `€${stats.income.toFixed(2)}` },
    { label: 'Pendente', value: `€${stats.pendingPayments.toFixed(2)}` },
  ];
  
  yPosition = addSummaryBoxes(doc, summaryItems, yPosition);
  
  // Recent activity table
  if (recentActivity.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Atividade Recente', 14, yPosition + 5);
    
    addTable(doc, recentActivity.map(a => ({
      activity: a.text,
      time: a.time,
    })), [
      { header: 'Atividade', dataKey: 'activity' },
      { header: 'Quando', dataKey: 'time' },
    ], yPosition + 10);
  }
  
  addFooter(doc);
  
  const fileName = `dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportStudentsReport = async (
  students: any[],
  stats: { total: number; active: number; inactive: number; pending: number },
  dateRange?: { from: Date; to: Date }
) => {
  await exportToPDF({
    title: 'Relatório de Alunos',
    subtitle: 'Lista completa de alunos da empresa',
    dateRange,
    data: students.map(s => ({
      name: s.full_name,
      email: s.email || '-',
      phone: s.phone || '-',
      status: s.status === 'active' ? 'Ativo' : s.status === 'inactive' ? 'Inativo' : s.status === 'pending' ? 'Pendente' : s.status,
      trainer: s.trainer?.full_name || '-',
      plan: s.activeSubscription?.plan?.name || '-',
    })),
    columns: [
      { header: 'Nome', dataKey: 'name' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Telefone', dataKey: 'phone' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Personal', dataKey: 'trainer' },
      { header: 'Plano', dataKey: 'plan' },
    ],
    summary: [
      { label: 'Total Alunos', value: String(stats.total) },
      { label: 'Ativos', value: String(stats.active) },
      { label: 'Inativos', value: String(stats.inactive) },
      { label: 'Pendentes', value: String(stats.pending) },
    ],
  });
};

export const exportStaffReport = async (
  staff: any[],
  stats: { total: number; active: number; inactive: number }
) => {
  await exportToPDF({
    title: 'Relatório de Equipa',
    subtitle: 'Lista completa de funcionários da empresa',
    data: staff.map(s => ({
      name: s.full_name,
      email: s.email || '-',
      phone: s.phone || '-',
      position: s.position || '-',
      role: s.role?.name || '-',
      status: s.is_active ? 'Ativo' : 'Inativo',
      hire_date: s.hire_date ? new Date(s.hire_date).toLocaleDateString('pt-PT') : '-',
    })),
    columns: [
      { header: 'Nome', dataKey: 'name' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Cargo', dataKey: 'position' },
      { header: 'Função', dataKey: 'role' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Data Contrato', dataKey: 'hire_date' },
    ],
    summary: [
      { label: 'Total Equipa', value: String(stats.total) },
      { label: 'Ativos', value: String(stats.active) },
      { label: 'Inativos', value: String(stats.inactive) },
    ],
  });
};

export const exportClassesReport = async (
  classes: any[],
  schedules: any[],
  stats: { totalClasses: number; totalSchedules: number; totalEnrollments: number }
) => {
  const doc = new jsPDF();
  
  let yPosition = addHeader(doc, 'Relatório de Aulas', 'Resumo de aulas e agendamentos');
  
  // Summary
  const summaryItems = [
    { label: 'Total Modalidades', value: String(stats.totalClasses) },
    { label: 'Agendamentos', value: String(stats.totalSchedules) },
    { label: 'Inscrições', value: String(stats.totalEnrollments) },
  ];
  
  yPosition = addSummaryBoxes(doc, summaryItems, yPosition);
  
  // Classes table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Modalidades', 14, yPosition + 5);
  
  addTable(doc, classes.map(c => ({
    name: c.name,
    duration: `${c.duration_minutes} min`,
    capacity: c.capacity,
    room: c.room?.name || '-',
    instructor: c.instructor?.full_name || '-',
    status: c.is_active ? 'Ativa' : 'Inativa',
  })), [
    { header: 'Nome', dataKey: 'name' },
    { header: 'Duração', dataKey: 'duration' },
    { header: 'Capacidade', dataKey: 'capacity' },
    { header: 'Sala', dataKey: 'room' },
    { header: 'Instrutor', dataKey: 'instructor' },
    { header: 'Status', dataKey: 'status' },
  ], yPosition + 10);
  
  addFooter(doc);
  
  const fileName = `aulas_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportAttendanceReport = async (
  schedules: any[],
  dateRange: { from: Date; to: Date },
  stats: { totalScheduled: number; totalAttended: number; attendanceRate: number }
) => {
  await exportToPDF({
    title: 'Relatório de Presença',
    subtitle: 'Histórico de presenças e frequência nas aulas',
    dateRange,
    data: schedules.map(s => ({
      class_name: s.class?.name || '-',
      date: new Date(s.scheduled_date).toLocaleDateString('pt-PT'),
      time: s.start_time?.slice(0, 5) || '-',
      instructor: s.instructor?.full_name || '-',
      enrolled: s.enrollments_count || 0,
      attended: s.attended_count || 0,
    })),
    columns: [
      { header: 'Aula', dataKey: 'class_name' },
      { header: 'Data', dataKey: 'date' },
      { header: 'Horário', dataKey: 'time' },
      { header: 'Instrutor', dataKey: 'instructor' },
      { header: 'Inscritos', dataKey: 'enrolled' },
      { header: 'Presentes', dataKey: 'attended' },
    ],
    summary: [
      { label: 'Total Agendadas', value: String(stats.totalScheduled) },
      { label: 'Total Presenças', value: String(stats.totalAttended) },
      { label: 'Taxa Frequência', value: `${stats.attendanceRate.toFixed(1)}%` },
    ],
  });
};

export const exportHRReport = async (
  staff: any[],
  absences: any[],
  timeRecords: any[],
  dateRange: { from: Date; to: Date },
  stats: { 
    totalStaff: number; 
    totalAbsences: number; 
    totalHoursWorked: number;
    avgHoursPerEmployee: number;
  }
) => {
  const doc = new jsPDF();
  
  let yPosition = addHeader(doc, 'Relatório de Recursos Humanos', 'Resumo de equipa, ausências e horas trabalhadas', dateRange);
  
  // Summary
  const summaryItems = [
    { label: 'Total Funcionários', value: String(stats.totalStaff) },
    { label: 'Ausências', value: String(stats.totalAbsences) },
    { label: 'Horas Trabalhadas', value: `${stats.totalHoursWorked.toFixed(1)}h` },
    { label: 'Média/Funcionário', value: `${stats.avgHoursPerEmployee.toFixed(1)}h` },
  ];
  
  yPosition = addSummaryBoxes(doc, summaryItems, yPosition);
  
  // Staff summary table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Resumo da Equipa', 14, yPosition + 5);
  
  addTable(doc, staff.map(s => ({
    name: s.full_name,
    position: s.position || '-',
    hours_worked: `${Number(s.hours_worked || 0).toFixed(1)}h`,
    absences: s.absences_count || 0,
    status: s.is_active ? 'Ativo' : 'Inativo',
  })), [
    { header: 'Nome', dataKey: 'name' },
    { header: 'Cargo', dataKey: 'position' },
    { header: 'Horas', dataKey: 'hours_worked' },
    { header: 'Ausências', dataKey: 'absences' },
    { header: 'Status', dataKey: 'status' },
  ], yPosition + 10);
  
  addFooter(doc);
  
  const fileName = `rh_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
