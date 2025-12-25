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
import { 
  BarChart3, TrendingUp, Download, Building2, CreditCard, 
  Calendar, ArrowUpRight, ArrowDownRight, Users, Clock,
  CheckCircle2, XCircle, AlertCircle, RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminReports() {
  const [period, setPeriod] = useState("month");

  // Fetch SaaS metrics - focused on admin revenue from subscriptions
  const { data: saasMetrics, isLoading, refetch } = useQuery({
    queryKey: ['admin-saas-reports', period],
    queryFn: async () => {
      const now = new Date();
      
      // Get all companies with their subscriptions
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, created_at');

      // Get all subscriptions with plan details
      const { data: subscriptions } = await supabase
        .from('company_subscriptions')
        .select(`
          id, 
          company_id, 
          status, 
          started_at, 
          expires_at, 
          cancelled_at,
          admin_plans (id, name, price, billing_cycle)
        `);

      // Get all plans
      const { data: plans } = await supabase
        .from('admin_plans')
        .select('id, name, price, billing_cycle, is_active');

      // Calculate metrics
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
      const cancelledSubscriptions = subscriptions?.filter(s => s.status === 'cancelled') || [];
      const expiredSubscriptions = subscriptions?.filter(s => s.status === 'expired') || [];
      
      // MRR calculation
      const mrr = activeSubscriptions.reduce((sum, s) => {
        const price = s.admin_plans?.price || 0;
        const cycle = s.admin_plans?.billing_cycle || 'monthly';
        // Convert to monthly if annual
        return sum + (cycle === 'yearly' ? price / 12 : price);
      }, 0);
      
      const arr = mrr * 12;

      // Companies with/without subscription
      const companiesWithSub = new Set(activeSubscriptions.map(s => s.company_id));
      const companiesWithoutSub = (companies || []).filter(c => !companiesWithSub.has(c.id));

      // Growth calculations - last 6 months
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const newCompanies = (companies || []).filter(c => {
          const created = new Date(c.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length;

        const newSubs = (subscriptions || []).filter(s => {
          const started = new Date(s.started_at);
          return started >= monthStart && started <= monthEnd;
        }).length;

        monthlyGrowth.push({
          month: format(monthStart, 'MMM yyyy', { locale: pt }),
          newCompanies,
          newSubscriptions: newSubs,
        });
      }

      // Revenue by plan
      const revenueByPlan = (plans || []).map(plan => {
        const planSubs = activeSubscriptions.filter(s => s.admin_plans?.id === plan.id);
        const monthlyRevenue = planSubs.reduce((sum, s) => {
          const price = s.admin_plans?.price || 0;
          const cycle = s.admin_plans?.billing_cycle || 'monthly';
          return sum + (cycle === 'yearly' ? price / 12 : price);
        }, 0);
        
        return {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          billingCycle: plan.billing_cycle,
          activeCount: planSubs.length,
          monthlyRevenue,
          isActive: plan.is_active,
        };
      }).filter(p => p.activeCount > 0 || p.isActive);

      // Companies detail for table
      const companiesDetail = (companies || []).map(company => {
        const subscription = subscriptions?.find(s => s.company_id === company.id && s.status === 'active');
        const allCompanySubs = subscriptions?.filter(s => s.company_id === company.id) || [];
        
        return {
          id: company.id,
          name: company.name || 'Sem nome',
          createdAt: company.created_at,
          subscriptionPlan: subscription?.admin_plans?.name || null,
          subscriptionPrice: subscription?.admin_plans?.price || 0,
          subscriptionStatus: subscription ? 'active' : 
            allCompanySubs.some(s => s.status === 'cancelled') ? 'cancelled' : 'none',
          startedAt: subscription?.started_at || null,
        };
      });

      // Churn rate (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentCancellations = cancelledSubscriptions.filter(s => 
        s.cancelled_at && new Date(s.cancelled_at) >= thirtyDaysAgo
      ).length;
      const churnRate = activeSubscriptions.length > 0 
        ? ((recentCancellations / (activeSubscriptions.length + recentCancellations)) * 100)
        : 0;

      // Average revenue per company
      const arpc = companiesWithSub.size > 0 ? mrr / companiesWithSub.size : 0;

      return {
        totalCompanies: companies?.length || 0,
        companiesWithSubscription: companiesWithSub.size,
        companiesWithoutSubscription: companiesWithoutSub.length,
        activeSubscriptions: activeSubscriptions.length,
        cancelledSubscriptions: cancelledSubscriptions.length,
        expiredSubscriptions: expiredSubscriptions.length,
        mrr,
        arr,
        arpc,
        churnRate,
        monthlyGrowth,
        revenueByPlan,
        companiesDetail,
        plans: plans || [],
      };
    },
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_subscriptions' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_plans' }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const kpis = useMemo(() => [
    { 
      title: "MRR", 
      value: `€${saasMetrics?.mrr?.toFixed(2) || '0.00'}`, 
      description: "Receita Mensal Recorrente",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-500/10"
    },
    { 
      title: "ARR", 
      value: `€${saasMetrics?.arr?.toFixed(2) || '0.00'}`, 
      description: "Receita Anual Recorrente",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    { 
      title: "ARPC", 
      value: `€${saasMetrics?.arpc?.toFixed(2) || '0.00'}`, 
      description: "Receita Média por Cliente",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10"
    },
    { 
      title: "Churn Rate", 
      value: `${saasMetrics?.churnRate?.toFixed(1) || '0.0'}%`, 
      description: "Taxa de cancelamento (30 dias)",
      icon: saasMetrics?.churnRate && saasMetrics.churnRate > 5 ? ArrowDownRight : ArrowUpRight,
      color: saasMetrics?.churnRate && saasMetrics.churnRate > 5 ? "text-red-600" : "text-green-600",
      bgColor: saasMetrics?.churnRate && saasMetrics.churnRate > 5 ? "bg-red-500/10" : "bg-green-500/10"
    },
  ], [saasMetrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Métricas SaaS e análise de receitas</p>
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
          <p className="text-muted-foreground text-sm md:text-base">Métricas SaaS e análise de receitas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
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
          <Button variant="outline" onClick={() => {
            const report = {
              generatedAt: new Date().toISOString(),
              period,
              metrics: saasMetrics,
            };
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={kpi.bgColor}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:flex">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscrições</TabsTrigger>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
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
                <div className="text-3xl font-bold">{saasMetrics?.totalCompanies || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registadas na plataforma
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Com Subscrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{saasMetrics?.companiesWithSubscription || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clientes ativos pagantes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Sem Subscrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{saasMetrics?.companiesWithoutSubscription || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Oportunidade de conversão
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Canceladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{saasMetrics?.cancelledSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Subscrições canceladas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* MRR Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução do MRR
              </CardTitle>
              <CardDescription>Receita mensal recorrente nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {saasMetrics?.monthlyGrowth && saasMetrics.monthlyGrowth.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={saasMetrics.monthlyGrowth.map((m, i) => ({
                      ...m,
                      mrr: saasMetrics.revenueByPlan?.reduce((sum, p) => sum + p.monthlyRevenue, 0) || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="newSubscriptions" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2}
                        name="Novas Subscrições"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sem dados de evolução</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Taxa de Conversão
              </CardTitle>
              <CardDescription>Empresas com subscrição ativa vs total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversão</span>
                  <span className="text-2xl font-bold text-primary">
                    {saasMetrics?.totalCompanies 
                      ? ((saasMetrics.companiesWithSubscription / saasMetrics.totalCompanies) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ 
                      width: `${saasMetrics?.totalCompanies 
                        ? (saasMetrics.companiesWithSubscription / saasMetrics.totalCompanies) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{saasMetrics?.companiesWithSubscription || 0} com subscrição</span>
                  <span>{saasMetrics?.companiesWithoutSubscription || 0} sem subscrição</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue by Plan - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Plano</CardTitle>
                <CardDescription>Distribuição de MRR por tipo de subscrição</CardDescription>
              </CardHeader>
              <CardContent>
                {saasMetrics?.revenueByPlan && saasMetrics.revenueByPlan.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={saasMetrics.revenueByPlan}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="hsl(var(--primary))"
                          dataKey="monthlyRevenue"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {saasMetrics.revenueByPlan.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`€${value.toFixed(2)}`, 'MRR']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma subscrição ativa</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Plano</CardTitle>
                <CardDescription>Empresas e receita por plano</CardDescription>
              </CardHeader>
              <CardContent>
                {saasMetrics?.revenueByPlan && saasMetrics.revenueByPlan.length > 0 ? (
                  <div className="space-y-4">
                    {saasMetrics.revenueByPlan.map((plan, index) => {
                      const totalMRR = saasMetrics.revenueByPlan.reduce((sum, p) => sum + p.monthlyRevenue, 0);
                      const percentage = totalMRR > 0 ? ((plan.monthlyRevenue / totalMRR) * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={plan.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="font-medium">{plan.name}</span>
                              <Badge variant="secondary">{plan.activeCount} empresas</Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">€{plan.monthlyRevenue.toFixed(2)}/mês</p>
                              <p className="text-xs text-muted-foreground">{percentage}% do MRR</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 border-t mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total MRR</span>
                        <span className="text-xl font-bold text-primary">
                          €{saasMetrics.revenueByPlan.reduce((sum, p) => sum + p.monthlyRevenue, 0).toFixed(2)}/mês
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma subscrição ativa</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subscription Status Distribution */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-green-500/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-green-600">{saasMetrics?.activeSubscriptions || 0}</p>
                  <p className="text-sm text-muted-foreground">Subscrições Ativas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-3xl font-bold text-yellow-600">{saasMetrics?.expiredSubscriptions || 0}</p>
                  <p className="text-sm text-muted-foreground">Expiradas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                  <p className="text-3xl font-bold text-red-600">{saasMetrics?.cancelledSubscriptions || 0}</p>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          {/* Growth Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Crescimento Mensal
              </CardTitle>
              <CardDescription>Novos registos e subscrições nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {saasMetrics?.monthlyGrowth && saasMetrics.monthlyGrowth.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={saasMetrics.monthlyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="newCompanies" fill="hsl(var(--primary))" name="Novas Empresas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="newSubscriptions" fill="hsl(var(--chart-2))" name="Novas Subscrições" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sem dados de crescimento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              {saasMetrics?.monthlyGrowth && saasMetrics.monthlyGrowth.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Novas Empresas</TableHead>
                      <TableHead className="text-right">Novas Subscrições</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saasMetrics.monthlyGrowth.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium capitalize">{month.month}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={month.newCompanies > 0 ? "default" : "secondary"}>
                            +{month.newCompanies}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={month.newSubscriptions > 0 ? "default" : "secondary"}>
                            +{month.newSubscriptions}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sem dados de crescimento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Empresas Clientes
              </CardTitle>
              <CardDescription>Lista de todas as empresas e estado da subscrição</CardDescription>
            </CardHeader>
            <CardContent>
              {saasMetrics?.companiesDetail && saasMetrics.companiesDetail.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Data Registo</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Valor/mês</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saasMetrics.companiesDetail
                      .sort((a, b) => b.subscriptionPrice - a.subscriptionPrice)
                      .map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(company.createdAt), 'dd/MM/yyyy', { locale: pt })}
                          </TableCell>
                          <TableCell>
                            {company.subscriptionPlan ? (
                              <Badge variant="outline">{company.subscriptionPlan}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {company.subscriptionStatus === 'active' && (
                              <Badge className="bg-green-500">Ativo</Badge>
                            )}
                            {company.subscriptionStatus === 'cancelled' && (
                              <Badge variant="destructive">Cancelado</Badge>
                            )}
                            {company.subscriptionStatus === 'none' && (
                              <Badge variant="secondary">Sem plano</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {company.subscriptionPrice > 0 
                              ? `€${company.subscriptionPrice.toFixed(2)}`
                              : '-'
                            }
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
      </Tabs>
    </div>
  );
}
