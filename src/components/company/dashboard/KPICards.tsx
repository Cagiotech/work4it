import { useMemo } from "react";
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, CreditCard, Activity, Target, Award, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  stats: {
    totalStudents: number;
    activeClasses: number;
    income: number;
    expenses: number;
    pendingPayments: number;
    pendingStudents: number;
    inactiveStudents: number;
  };
  previousStats?: {
    totalStudents: number;
    income: number;
    expenses: number;
  };
  transactions: any[];
}

export function KPICards({ stats, previousStats, transactions }: KPICardsProps) {
  const kpis = useMemo(() => {
    // Calculate growth percentages
    const studentGrowth = previousStats?.totalStudents 
      ? ((stats.totalStudents - previousStats.totalStudents) / previousStats.totalStudents) * 100 
      : 0;
    
    const revenueGrowth = previousStats?.income
      ? ((stats.income - previousStats.income) / previousStats.income) * 100
      : 0;

    // Calculate profit margin
    const profitMargin = stats.income > 0 
      ? ((stats.income - stats.expenses) / stats.income) * 100 
      : 0;

    // Calculate collection rate
    const totalRevenue = stats.income + stats.pendingPayments;
    const collectionRate = totalRevenue > 0 
      ? (stats.income / totalRevenue) * 100 
      : 100;

    // Calculate retention rate (active / (active + inactive))
    const totalStudentsWithInactive = stats.totalStudents + stats.inactiveStudents;
    const retentionRate = totalStudentsWithInactive > 0
      ? (stats.totalStudents / totalStudentsWithInactive) * 100
      : 100;

    // Average ticket
    const paidTransactions = transactions.filter(t => t.type === 'income' && t.status === 'paid');
    const averageTicket = paidTransactions.length > 0
      ? stats.income / paidTransactions.length
      : 0;

    return {
      studentGrowth,
      revenueGrowth,
      profitMargin,
      collectionRate,
      retentionRate,
      averageTicket,
      profit: stats.income - stats.expenses,
    };
  }, [stats, previousStats, transactions]);

  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Receita Total */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Receita Total</p>
              <p className="text-2xl font-bold mt-1">€{stats.income.toFixed(2)}</p>
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                kpis.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {kpis.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(kpis.revenueGrowth)} vs período anterior
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lucro Líquido */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Lucro Líquido</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                kpis.profit >= 0 ? "text-green-600" : "text-red-600"
              )}>
                €{kpis.profit.toFixed(2)}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Margem</span>
                  <span className="font-medium">{kpis.profitMargin.toFixed(1)}%</span>
                </div>
                <Progress value={Math.max(0, Math.min(100, kpis.profitMargin))} className="h-1.5" />
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Alunos */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Alunos</p>
              <p className="text-2xl font-bold mt-1">{stats.totalStudents}</p>
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                kpis.studentGrowth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {kpis.studentGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(kpis.studentGrowth)} crescimento
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagamentos Pendentes */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pendentes</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">€{stats.pendingPayments.toFixed(2)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Taxa Recebimento</span>
                  <span className="font-medium">{kpis.collectionRate.toFixed(0)}%</span>
                </div>
                <Progress value={kpis.collectionRate} className="h-1.5" />
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <CreditCard className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aulas Ativas */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Aulas Ativas</p>
              <p className="text-2xl font-bold mt-1">{stats.activeClasses}</p>
              <p className="text-xs text-muted-foreground mt-2">Tipos de aula disponíveis</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Retenção */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Retenção</p>
              <p className="text-2xl font-bold mt-1">{kpis.retentionRate.toFixed(0)}%</p>
              <div className="mt-2">
                <Progress value={kpis.retentionRate} className="h-1.5" />
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <Award className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Ticket Médio</p>
              <p className="text-2xl font-bold mt-1">€{kpis.averageTicket.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Por transação</p>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl">
              <Activity className="h-5 w-5 text-pink-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Despesas</p>
              <p className="text-2xl font-bold mt-1 text-red-600">€{stats.expenses.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">{stats.pendingStudents} alunos pendentes</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
