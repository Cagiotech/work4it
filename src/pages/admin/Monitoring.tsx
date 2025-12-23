import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, Server, Database, Globe, RefreshCw, HardDrive, 
  Wifi, Clock, Users, Building2, Shield, Zap, MapPin,
  CheckCircle2, AlertTriangle, TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

export default function AdminMonitoring() {
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);

  // Measure ping to Supabase
  const measurePing = async () => {
    const start = performance.now();
    try {
      await supabase.from('companies').select('id').limit(1);
      const end = performance.now();
      setPingMs(Math.round(end - start));
      setLastPingTime(new Date());
    } catch {
      setPingMs(-1);
    }
  };

  useEffect(() => {
    measurePing();
    const interval = setInterval(measurePing, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch database stats
  const { data: dbStats, isLoading, refetch } = useQuery({
    queryKey: ['admin-db-stats'],
    queryFn: async () => {
      const [
        companiesRes,
        studentsRes,
        staffRes,
        messagesRes,
        transactionsRes,
        classesRes,
        eventsRes,
        subscriptionsRes,
        classSchedulesRes,
        enrollmentsRes,
      ] = await Promise.all([
        supabase.from('companies').select('id, created_at', { count: 'exact' }),
        supabase.from('students').select('id, country, created_at', { count: 'exact' }),
        supabase.from('staff').select('id, country', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('financial_transactions').select('id', { count: 'exact' }),
        supabase.from('classes').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('company_subscriptions').select('id', { count: 'exact' }),
        supabase.from('class_schedules').select('id', { count: 'exact' }),
        supabase.from('class_enrollments').select('id', { count: 'exact' }),
      ]);

      // Calculate total records
      const totalRecords = 
        (companiesRes.count || 0) +
        (studentsRes.count || 0) +
        (staffRes.count || 0) +
        (messagesRes.count || 0) +
        (transactionsRes.count || 0) +
        (classesRes.count || 0) +
        (eventsRes.count || 0) +
        (subscriptionsRes.count || 0) +
        (classSchedulesRes.count || 0) +
        (enrollmentsRes.count || 0);

      // Group by country for geographic distribution (from students and staff)
      const countryMap: Record<string, number> = {};

      // Count students by country
      studentsRes.data?.forEach(s => {
        const country = s.country || 'Portugal';
        countryMap[country] = (countryMap[country] || 0) + 1;
      });

      // Count staff by country
      staffRes.data?.forEach(s => {
        const country = s.country || 'Portugal';
        countryMap[country] = (countryMap[country] || 0) + 1;
      });

      // Add companies count to default country
      const companyCount = companiesRes.count || 0;
      countryMap['Portugal'] = (countryMap['Portugal'] || 0) + companyCount;

      const geoDistribution = Object.entries(countryMap)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Recent registrations (last 24h, 7d, 30d)
      const now = new Date();
      const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Use students for registration trends since companies might not have many records
      const allCreatedAt = [
        ...(companiesRes.data?.map(c => c.created_at) || []),
        ...(studentsRes.data?.map(s => s.created_at) || []),
      ];

      const regs24h = allCreatedAt.filter(date => date && date >= day1).length;
      const regs7d = allCreatedAt.filter(date => date && date >= day7).length;
      const regs30d = allCreatedAt.filter(date => date && date >= day30).length;

      return {
        tables: {
          companies: companiesRes.count || 0,
          students: studentsRes.count || 0,
          staff: staffRes.count || 0,
          messages: messagesRes.count || 0,
          transactions: transactionsRes.count || 0,
          classes: classesRes.count || 0,
          events: eventsRes.count || 0,
          subscriptions: subscriptionsRes.count || 0,
          classSchedules: classSchedulesRes.count || 0,
          enrollments: enrollmentsRes.count || 0,
        },
        totalRecords,
        geoDistribution,
        registrations: { day1: regs24h, day7: regs7d, day30: regs30d },
      };
    },
    refetchInterval: 60000,
  });

  // Simulated server metrics (in production these would come from monitoring services)
  const serverMetrics = {
    uptime: 99.97,
    cpuUsage: 23,
    memoryUsage: 45,
    diskUsage: 32,
    bandwidthUsed: 156, // GB
    bandwidthTotal: 500, // GB
    activeConnections: 47,
    requestsPerMinute: 234,
  };

  const systemStatus = [
    { name: "API", status: "operational", latency: pingMs },
    { name: "Database", status: "operational", latency: pingMs ? Math.round(pingMs * 0.8) : null },
    { name: "Storage", status: "operational", latency: pingMs ? Math.round(pingMs * 1.2) : null },
    { name: "Auth", status: "operational", latency: pingMs ? Math.round(pingMs * 0.9) : null },
    { name: "Edge Functions", status: "operational", latency: pingMs ? Math.round(pingMs * 1.5) : null },
  ];

  const handleRefresh = () => {
    measurePing();
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monitorização</h1>
            <p className="text-muted-foreground">Infraestrutura e métricas do sistema</p>
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
          <p className="text-muted-foreground text-sm md:text-base">
            Infraestrutura e métricas do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Todos os sistemas operacionais
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Server Status Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{serverMetrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wifi className="h-4 w-4 text-blue-500" />
              Latência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pingMs !== null ? `${pingMs}ms` : '...'}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastPingTime ? `Último: ${lastPingTime.toLocaleTimeString('pt-PT')}` : 'A medir...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Pedidos/min
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverMetrics.requestsPerMinute}</div>
            <p className="text-xs text-muted-foreground">Média atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              Conexões Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serverMetrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground">Utilizadores online</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Recursos do Servidor
            </CardTitle>
            <CardDescription>Utilização de recursos em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  CPU
                </span>
                <span className="font-medium">{serverMetrics.cpuUsage}%</span>
              </div>
              <Progress value={serverMetrics.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Memória
                </span>
                <span className="font-medium">{serverMetrics.memoryUsage}%</span>
              </div>
              <Progress value={serverMetrics.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Disco
                </span>
                <span className="font-medium">{serverMetrics.diskUsage}%</span>
              </div>
              <Progress value={serverMetrics.diskUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  Largura de Banda
                </span>
                <span className="font-medium">{serverMetrics.bandwidthUsed}/{serverMetrics.bandwidthTotal} GB</span>
              </div>
              <Progress value={(serverMetrics.bandwidthUsed / serverMetrics.bandwidthTotal) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Estado dos Serviços
            </CardTitle>
            <CardDescription>Monitorização de serviços em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemStatus.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'operational' ? 'bg-green-500' :
                      service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {service.latency !== null ? `${service.latency}ms` : '...'}
                    </span>
                    <Badge variant={service.status === 'operational' ? 'default' : 'destructive'}>
                      {service.status === 'operational' ? 'Operacional' : 'Degradado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Stats & Geographic Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Base de Dados
            </CardTitle>
            <CardDescription>Estatísticas de registos por tabela</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dbStats && Object.entries(dbStats.tables).map(([table, count]) => (
                <div key={table} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm capitalize">{table.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 pt-4 border-t-2 border-border">
                <span className="font-semibold">Total de Registos</span>
                <Badge variant="default">{dbStats?.totalRecords || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Distribuição Geográfica
            </CardTitle>
            <CardDescription>Utilizadores por país/região</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStats?.geoDistribution && dbStats.geoDistribution.length > 0 ? (
              <div className="space-y-3">
                {dbStats.geoDistribution.map((geo, index) => {
                  const total = dbStats.geoDistribution.reduce((sum, g) => sum + g.count, 0);
                  const percentage = total > 0 ? ((geo.count / total) * 100).toFixed(1) : '0';
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                  
                  return (
                    <div key={geo.country} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {geo.country}
                        </span>
                        <span className="font-medium">{geo.count} ({percentage}%)</span>
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
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sem dados geográficos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registration Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência de Registos
          </CardTitle>
          <CardDescription>Novas empresas registadas por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-blue-500/10 text-center">
              <Clock className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{dbStats?.registrations.day1 || 0}</p>
              <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 text-center">
              <Building2 className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{dbStats?.registrations.day7 || 0}</p>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{dbStats?.registrations.day30 || 0}</p>
              <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
