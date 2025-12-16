import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Users, Calendar, DollarSign, AlertCircle, TrendingUp, Clock, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeFilter, DateRange, FilterPreset } from "@/components/company/dashboard/DateRangeFilter";
import { RevenueChart } from "@/components/company/dashboard/RevenueChart";
import { StudentsChart } from "@/components/company/dashboard/StudentsChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);

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

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, is_active')
        .eq('company_id', company.id)
        .eq('is_active', true);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      // Fetch upcoming class schedules
      const today = new Date().toISOString().split('T')[0];
      const { data: schedulesData } = await supabase
        .from('class_schedules')
        .select(`
          id, scheduled_date, start_time,
          classes(name),
          staff(full_name)
        `)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(4);

      setStudents(studentsData || []);
      setClasses(classesData || []);
      setTransactions(transactionsData || []);
      setUpcomingClasses(schedulesData || []);

      // Build recent activity from students and transactions
      const activity: any[] = [];
      
      (studentsData || []).slice(0, 3).forEach(s => {
        activity.push({
          text: `Novo aluno registado: ${s.full_name}`,
          time: getRelativeTime(new Date(s.created_at)),
          date: new Date(s.created_at),
        });
      });

      (transactionsData || []).filter(t => t.status === 'paid').slice(0, 3).forEach(t => {
        activity.push({
          text: `Pagamento recebido: €${t.amount}`,
          time: getRelativeTime(new Date(t.created_at)),
          date: new Date(t.created_at),
        });
      });

      activity.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(activity.slice(0, 5));

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
      activeClasses: classes.length,
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
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preset={preset}
          onPresetChange={setPreset}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("dashboard.totalStudents")}
          value={stats.totalStudents}
          icon={Users}
          trend="up"
          trendValue={`${stats.pendingStudents} pendentes`}
        />
        <StatCard
          title={t("dashboard.activeClasses")}
          value={stats.activeClasses}
          icon={Calendar}
        />
        <StatCard
          title="Receita"
          value={`€${stats.income.toFixed(2)}`}
          icon={DollarSign}
          trend="up"
          trendValue={`Despesas: €${stats.expenses.toFixed(2)}`}
        />
        <StatCard
          title={t("dashboard.pendingPayments")}
          value={`€${stats.pendingPayments.toFixed(2)}`}
          icon={AlertCircle}
          className="border-l-4 border-l-warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução de Receitas
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

        {/* Students Distribution */}
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
      </div>

      {/* Activity and Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem atividade recente</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingClasses.map((schedule) => (
                  <div key={schedule.id} className="p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold text-foreground">{(schedule.classes as any)?.name}</h4>
                    <p className="text-primary font-medium">{schedule.start_time?.slice(0, 5)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{(schedule.staff as any)?.full_name || "Sem instrutor"}</p>
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
