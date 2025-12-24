import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format, differenceInDays, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Calendar, Clock, Loader2, Download, TrendingUp, Users, CreditCard, BarChart3,
  UserCheck, UserX, AlertCircle, CheckCircle, Package, Wrench, CalendarDays,
  DollarSign, Target, Briefcase, Award, Activity, Bell, FileText, Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, DateRange, FilterPreset } from "@/components/company/dashboard/DateRangeFilter";
import { RevenueChart } from "@/components/company/dashboard/RevenueChart";
import { StudentsChart } from "@/components/company/dashboard/StudentsChart";
import { ClassesChart } from "@/components/company/dashboard/ClassesChart";
import { PaymentsChart } from "@/components/company/dashboard/PaymentsChart";
import { MonthlyComparisonChart } from "@/components/company/dashboard/MonthlyComparisonChart";
import { KPICards } from "@/components/company/dashboard/KPICards";
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
      // Fetch students with more details
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, email, status, created_at')
        .eq('company_id', company.id);

      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, full_name, email, position, is_active, hire_date, role_id')
        .eq('company_id', company.id);

      // Fetch classes with capacity
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, is_active, capacity, duration_minutes, color')
        .eq('company_id', company.id);

      // Fetch all schedules for the current month
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const { data: schedulesData } = await supabase
        .from('class_schedules')
        .select('id, class_id, scheduled_date, start_time, status, instructor_id')
        .gte('scheduled_date', monthStart.toISOString().split('T')[0])
        .lte('scheduled_date', monthEnd.toISOString().split('T')[0]);

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('class_enrollments')
        .select('id, class_schedule_id, student_id, status, attended_at, enrolled_at')
        .order('enrolled_at', { ascending: false })
        .limit(500);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select('*, category:financial_categories(name, color)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      // Fetch equipment
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('id, name, status, purchase_value, current_value')
        .eq('company_id', company.id);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, event_date, start_time, event_type, max_participants')
        .eq('company_id', company.id)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(5);

      // Fetch payment proofs pending
      const { data: paymentProofsData } = await supabase
        .from('payment_proofs')
        .select('id, amount, status, created_at')
        .eq('status', 'pending');

      // Fetch upcoming class schedules
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

      // Calculate previous period stats for comparison
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

      // Build recent activity from students, transactions, and enrollments
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

      (enrollmentsData || []).filter(e => e.attended_at).slice(0, 3).forEach(e => {
        activity.push({
          text: `Presença registada em aula`,
          time: getRelativeTime(new Date(e.attended_at)),
          date: new Date(e.attended_at),
          type: 'attendance',
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

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return isWithinInterval(txDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [transactions, dateRange]);

  // Calculate detailed stats
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const pendingStudents = students.filter(s => s.status === 'pending' || s.status === 'pending_approval').length;
    const inactiveStudents = students.filter(s => s.status === 'inactive' || s.status === 'suspended').length;
    const newStudentsThisMonth = students.filter(s => {
      const createdAt = new Date(s.created_at);
      return isWithinInterval(createdAt, { start: dateRange.from, end: dateRange.to });
    }).length;
    
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

    // Staff stats
    const activeStaff = staff.filter(s => s.is_active).length;
    const inactiveStaff = staff.filter(s => !s.is_active).length;

    // Equipment stats
    const operationalEquipment = equipment.filter(e => e.status === 'operational').length;
    const maintenanceEquipment = equipment.filter(e => e.status === 'maintenance').length;
    const brokenEquipment = equipment.filter(e => e.status === 'broken' || e.status === 'out_of_service').length;
    const equipmentValue = equipment.reduce((sum, e) => sum + Number(e.current_value || e.purchase_value || 0), 0);

    // Class stats
    const activeClasses = classes.filter(c => c.is_active).length;
    const totalCapacity = classes.filter(c => c.is_active).reduce((sum, c) => sum + (c.capacity || 0), 0);
    const scheduledClassesCount = schedules.length;
    const completedClasses = schedules.filter(s => s.status === 'completed').length;
    const cancelledClasses = schedules.filter(s => s.status === 'cancelled').length;

    // Attendance stats
    const totalEnrollments = enrollments.length;
    const attendedEnrollments = enrollments.filter(e => e.attended_at).length;
    const attendanceRate = totalEnrollments > 0 ? (attendedEnrollments / totalEnrollments) * 100 : 0;

    // Payment proofs pending
    const pendingProofsCount = paymentProofs.length;
    const pendingProofsValue = paymentProofs.reduce((sum, p) => sum + Number(p.amount), 0);

    // Transaction categories breakdown
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
      newStudentsThisMonth,
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
  }, [students, classes, staff, equipment, enrollments, paymentProofs, schedules, filteredTransactions, dateRange]);

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
        schedules: schedules,
        upcomingClasses: upcomingClasses,
        previousStats: previousStats,
      });
      toast.success("Relatório exportado com sucesso");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erro ao exportar PDF");
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
            Visão geral completa do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-sm text-muted-foreground">{stats.pendingProofsCount} para análise (€{stats.pendingProofsValue.toFixed(2)})</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.maintenanceEquipment > 0 && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-full">
                  <Wrench className="h-5 w-5 text-orange-600" />
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

      {/* KPI Cards */}
      <KPICards 
        stats={stats} 
        previousStats={previousStats}
        transactions={filteredTransactions}
      />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alunos Ativos</p>
              <p className="text-lg font-bold">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-lg font-bold">{stats.pendingStudents}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff Ativo</p>
              <p className="text-lg font-bold">{stats.activeStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aulas Este Mês</p>
              <p className="text-lg font-bold">{stats.scheduledClassesCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Percent className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa Presença</p>
              <p className="text-lg font-bold">{stats.attendanceRate.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <Package className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Equipamentos</p>
              <p className="text-lg font-bold">{stats.operationalEquipment}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 1: Revenue Chart + Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução Financeira (Período)
            </CardTitle>
            <CardDescription>
              Receitas, despesas e lucro no período selecionado
            </CardDescription>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Comparativo Mensal (6 meses)
            </CardTitle>
            <CardDescription>
              Evolução financeira dos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyComparisonChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Students + Payments + Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Distribuição de Alunos
            </CardTitle>
            <CardDescription>
              Total: {students.length} alunos registados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsChart
              activeCount={stats.totalStudents}
              inactiveCount={stats.inactiveStudents}
              pendingCount={stats.pendingStudents}
            />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Novos este mês</span>
                <Badge variant="secondary">{stats.newStudentsThisMonth}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Status de Pagamentos
            </CardTitle>
            <CardDescription>
              Distribuição por status no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentsChart transactions={filteredTransactions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Aulas por Modalidade
            </CardTitle>
            <CardDescription>
              {stats.activeClasses} modalidades ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassesChart classes={classes} schedules={schedules} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Detailed Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Receita por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição das receitas no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.categoryBreakdown).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sem dados de categorias</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.categoryBreakdown)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([category, amount]) => {
                    const percentage = (amount as number / stats.income) * 100;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category}</span>
                          <span className="text-muted-foreground">
                            €{(amount as number).toFixed(2)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold text-green-600">€{stats.income.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Despesas Total</p>
              <p className="text-xl font-bold text-red-600">€{stats.expenses.toFixed(2)}</p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              stats.income - stats.expenses >= 0 ? "bg-primary/10" : "bg-red-500/10"
            )}>
              <p className="text-xs text-muted-foreground">Lucro Líquido</p>
              <p className={cn(
                "text-xl font-bold",
                stats.income - stats.expenses >= 0 ? "text-primary" : "text-red-600"
              )}>
                €{(stats.income - stats.expenses).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-xl font-bold text-yellow-600">€{stats.pendingPayments.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Staff & Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Equipa
            </CardTitle>
            <CardDescription>
              {staff.length} membros da equipa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg text-center">
                <UserCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.activeStaff}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
              <div className="p-4 bg-gray-500/10 rounded-lg text-center">
                <UserX className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.inactiveStaff}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
            {staff.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Equipa Ativa</p>
                <div className="flex flex-wrap gap-2">
                  {staff.filter(s => s.is_active).slice(0, 5).map(s => (
                    <Badge key={s.id} variant="outline" className="text-xs">
                      {s.full_name}
                    </Badge>
                  ))}
                  {staff.filter(s => s.is_active).length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{staff.filter(s => s.is_active).length - 5} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Equipamentos
            </CardTitle>
            <CardDescription>
              {equipment.length} equipamentos registados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-500/10 rounded-lg text-center">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-xl font-bold">{stats.operationalEquipment}</p>
                <p className="text-xs text-muted-foreground">Operacional</p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
                <Wrench className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                <p className="text-xl font-bold">{stats.maintenanceEquipment}</p>
                <p className="text-xs text-muted-foreground">Manutenção</p>
              </div>
              <div className="p-4 bg-red-500/10 rounded-lg text-center">
                <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                <p className="text-xl font-bold">{stats.brokenEquipment}</p>
                <p className="text-xs text-muted-foreground">Avariado</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Valor Total do Inventário</p>
              <p className="text-lg font-bold">€{stats.equipmentValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Activity, Upcoming Classes & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Aulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem aulas agendadas</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {upcomingClasses.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="p-3 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {(schedule.classes as any)?.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(schedule.staff as any)?.full_name || "Sem instrutor"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-medium text-sm">
                          {schedule.start_time?.slice(0, 5)}
                        </p>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem eventos agendados</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="p-3 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{event.title}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.event_type || 'Geral'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-medium text-sm">
                          {event.start_time?.slice(0, 5) || '--:--'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.event_date), "dd MMM", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    {event.max_participants && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Máx. {event.max_participants} participantes
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Classes Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo de Aulas (Este Mês)
          </CardTitle>
          <CardDescription>
            Estatísticas de agendamentos e presenças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.scheduledClassesCount}</p>
              <p className="text-xs text-muted-foreground">Agendadas</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedClasses}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelledClasses}</p>
              <p className="text-xs text-muted-foreground">Canceladas</p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.activeClasses}</p>
              <p className="text-xs text-muted-foreground">Modalidades</p>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Capacidade Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}