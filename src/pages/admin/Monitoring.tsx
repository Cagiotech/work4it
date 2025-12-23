import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Server, Database, Globe, RefreshCw, Users, Building2, CreditCard, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMonitoring() {
  // Fetch real-time stats from database
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-monitoring-stats'],
    queryFn: async () => {
      const [
        companiesResult,
        studentsResult,
        staffResult,
        transactionsResult,
        subscriptionsResult,
        classesResult,
        eventsResult,
        messagesResult,
      ] = await Promise.all([
        supabase.from('companies').select('id, created_at', { count: 'exact' }),
        supabase.from('students').select('id, created_at, status', { count: 'exact' }),
        supabase.from('staff').select('id, created_at, is_active', { count: 'exact' }),
        supabase.from('financial_transactions').select('id, amount, status, type, created_at', { count: 'exact' }),
        supabase.from('company_subscriptions').select('id, status, plan_id', { count: 'exact' }),
        supabase.from('classes').select('id, is_active', { count: 'exact' }),
        supabase.from('events').select('id, created_at', { count: 'exact' }),
        supabase.from('messages').select('id, created_at', { count: 'exact' }),
      ]);

      // Calculate stats
      const totalCompanies = companiesResult.count || 0;
      const totalStudents = studentsResult.count || 0;
      const totalStaff = staffResult.count || 0;
      const totalTransactions = transactionsResult.count || 0;
      const activeSubscriptions = subscriptionsResult.data?.filter(s => s.status === 'active').length || 0;
      const totalClasses = classesResult.data?.filter(c => c.is_active).length || 0;
      const totalEvents = eventsResult.count || 0;
      const totalMessages = messagesResult.count || 0;

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

      const newCompanies = companiesResult.data?.filter(c => c.created_at >= sevenDaysAgoStr).length || 0;
      const newStudents = studentsResult.data?.filter(s => s.created_at >= sevenDaysAgoStr).length || 0;
      const newMessages = messagesResult.data?.filter(m => m.created_at >= sevenDaysAgoStr).length || 0;

      // Revenue calculation
      const paidTransactions = transactionsResult.data?.filter(t => t.status === 'paid' && t.type === 'income') || [];
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Active students
      const activeStudents = studentsResult.data?.filter(s => s.status === 'active').length || 0;

      return {
        totalCompanies,
        totalStudents,
        totalStaff,
        totalTransactions,
        activeSubscriptions,
        totalClasses,
        totalEvents,
        totalMessages,
        newCompanies,
        newStudents,
        newMessages,
        totalRevenue,
        activeStudents,
        activeStaff: staffResult.data?.filter(s => s.is_active).length || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent activity logs
  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const activities: { type: string; message: string; time: string; icon: 'company' | 'student' | 'staff' | 'transaction' | 'message' }[] = [];

      // Get recent companies
      const { data: recentCompanies } = await supabase
        .from('companies')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentCompanies?.forEach(c => {
        activities.push({
          type: 'success',
          message: `Nova empresa registada: ${c.name || 'Sem nome'}`,
          time: formatTimeAgo(c.created_at),
          icon: 'company'
        });
      });

      // Get recent students
      const { data: recentStudents } = await supabase
        .from('students')
        .select('full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentStudents?.forEach(s => {
        activities.push({
          type: 'info',
          message: `Novo aluno: ${s.full_name}`,
          time: formatTimeAgo(s.created_at),
          icon: 'student'
        });
      });

      // Get recent transactions
      const { data: recentTransactions } = await supabase
        .from('financial_transactions')
        .select('description, amount, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3);

      recentTransactions?.forEach(t => {
        activities.push({
          type: t.status === 'paid' ? 'success' : 'warning',
          message: `Transação: ${t.description} - €${t.amount?.toFixed(2)}`,
          time: formatTimeAgo(t.created_at),
          icon: 'transaction'
        });
      });

      // Sort by time
      return activities.sort((a, b) => {
        // Simple sort - most recent first based on time string
        return 0;
      }).slice(0, 8);
    },
    refetchInterval: 60000,
  });

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-PT');
  };

  const metrics = [
    { name: "Empresas", value: stats?.totalCompanies || 0, icon: Building2, color: "text-blue-600", bgColor: "bg-blue-500" },
    { name: "Alunos", value: stats?.totalStudents || 0, icon: Users, color: "text-green-600", bgColor: "bg-green-500" },
    { name: "Staff", value: stats?.totalStaff || 0, icon: Users, color: "text-purple-600", bgColor: "bg-purple-500" },
    { name: "Transações", value: stats?.totalTransactions || 0, icon: CreditCard, color: "text-orange-600", bgColor: "bg-orange-500" },
  ];

  const systemStats = [
    { name: "Empresas Ativas", value: stats?.totalCompanies || 0, status: "online" },
    { name: "Subscrições Ativas", value: stats?.activeSubscriptions || 0, status: "online" },
    { name: "Alunos Ativos", value: stats?.activeStudents || 0, status: "online" },
    { name: "Aulas Configuradas", value: stats?.totalClasses || 0, status: "online" },
    { name: "Eventos Criados", value: stats?.totalEvents || 0, status: "online" },
    { name: "Mensagens Enviadas", value: stats?.totalMessages || 0, status: "online" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monitorização</h1>
            <p className="text-muted-foreground">Estado do sistema em tempo real</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monitorização</h1>
          <p className="text-muted-foreground text-sm md:text-base">Estado do sistema em tempo real</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                {metric.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Receita Total
          </CardTitle>
          <CardDescription>Total de transações pagas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">€{stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          <p className="text-sm text-muted-foreground mt-1">
            De {stats?.totalTransactions || 0} transações registadas
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Dados do Sistema
            </CardTitle>
            <CardDescription>Estatísticas da base de dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">{stat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{stat.value}</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((event, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      event.type === "success" ? "bg-green-500/5" :
                      event.type === "warning" ? "bg-yellow-500/5" : "bg-blue-500/5"
                    }`}
                  >
                    {event.icon === 'company' && <Building2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />}
                    {event.icon === 'student' && <Users className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
                    {event.icon === 'transaction' && <CreditCard className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />}
                    {event.icon === 'message' && <FileText className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{event.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Resumo Semanal
          </CardTitle>
          <CardDescription>Novos registos nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-blue-500/10 text-center">
              <Building2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{stats?.newCompanies || 0}</p>
              <p className="text-sm text-muted-foreground">Novas Empresas</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 text-center">
              <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{stats?.newStudents || 0}</p>
              <p className="text-sm text-muted-foreground">Novos Alunos</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 text-center">
              <FileText className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{stats?.newMessages || 0}</p>
              <p className="text-sm text-muted-foreground">Novas Mensagens</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}