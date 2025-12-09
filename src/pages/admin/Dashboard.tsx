import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, TrendingUp, Activity, AlertTriangle, CheckCircle, CreditCard, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { title: "Total Empresas", value: "48", icon: Building2, change: "+3 este mês", trend: "up" },
  { title: "Total Utilizadores", value: "1,247", icon: Users, change: "+124 este mês", trend: "up" },
  { title: "Receita Mensal", value: "€24,580", icon: CreditCard, change: "+12%", trend: "up" },
  { title: "Uptime Sistema", value: "99.9%", icon: Activity, change: "Último mês", trend: "neutral" },
];

const recentCompanies = [
  { name: "Gym Fitness Pro", plan: "Premium", users: 156, status: "Ativo", date: "Há 2 dias" },
  { name: "CrossFit Lisboa", plan: "Básico", users: 45, status: "Ativo", date: "Há 5 dias" },
  { name: "Yoga Studio Zen", plan: "Intermédio", users: 78, status: "Pendente", date: "Há 1 semana" },
  { name: "Boxing Academy", plan: "Premium", users: 92, status: "Ativo", date: "Há 2 semanas" },
];

const alerts = [
  { type: "warning", message: "3 empresas com pagamento pendente", time: "Há 2h" },
  { type: "info", message: "Nova sugestão no roadmap", time: "Há 4h" },
  { type: "success", message: "Backup automático concluído", time: "Há 6h" },
  { type: "warning", message: "Pico de utilização detectado", time: "Há 8h" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel de Administração</h1>
        <p className="text-muted-foreground text-sm md:text-base">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
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
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-muted-foreground'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Recent Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Empresas Recentes
            </CardTitle>
            <CardDescription>Últimas empresas registadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCompanies.map((company, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{company.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{company.plan}</Badge>
                      <span className="text-xs text-muted-foreground">{company.users} utilizadores</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <Badge variant={company.status === "Ativo" ? "default" : "secondary"} className="text-xs">
                      {company.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{company.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Todas as Empresas
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Alertas do Sistema
            </CardTitle>
            <CardDescription>Notificações e avisos importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.type === "warning"
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : alert.type === "success"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-blue-500/10 border border-blue-500/20"
                  }`}
                >
                  {alert.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  ) : alert.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às funcionalidades mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Building2 className="h-5 w-5" />
              <span className="text-xs">Nova Empresa</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Users className="h-5 w-5" />
              <span className="text-xs">Gerir Utilizadores</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Criar Evento</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Ver Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
