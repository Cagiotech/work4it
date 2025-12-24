import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { Calendar, Clock, Loader2, Download, FileText, TrendingUp, Users, CreditCard, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [classes, setClasses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
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
      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, status, created_at')
        .eq('company_id', company.id);

      // Fetch classes with capacity
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, is_active, capacity')
        .eq('company_id', company.id);

      // Fetch all schedules for the current month
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const { data: schedulesData } = await supabase
        .from('class_schedules')
        .select('id, class_id, scheduled_date, start_time')
        .gte('scheduled_date', monthStart.toISOString().split('T')[0])
        .lte('scheduled_date', monthEnd.toISOString().split('T')[0]);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      // Fetch upcoming class schedules
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingData } = await supabase
        .from('class_schedules')
        .select(`
          id, scheduled_date, start_time,
          classes(name),
          staff(full_name)
        `)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(6);

      setStudents(studentsData || []);
      setClasses(classesData || []);
      setSchedules(schedulesData || []);
      setTransactions(transactionsData || []);
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

      setPreviousStats({
        totalStudents: prevStudents,
        income: prevIncome,
        expenses: 0,
      });

      // Build recent activity from students and transactions
      const activity: any[] = [];
      
      (studentsData || []).slice(0, 5).forEach(s => {
        activity.push({
          text: `Novo aluno registado: ${s.full_name}`,
          time: getRelativeTime(new Date(s.created_at)),
          date: new Date(s.created_at),
        });
      });

      (transactionsData || []).filter(t => t.status === 'paid').slice(0, 5).forEach(t => {
        activity.push({
          text: `Pagamento recebido: €${t.amount}`,
          time: getRelativeTime(new Date(t.created_at)),
          date: new Date(t.created_at),
        });
      });

      activity.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(activity.slice(0, 8));

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

  // Calculate stats
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length;
    const pendingStudents = students.filter(s => s.status === 'pending' || s.status === 'pending_approval').length;
    const inactiveStudents = students.filter(s => s.status === 'inactive' || s.status === 'suspended').length;
    
    const income = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pendingPayments = filteredTransactions
      .filter(t => t.status === 'pending' || t.status === 'overdue')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalStudents: activeStudents,
      activeClasses: classes.filter(c => c.is_active).length,
      income,
      expenses,
      pendingPayments,
      pendingStudents,
      inactiveStudents,
    };
  }, [students, classes, filteredTransactions]);

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
      {/* Date Filter */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
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

      {/* KPI Cards */}
      <KPICards 
        stats={stats} 
        previousStats={previousStats}
        transactions={filteredTransactions}
      />

      {/* Row 1: Revenue Chart + Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução Financeira (Período)
            </CardTitle>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Status de Pagamentos
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            <ClassesChart classes={classes} schedules={schedules} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Activity and Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem atividade recente</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingClasses.map((schedule) => (
                  <div key={schedule.id} className="p-3 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold text-foreground text-sm">{(schedule.classes as any)?.name}</h4>
                    <p className="text-primary font-medium text-sm">{schedule.start_time?.slice(0, 5)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(schedule.staff as any)?.full_name || "Sem instrutor"}</p>
                    <p className="text-xs text-muted-foreground">{schedule.scheduled_date}</p>
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
