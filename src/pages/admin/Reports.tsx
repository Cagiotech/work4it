import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp, Download, Users, Building2, CreditCard, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminReports() {
  const [period, setPeriod] = useState("month");

  // Fetch companies with detailed stats
  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['admin-reports-companies'],
    queryFn: async () => {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('id, name, created_at');
      
      if (error) throw error;

      // Get stats for each company
      const companiesWithStats = await Promise.all(
        (companiesData || []).map(async (company) => {
          const [studentsRes, staffRes, transactionsRes, subscriptionRes] = await Promise.all([
            supabase.from('students').select('id', { count: 'exact' }).eq('company_id', company.id),
            supabase.from('staff').select('id', { count: 'exact' }).eq('company_id', company.id),
            supabase.from('financial_transactions').select('amount, status, type').eq('company_id', company.id),
            supabase.from('company_subscriptions')
              .select('plan_id, status, admin_plans(name, price)')
              .eq('company_id', company.id)
              .eq('status', 'active')
              .single(),
          ]);

          const paidTransactions = transactionsRes.data?.filter(t => t.status === 'paid' && t.type === 'income') || [];
          const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

          return {
            ...company,
            studentCount: studentsRes.count || 0,
            staffCount: staffRes.count || 0,
            totalRevenue,
            subscriptionPlan: subscriptionRes.data?.admin_plans?.name || 'Sem plano',
            subscriptionPrice: subscriptionRes.data?.admin_plans?.price || 0,
          };
        })
      );

      return companiesWithStats;
    },
  });

  // Fetch overall stats
  const { data: overallStats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-reports-overall'],
    queryFn: async () => {
      const [
        companiesRes,
        studentsRes,
        staffRes,
        transactionsRes,
        subscriptionsRes,
        plansRes,
      ] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact' }),
        supabase.from('students').select('id, status', { count: 'exact' }),
        supabase.from('staff').select('id, is_active', { count: 'exact' }),
        supabase.from('financial_transactions').select('amount, status, type, created_at'),
        supabase.from('company_subscriptions').select('id, status, plan_id, admin_plans(price)'),
        supabase.from('admin_plans').select('id, name, price'),
      ]);

      // Calculate MRR (Monthly Recurring Revenue)
      const activeSubscriptions = subscriptionsRes.data?.filter(s => s.status === 'active') || [];
      const mrr = activeSubscriptions.reduce((sum, s) => sum + (s.admin_plans?.price || 0), 0);
      const arr = mrr * 12;

      // Calculate total revenue from transactions
      const paidTransactions = transactionsRes.data?.filter(t => t.status === 'paid' && t.type === 'income') || [];
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      // This month's revenue
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTransactions = paidTransactions.filter(t => new Date(t.created_at) >= startOfMonth);
      const monthlyRevenue = thisMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        totalCompanies: companiesRes.count || 0,
        totalStudents: studentsRes.count || 0,
        activeStudents: studentsRes.data?.filter(s => s.status === 'active').length || 0,
        totalStaff: staffRes.count || 0,
        activeStaff: staffRes.data?.filter(s => s.is_active).length || 0,
        totalRevenue,
        monthlyRevenue,
        mrr,
        arr,
        activeSubscriptions: activeSubscriptions.length,
        plans: plansRes.data || [],
      };
    },
  });

  // Calculate revenue by plan
  const { data: revenueByPlan } = useQuery({
    queryKey: ['admin-reports-revenue-by-plan'],
    queryFn: async () => {
      const { data: subscriptions } = await supabase
        .from('company_subscriptions')
        .select('plan_id, status, admin_plans(id, name, price)')
        .eq('status', 'active');

      const planRevenue: Record<string, { name: string; revenue: number; count: number }> = {};

      subscriptions?.forEach(sub => {
        if (sub.admin_plans) {
          const planId = sub.admin_plans.id;
          if (!planRevenue[planId]) {
            planRevenue[planId] = {
              name: sub.admin_plans.name,
              revenue: 0,
              count: 0,
            };
          }
          planRevenue[planId].revenue += sub.admin_plans.price || 0;
          planRevenue[planId].count += 1;
        }
      });

      return Object.values(planRevenue);
    },
  });

  const kpis = useMemo(() => [
    { 
      title: "MRR", 
      value: `€${overallStats?.mrr?.toFixed(2) || '0.00'}`, 
      description: "Receita Mensal Recorrente",
      icon: TrendingUp,
      color: "text-green-600"
    },
    { 
      title: "ARR", 
      value: `€${overallStats?.arr?.toFixed(2) || '0.00'}`, 
      description: "Receita Anual Recorrente",
      icon: BarChart3,
      color: "text-blue-600"
    },
    { 
      title: "Receita Mensal", 
      value: `€${overallStats?.monthlyRevenue?.toFixed(2) || '0.00'}`, 
      description: "Este mês",
      icon: CreditCard,
      color: "text-purple-600"
    },
    { 
      title: "Total Transações", 
      value: `€${overallStats?.totalRevenue?.toFixed(2) || '0.00'}`, 
      description: "Todas as transações pagas",
      icon: Activity,
      color: "text-orange-600"
    },
  ], [overallStats]);

  const isLoading = loadingCompanies || loadingStats;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Análise e métricas do sistema</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm md:text-base">Análise e métricas do sistema</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:flex">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="plans">Por Plano</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Total Empresas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats?.totalCompanies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats?.activeSubscriptions || 0} com subscrição ativa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Total Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats?.activeStudents || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Total Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats?.totalStaff || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats?.activeStaff || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  Subscrições Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overallStats?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  De {overallStats?.totalCompanies || 0} empresas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Empresas por Performance
              </CardTitle>
              <CardDescription>Detalhes de cada empresa registada</CardDescription>
            </CardHeader>
            <CardContent>
              {companies && companies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-center">Alunos</TableHead>
                      <TableHead className="text-center">Staff</TableHead>
                      <TableHead className="text-center">Plano</TableHead>
                      <TableHead className="text-right">Receita Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name || 'Sem nome'}</TableCell>
                          <TableCell className="text-center">{company.studentCount}</TableCell>
                          <TableCell className="text-center">{company.staffCount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{company.subscriptionPlan}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            €{company.totalRevenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma empresa registada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Plano</CardTitle>
              <CardDescription>Distribuição de receita por tipo de subscrição</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByPlan && revenueByPlan.length > 0 ? (
                <div className="space-y-4">
                  {revenueByPlan.map((plan, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                    const totalMRR = revenueByPlan.reduce((sum, p) => sum + p.revenue, 0);
                    const percentage = totalMRR > 0 ? ((plan.revenue / totalMRR) * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={plan.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                            <span className="font-medium">{plan.name}</span>
                            <Badge variant="secondary">{plan.count} empresas</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">€{plan.revenue.toFixed(2)}/mês</p>
                            <p className="text-xs text-muted-foreground">{percentage}%</p>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma subscrição ativa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}