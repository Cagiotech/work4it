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
    pendingStudents?: number;
    inactiveStudents?: number;
  },
  recentActivity: any[],
  dateRange: { from: Date; to: Date },
  extraData?: {
    transactions?: any[];
    classes?: any[];
    schedules?: any[];
    upcomingClasses?: any[];
    previousStats?: {
      totalStudents: number;
      income: number;
      expenses: number;
    };
  }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPosition = addHeader(doc, 'Relatório do Dashboard', 'Resumo geral da empresa', dateRange);
  
  // Calculate KPIs
  const expenses = stats.expenses || 0;
  const profit = stats.income - expenses;
  const profitMargin = stats.income > 0 ? ((stats.income - expenses) / stats.income) * 100 : 0;
  const totalRevenue = stats.income + stats.pendingPayments;
  const collectionRate = totalRevenue > 0 ? (stats.income / totalRevenue) * 100 : 100;
  const totalStudentsWithInactive = stats.totalStudents + (stats.inactiveStudents || 0);
  const retentionRate = totalStudentsWithInactive > 0 ? (stats.totalStudents / totalStudentsWithInactive) * 100 : 100;
  
  // Previous period comparison
  const revenueGrowth = extraData?.previousStats?.income 
    ? ((stats.income - extraData.previousStats.income) / extraData.previousStats.income) * 100 
    : 0;
  const studentGrowth = extraData?.previousStats?.totalStudents 
    ? ((stats.totalStudents - extraData.previousStats.totalStudents) / extraData.previousStats.totalStudents) * 100 
    : 0;

  // ========== ROW 1: Main KPI Cards (4 cards) ==========
  const cardWidth = (pageWidth - 28 - 12) / 4; // 4 cards with gaps
  const cardHeight = 42;
  
  const kpiCards = [
    { 
      label: 'Receita Total', 
      value: `€${stats.income.toFixed(2)}`, 
      trend: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs período anterior`,
      color: PRIMARY_COLOR,
      trendPositive: revenueGrowth >= 0
    },
    { 
      label: 'Lucro Líquido', 
      value: `€${profit.toFixed(2)}`, 
      trend: `Margem: ${profitMargin.toFixed(1)}%`,
      color: [34, 197, 94] as [number, number, number], // green
      trendPositive: profit >= 0
    },
    { 
      label: 'Total Alunos', 
      value: String(stats.totalStudents), 
      trend: `${studentGrowth >= 0 ? '+' : ''}${studentGrowth.toFixed(1)}% crescimento`,
      color: [59, 130, 246] as [number, number, number], // blue
      trendPositive: studentGrowth >= 0
    },
    { 
      label: 'Pendentes', 
      value: `€${stats.pendingPayments.toFixed(2)}`, 
      trend: `Taxa Recebimento: ${collectionRate.toFixed(0)}%`,
      color: [245, 158, 11] as [number, number, number], // yellow
      trendPositive: true
    },
  ];

  kpiCards.forEach((card, index) => {
    const xPos = 14 + index * (cardWidth + 4);
    
    // Card background
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(xPos, yPosition, cardWidth, cardHeight, 4, 4, 'F');
    
    // Left accent bar
    doc.setFillColor(...card.color);
    doc.rect(xPos, yPosition, 3, cardHeight, 'F');
    
    // Label
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, xPos + 8, yPosition + 10);
    
    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.trendPositive ? 50 : 239, card.trendPositive ? 50 : 68, card.trendPositive ? 50 : 68);
    doc.text(card.value, xPos + 8, yPosition + 24);
    
    // Trend
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(card.trendPositive ? 34 : 239, card.trendPositive ? 197 : 68, card.trendPositive ? 94 : 68);
    doc.text(card.trend, xPos + 8, yPosition + 34);
  });

  yPosition += cardHeight + 8;

  // ========== ROW 2: Secondary KPI Cards (4 cards) ==========
  const secondaryKpis = [
    { 
      label: 'Aulas Ativas', 
      value: String(stats.activeClasses), 
      subtitle: 'Tipos de aula disponíveis',
      color: [168, 85, 247] as [number, number, number] // purple
    },
    { 
      label: 'Retenção', 
      value: `${retentionRate.toFixed(0)}%`, 
      subtitle: 'Taxa de retenção de alunos',
      color: [99, 102, 241] as [number, number, number] // indigo
    },
    { 
      label: 'Despesas', 
      value: `€${expenses.toFixed(2)}`, 
      subtitle: `${stats.pendingStudents || 0} alunos pendentes`,
      color: [239, 68, 68] as [number, number, number] // red
    },
    { 
      label: 'Inativos', 
      value: String(stats.inactiveStudents || 0), 
      subtitle: 'Alunos inativos',
      color: [107, 114, 128] as [number, number, number] // gray
    },
  ];

  secondaryKpis.forEach((card, index) => {
    const xPos = 14 + index * (cardWidth + 4);
    
    // Card background
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(xPos, yPosition, cardWidth, 32, 4, 4, 'F');
    
    // Left accent bar
    doc.setFillColor(...card.color);
    doc.rect(xPos, yPosition, 3, 32, 'F');
    
    // Label
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, xPos + 8, yPosition + 10);
    
    // Value
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(card.value, xPos + 8, yPosition + 22);
    
    // Subtitle
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(card.subtitle, xPos + 8, yPosition + 28);
  });

  yPosition += 40;

  // ========== ROW 3: Financial Summary Chart (Bar representation) ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Resumo Financeiro', 14, yPosition);
  yPosition += 8;

  // Draw financial bar chart representation
  const financialData = [
    { label: 'Receita', value: stats.income, color: PRIMARY_COLOR },
    { label: 'Despesas', value: expenses, color: [239, 68, 68] as [number, number, number] },
    { label: 'Lucro', value: profit, color: [34, 197, 94] as [number, number, number] },
    { label: 'Pendente', value: stats.pendingPayments, color: [245, 158, 11] as [number, number, number] },
  ];

  const maxValue = Math.max(...financialData.map(d => Math.abs(d.value)), 1);
  const barChartWidth = (pageWidth - 28) / 2 - 10;
  const barHeight = 14;

  financialData.forEach((item, index) => {
    const yBar = yPosition + index * (barHeight + 4);
    
    // Label
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, 14, yBar + 9);
    
    // Bar background
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(50, yBar, barChartWidth - 40, barHeight, 2, 2, 'F');
    
    // Bar fill
    const barWidth = Math.max((Math.abs(item.value) / maxValue) * (barChartWidth - 40), 2);
    doc.setFillColor(...item.color);
    doc.roundedRect(50, yBar, barWidth, barHeight, 2, 2, 'F');
    
    // Value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(`€${item.value.toFixed(2)}`, 50 + barChartWidth - 35, yBar + 9);
  });

  // ========== Students Distribution (right side) ==========
  const studentsX = pageWidth / 2 + 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Distribuição de Alunos', studentsX, yPosition - 8);

  const studentData = [
    { label: 'Ativos', value: stats.totalStudents, color: PRIMARY_COLOR },
    { label: 'Inativos', value: stats.inactiveStudents || 0, color: [107, 114, 128] as [number, number, number] },
    { label: 'Pendentes', value: stats.pendingStudents || 0, color: [245, 158, 11] as [number, number, number] },
  ];

  const totalStudentsAll = studentData.reduce((sum, s) => sum + s.value, 0) || 1;

  studentData.forEach((item, index) => {
    const yBar = yPosition + index * (barHeight + 4);
    const percentage = (item.value / totalStudentsAll) * 100;
    
    // Label
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, studentsX, yBar + 9);
    
    // Bar background
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(studentsX + 30, yBar, barChartWidth - 50, barHeight, 2, 2, 'F');
    
    // Bar fill
    const barWidth = Math.max((percentage / 100) * (barChartWidth - 50), 2);
    doc.setFillColor(...item.color);
    doc.roundedRect(studentsX + 30, yBar, barWidth, barHeight, 2, 2, 'F');
    
    // Value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(`${item.value} (${percentage.toFixed(0)}%)`, studentsX + barChartWidth - 15, yBar + 9);
  });

  yPosition += financialData.length * (barHeight + 4) + 15;

  // ========== ROW 4: Activity and Upcoming Classes ==========
  const halfWidth = (pageWidth - 28 - 8) / 2;

  // Recent Activity
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Atividade Recente', 14, yPosition);
  yPosition += 6;

  if (recentActivity.length > 0) {
    const activityY = yPosition;
    recentActivity.slice(0, 6).forEach((activity, index) => {
      const yItem = activityY + index * 10;
      
      // Bullet
      doc.setFillColor(...PRIMARY_COLOR);
      doc.circle(17, yItem + 3, 1.5, 'F');
      
      // Text
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const activityText = activity.text.length > 40 ? activity.text.slice(0, 40) + '...' : activity.text;
      doc.text(activityText, 22, yItem + 4);
      
      // Time
      doc.setTextColor(130, 130, 130);
      doc.text(activity.time, halfWidth - 5, yItem + 4);
    });
  } else {
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('Sem atividade recente', 14, yPosition + 5);
  }

  // Upcoming Classes
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Próximas Aulas', pageWidth / 2 + 5, yPosition - 6);

  if (extraData?.upcomingClasses && extraData.upcomingClasses.length > 0) {
    const classesY = yPosition;
    extraData.upcomingClasses.slice(0, 6).forEach((schedule: any, index: number) => {
      const yItem = classesY + index * 12;
      const xPos = pageWidth / 2 + 5;
      
      // Class card
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(xPos, yItem - 2, halfWidth, 10, 2, 2, 'F');
      
      // Class name
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      const className = (schedule.classes as any)?.name || 'Aula';
      doc.text(className.slice(0, 15), xPos + 3, yItem + 4);
      
      // Time
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text(schedule.start_time?.slice(0, 5) || '', xPos + halfWidth - 35, yItem + 4);
      
      // Date
      doc.setTextColor(130, 130, 130);
      doc.text(schedule.scheduled_date || '', xPos + halfWidth - 18, yItem + 4);
    });
  } else {
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('Sem aulas agendadas', pageWidth / 2 + 5, yPosition + 5);
  }

  // ========== Classes Distribution (if data available) ==========
  if (extraData?.classes && extraData.classes.length > 0) {
    yPosition += Math.max(recentActivity.length, extraData.upcomingClasses?.length || 0) * 12 + 15;
    
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Aulas por Modalidade', 14, yPosition);
    yPosition += 8;

    // Count schedules per class
    const classScheduleCounts: Record<string, number> = {};
    (extraData.schedules || []).forEach((s: any) => {
      const classId = s.class_id || s.class?.id;
      if (classId) {
        classScheduleCounts[classId] = (classScheduleCounts[classId] || 0) + 1;
      }
    });

    const classColors: [number, number, number][] = [
      PRIMARY_COLOR, 
      [59, 130, 246], 
      [239, 68, 68], 
      [245, 158, 11], 
      [168, 85, 247], 
      [236, 72, 153]
    ];
    const classData = extraData.classes
      .filter((c: any) => c.is_active !== false)
      .map((c: any, index: number) => ({
        name: c.name as string,
        schedules: classScheduleCounts[c.id] || 0,
        color: classColors[index % classColors.length],
      }))
      .sort((a, b) => b.schedules - a.schedules)
      .slice(0, 6);

    const maxSchedules = Math.max(...classData.map((c: any) => c.schedules), 1);

    classData.forEach((classItem: any, index: number) => {
      const yBar = yPosition + index * (barHeight + 3);
      
      // Label
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      const displayName = classItem.name.length > 18 ? classItem.name.slice(0, 18) + '...' : classItem.name;
      doc.text(displayName, 14, yBar + 9);
      
      // Bar background
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(70, yBar, pageWidth - 110, barHeight, 2, 2, 'F');
      
      // Bar fill
      const barWidth = Math.max((classItem.schedules / maxSchedules) * (pageWidth - 110), 2);
      doc.setFillColor(classItem.color[0], classItem.color[1], classItem.color[2]);
      doc.roundedRect(70, yBar, barWidth, barHeight, 2, 2, 'F');
      
      // Value
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`${classItem.schedules} aulas`, pageWidth - 30, yBar + 9);
    });
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
