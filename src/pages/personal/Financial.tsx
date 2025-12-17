import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Calendar, Download, Users, Clock, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { pt } from "date-fns/locale";

export default function PersonalFinancial() {
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  // Get staff info and payment config
  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ['personal-staff-financial'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, company_id')
        .eq('user_id', user.id)
        .single();

      if (staffError) throw staffError;

      const { data: paymentConfig } = await supabase
        .from('staff_payment_config')
        .select('*')
        .eq('staff_id', staff.id)
        .single();

      return { staff, paymentConfig };
    },
    staleTime: 5 * 60 * 1000,
  });

  const staffInfo = staffData?.staff;
  const paymentConfig = staffData?.paymentConfig;

  // Get classes and earnings data
  const { data: financialData, isLoading: loadingFinancial } = useQuery({
    queryKey: ['personal-financial-data', staffInfo?.id, period],
    queryFn: async () => {
      if (!staffInfo?.id) return null;

      const now = new Date();
      let startDate: Date, endDate: Date;
      
      if (period === 'month') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      }

      // Get completed classes in period
      const { data: classes, error: classesError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          classes (name)
        `)
        .eq('instructor_id', staffInfo.id)
        .eq('status', 'completed')
        .gte('scheduled_date', format(startDate, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(endDate, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: false });

      if (classesError) throw classesError;

      // Get assigned students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('personal_trainer_id', staffInfo.id)
        .eq('status', 'active');

      // Calculate earnings based on payment config
      const completedClasses = classes?.length || 0;
      let earnings = 0;

      if (paymentConfig) {
        switch (paymentConfig.payment_type) {
          case 'per_class':
            earnings = completedClasses * (paymentConfig.per_class_rate || 0);
            break;
          case 'hourly':
            const totalHours = (classes || []).reduce((acc, cls) => {
              const [sh, sm] = cls.start_time.split(':').map(Number);
              const [eh, em] = cls.end_time.split(':').map(Number);
              return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
            }, 0);
            earnings = totalHours * (paymentConfig.hourly_rate || 0);
            break;
          case 'monthly':
            earnings = paymentConfig.base_salary || 0;
            break;
          default:
            earnings = paymentConfig.base_salary || 0;
        }
      }

      // Get monthly breakdown for last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthClasses = (classes || []).filter(cls => {
          const date = new Date(cls.scheduled_date);
          return date >= monthStart && date <= monthEnd;
        });

        let monthEarnings = 0;
        if (paymentConfig?.payment_type === 'per_class') {
          monthEarnings = monthClasses.length * (paymentConfig.per_class_rate || 0);
        } else if (paymentConfig?.payment_type === 'monthly') {
          monthEarnings = paymentConfig.base_salary || 0;
        }

        monthlyData.push({
          month: format(monthDate, 'MMMM', { locale: pt }),
          classes: monthClasses.length,
          earnings: monthEarnings,
        });
      }

      return {
        classes: classes || [],
        completedClasses,
        studentsCount: studentsCount || 0,
        earnings,
        monthlyData,
        avgPerClass: completedClasses > 0 ? earnings / completedClasses : 0,
      };
    },
    enabled: !!staffInfo?.id,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = loadingStaff || loadingFinancial;

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const stats = [
    { 
      title: "Rendimento", 
      value: formatCurrency(financialData?.earnings || 0), 
      icon: DollarSign, 
      subtitle: period === 'month' ? 'Este mês' : 'Este ano',
    },
    { 
      title: "Aulas Concluídas", 
      value: (financialData?.completedClasses || 0).toString(), 
      icon: Calendar, 
      subtitle: period === 'month' ? 'Este mês' : 'Este ano',
    },
    { 
      title: "Alunos Ativos", 
      value: (financialData?.studentsCount || 0).toString(), 
      icon: Users, 
      subtitle: 'Atribuídos',
    },
    { 
      title: "Média por Aula", 
      value: formatCurrency(financialData?.avgPerClass || 0), 
      icon: TrendingUp, 
      subtitle: 'Estimativa',
    },
  ];

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      monthly: 'Salário Mensal',
      hourly: 'Por Hora',
      per_class: 'Por Aula',
      daily: 'Diário',
      commission: 'Comissão',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Acompanhar os seus rendimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: 'month' | 'year') => setPeriod(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Config Info */}
      {paymentConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Pagamento</CardTitle>
            <CardDescription>Como o seu rendimento é calculado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-semibold">{getPaymentTypeLabel(paymentConfig.payment_type)}</p>
              </div>
              {paymentConfig.base_salary && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Salário Base</p>
                  <p className="font-semibold">{formatCurrency(paymentConfig.base_salary)}</p>
                </div>
              )}
              {paymentConfig.per_class_rate && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Valor por Aula</p>
                  <p className="font-semibold">{formatCurrency(paymentConfig.per_class_rate)}</p>
                </div>
              )}
              {paymentConfig.hourly_rate && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Valor/Hora</p>
                  <p className="font-semibold">{formatCurrency(paymentConfig.hourly_rate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Rendimentos</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-center">Aulas</TableHead>
                  <TableHead className="text-right">Rendimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(financialData?.monthlyData || []).map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium capitalize">{month.month}</TableCell>
                    <TableCell className="text-center">{month.classes}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(month.earnings)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Aulas Recentes</CardTitle>
          <CardDescription>Últimas aulas concluídas</CardDescription>
        </CardHeader>
        <CardContent>
          {(financialData?.classes || []).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhuma aula concluída no período selecionado
            </p>
          ) : (
            <div className="space-y-3">
              {(financialData?.classes || []).slice(0, 10).map((cls: any) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="font-medium">{cls.classes?.name || 'Aula'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(cls.scheduled_date), "d MMM yyyy", { locale: pt })} às {cls.start_time.substring(0, 5)}
                    </p>
                  </div>
                  <Badge variant="default">Concluída</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
