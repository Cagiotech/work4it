import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Calendar, Loader2, Download, TrendingUp, Users, CreditCard, BarChart3,
  AlertCircle, CalendarDays, DollarSign, Target, Briefcase, Activity, FileText,
  CheckCircle, UserCheck, Clock, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangeFilter, DateRange, FilterPreset } from "@/components/company/dashboard/DateRangeFilter";
import { RevenueChart } from "@/components/company/dashboard/RevenueChart";
import { StudentsChart } from "@/components/company/dashboard/StudentsChart";
import { ClassesChart } from "@/components/company/dashboard/ClassesChart";
import { PaymentsChart } from "@/components/company/dashboard/PaymentsChart";
import { MonthlyComparisonChart } from "@/components/company/dashboard/MonthlyComparisonChart";
import { StaffChart } from "@/components/company/dashboard/StaffChart";
import { EquipmentChart } from "@/components/company/dashboard/EquipmentChart";
import { AttendanceChart } from "@/components/company/dashboard/AttendanceChart";
import { CategoryBreakdownChart } from "@/components/company/dashboard/CategoryBreakdownChart";
import { NewStudentsChart } from "@/components/company/dashboard/NewStudentsChart";
import { ScheduleStatusChart } from "@/components/company/dashboard/ScheduleStatusChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportDashboardReport } from "@/lib/pdfExport";
import { cn } from "@/lib/utils";

export default function CompanyDashboard() {
  const { t } = useTranslation();
  const { company } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<FilterPreset>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  // Data state
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [previousStats, setPreviousStats] = useState<any>(null);

  useEffect(() => {
    if (company?.id) {
      fetchData();
    }
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);

    try {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, email, status, created_at')
        .eq('company_id', company.id);

      const { data: staffData } = await supabase
        .from('staff')
        .select('id, full_name, email, position, is_active, hire_date, role_id')
        .eq('company_id', company.id);

      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, is_active, capacity, duration_minutes, color')
        .eq('company_id', company.id);

      const { data: schedulesData } = await supabase
        .from('class_schedules')
        .select('id, class_id, scheduled_date, start_time, status, instructor_id');

      const { data: enrollmentsData } = await supabase
        .from('class_enrollments')
        .select('id, class_schedule_id, student_id, status, attended_at, enrolled_at')
        .order('enrolled_at', { ascending: false })
        .limit(1000);

      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select('*, category:financial_categories(name, color)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('id, name, status, purchase_value, current_value')
        .eq('company_id', company.id);

      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, event_type, max_participants')
        .eq('company_id', company.id)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5);

      const { data: paymentProofsData } = await supabase
        .from('payment_proofs')
        .select('id, amount, status, created_at')
        .eq('status', 'pending');

      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingData } = await supabase
        .from('class_schedules')
        .select(`
          id, scheduled_date, start_time,
          classes(name, color, capacity),
          staff(full_name)
        `)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(8);

      setStudents(studentsData || []);
      setStaff(staffData || []);
      setClasses(classesData || []);
      setSchedules(schedulesData || []);
      setEnrollments(enrollmentsData || []);
      setTransactions(transactionsData || []);
      setEquipment(equipmentData || []);
      setEvents(eventsData || []);
      setPaymentProofs(paymentProofsData || []);
      setUpcomingClasses(upcomingData || []);

      const prevStart = subMonths(startOfMonth(new Date()), 1);
      const prevEnd = endOfMonth(prevStart);
      
      const prevStudents = (studentsData || []).filter(s => 
        new Date(s.created_at) < prevEnd
      ).filter(s => s.status === 'active').length;
      
      const prevIncome = (transactionsData || [])
        .filter(t => {
          const txDate = new Date(t.created_at);
          return isWithinInterval(txDate, { start: prevStart, end: prevEnd }) 
            && t.type === 'income' && t.status === 'paid';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const prevExpenses = (transactionsData || [])
        .filter(t => {
          const txDate = new Date(t.created_at);
          return isWithinInterval(txDate, { start: prevStart, end: prevEnd }) 
            && t.type === 'expense' && t.status === 'paid';
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setPreviousStats({
        totalStudents: prevStudents,
        income: prevIncome,
        expenses: prevExpenses,
      });

      const activity: any[] = [];
      
      (studentsData || []).slice(0, 5).forEach(s => {
        activity.push({
          text: `Novo aluno registado: ${s.full_name}`,
          time: getRelativeTime(new Date(s.created_at)),
          date: new Date(s.created_at),
          type: 'student',
        });
      });

      (transactionsData || []).filter(t => t.status === 'paid').slice(0, 5).forEach(t => {
        activity.push({
          text: `Pagamento recebido: €${Number(t.amount).toFixed(2)}`,
          time: getRelativeTime(new Date(t.created_at)),
          date: new Date(t.created_at),
          type: 'payment',
        });
      });

      activity.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter all data by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return isWithinInterval(txDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [transactions, dateRange]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const createdAt = new Date(s.created_at);
      return isWithinInterval(createdAt, { start: dateRange.from, end: dateRange.to });
    });
  }, [students, dateRange]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const date = new Date(s.scheduled_date);
      return isWithinInterval(date, { start: dateRange.from, end: dateRange.to });
    });
  }, [schedules, dateRange]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => {
      if (!e.enrolled_at) return false;
      const date = new Date(e.enrolled_at);
      return isWithinInterval(date, { start: dateRange.from, end: dateRange.to });
    });
  }, [enrollments, dateRange]);

  // Calculate detailed stats based on filtered data
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const pendingStudents = students.filter(s => s.status === 'pending' || s.status === 'pending_approval').length;
    const inactiveStudents = students.filter(s => s.status === 'inactive' || s.status === 'suspended').length;
    const newStudentsInPeriod = filteredStudents.length;
    
    const income = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pendingPayments = filteredTransactions
      .filter(t => t.status === 'pending' || t.status === 'overdue')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const overduePayments = filteredTransactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const activeStaff = staff.filter(s => s.is_active).length;
    const inactiveStaff = staff.filter(s => !s.is_active).length;

    const operationalEquipment = equipment.filter(e => e.status === 'operational').length;
    const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;
    const brokenEquipment = equipment.filter(e => e.status === 'broken' || e.status === 'out_of_service').length;
    const equipmentValue = equipment.reduce((sum, e) => sum + Number(e.current_value || e.purchase_value || 0), 0);

    const activeClasses = classes.filter(c => c.is_active).length;
    const totalCapacity = classes.filter(c => c.is_active).reduce((sum, c) => sum + (c.capacity || 0), 0);
    const scheduledClassesCount = filteredSchedules.length;
    const completedClasses = filteredSchedules.filter(s => s.status === 'completed').length;
    const cancelledClasses = filteredSchedules.filter(s => s.status === 'cancelled').length;

    const totalEnrollments = filteredEnrollments.length;
    const attendedEnrollments = filteredEnrollments.filter(e => e.attended_at).length;
    const attendanceRate = totalEnrollments > 0 ? (attendedEnrollments / totalEnrollments) * 100 : 0;

    const pendingProofsCount = paymentProofs.length;
    const pendingProofsValue = paymentProofs.reduce((sum, p) => sum + Number(p.amount), 0);

    const categoryBreakdown = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((acc: Record<string, number>, t) => {
        const catName = t.category?.name || 'Outros';
        acc[catName] = (acc[catName] || 0) + Number(t.amount);
        return acc;
      }, {});

    return {
      totalStudents: activeStudents,
      pendingStudents,
      inactiveStudents,
      newStudentsInPeriod,
      activeClasses,
      totalCapacity,
      scheduledClassesCount,
      completedClasses,
      cancelledClasses,
      income,
      expenses,
      pendingPayments,
      overduePayments,
      activeStaff,
      inactiveStaff,
      operationalEquipment,
      maintenanceEquipment,
      brokenEquipment,
      equipmentValue,
      attendanceRate,
      pendingProofsCount,
      pendingProofsValue,
      categoryBreakdown,
    };
  }, [students, classes, staff, equipment, paymentProofs, filteredTransactions, filteredStudents, filteredSchedules, filteredEnrollments]);

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return `${days} dia${days > 1 ? 's' : ''}`;
  };

  const handleExportPDF = async () => {
    try {
      const exportStats = {
        totalStudents: stats.totalStudents,
        activeClasses: stats.activeClasses,
        income: stats.income,
        expenses: stats.expenses,
        pendingPayments: stats.pendingPayments,
        pendingStudents: stats.pendingStudents,
        inactiveStudents: stats.inactiveStudents,
      };
      await exportDashboardReport(exportStats, recentActivity, dateRange, {
        transactions: filteredTransactions,
        classes: classes,
        schedules: filteredSchedules,
        upcomingClasses: upcomingClasses,
        previousStats: previousStats,
      });
      toast.success("Relatório exportado com sucesso");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erro ao exportar PDF");
    }
  };

  const getPresetLabel = () => {
    switch (preset) {
      case "today": return "Hoje";
      case "yesterday": return "Ontem";
      case "week": return "Esta Semana";
      case "month": return "Este Mês";
      default: return `${format(dateRange.from, "dd/MM", { locale: pt })} - ${format(dateRange.to, "dd/MM", { locale: pt })}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Período: <span className="font-medium text-foreground">{getPresetLabel()}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            preset={preset}
            onPresetChange={setPreset}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {(stats.overduePayments > 0 || stats.pendingProofsCount > 0 || stats.maintenanceEquipment > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.overduePayments > 0 && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-red-600">Pagamentos em Atraso</p>
                  <p className="text-sm text-muted-foreground">€{stats.overduePayments.toFixed(2)} pendentes</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.pendingProofsCount > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-600">Comprovativos Pendentes</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingProofsCount} para análise</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.maintenanceEquipment > 0 && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-full">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-600">Equipamentos em Manutenção</p>
                  <p className="text-sm text-muted-foreground">{stats.maintenanceEquipment} equipamentos</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-xl font-bold text-green-600">€{stats.income.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/20 rounded-xl">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-red-600">€{stats.expenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-xl">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                <p className={cn(
                  "text-xl font-bold",
                  stats.income - stats.expenses >= 0 ? "text-primary" : "text-red-600"
                )}>
                  €{(stats.income - stats.expenses).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/20 rounded-xl">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-yellow-600">€{stats.pendingPayments.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Alunos Ativos</p>
              <p className="text-lg font-bold">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Novos (Período)</p>
              <p className="text-lg font-bold">{stats.newStudentsInPeriod}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Staff Ativo</p>
              <p className="text-lg font-bold">{stats.activeStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <div>
              <p className="text-xs text-muted-foreground">Aulas (Período)</p>
              <p className="text-lg font-bold">{stats.scheduledClassesCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            <div>
              <p className="text-xs text-muted-foreground">Taxa Presença</p>
              <p className="text-lg font-bold">{stats.attendanceRate.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Equipamentos</p>
              <p className="text-lg font-bold">{stats.operationalEquipment}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 1: Main Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução Financeira
            </CardTitle>
            <CardDescription>Receitas, despesas e lucro no período</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart
              transactions={filteredTransactions}
              dateRange={dateRange}
              preset={preset}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Comparativo Mensal (6 meses)
            </CardTitle>
            <CardDescription>Evolução financeira dos últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyComparisonChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Category Breakdown + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Receita por Categoria
            </CardTitle>
            <CardDescription>Distribuição das receitas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart 
              categoryBreakdown={stats.categoryBreakdown} 
              totalIncome={stats.income} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Status de Pagamentos
            </CardTitle>
            <CardDescription>Distribuição por status no período</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentsChart transactions={filteredTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Students + New Students + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Distribuição de Alunos
            </CardTitle>
            <CardDescription>Total: {students.length} alunos</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsChart
              activeCount={stats.totalStudents}
              inactiveCount={stats.inactiveStudents}
              pendingCount={stats.pendingStudents}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Novos Alunos
            </CardTitle>
            <CardDescription>Registos no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <NewStudentsChart students={students} dateRange={dateRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              Presenças
            </CardTitle>
            <CardDescription>Estatísticas de presença no período</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceChart enrollments={enrollments} dateRange={dateRange} />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Classes + Schedule Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Aulas por Modalidade
            </CardTitle>
            <CardDescription>{stats.activeClasses} modalidades ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <ClassesChart classes={classes} schedules={filteredSchedules} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Status das Aulas
            </CardTitle>
            <CardDescription>Estado das aulas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleStatusChart schedules={schedules} dateRange={dateRange} />
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Staff + Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Equipa
            </CardTitle>
            <CardDescription>{staff.length} membros da equipa</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffChart activeCount={stats.activeStaff} inactiveCount={stats.inactiveStaff} />
            {staff.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {staff.filter(s => s.is_active).slice(0, 6).map(s => (
                  <Badge key={s.id} variant="outline" className="text-xs">
                    {s.full_name}
                  </Badge>
                ))}
                {staff.filter(s => s.is_active).length > 6 && (
                  <Badge variant="secondary" className="text-xs">
                    +{staff.filter(s => s.is_active).length - 6} mais
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Equipamentos
            </CardTitle>
            <CardDescription>{equipment.length} equipamentos • €{stats.equipmentValue.toFixed(2)} valor total</CardDescription>
          </CardHeader>
          <CardContent>
            <EquipmentChart 
              operationalCount={stats.operationalEquipment}
              maintenanceCount={stats.maintenanceEquipment}
              brokenCount={stats.brokenEquipment}
            />
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Activity + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem atividade recente</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                    activity.type === 'payment' ? 'bg-green-500' :
                    activity.type === 'student' ? 'bg-blue-500' :
                    'bg-primary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Aulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem aulas agendadas</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {upcomingClasses.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{(schedule.classes as any)?.name}</h4>
                        <p className="text-xs text-muted-foreground">{(schedule.staff as any)?.full_name || "Sem instrutor"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-medium text-sm">{schedule.start_time?.slice(0, 5)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(schedule.scheduled_date), "dd MMM", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem eventos agendados</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Badge variant="outline" className="text-xs mt-1">{event.event_type || 'Geral'}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-medium text-sm">{event.start_time?.slice(0, 5) || '--:--'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.event_date), "dd MMM", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
