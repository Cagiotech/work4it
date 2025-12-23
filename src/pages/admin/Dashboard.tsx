import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, TrendingUp, Activity, AlertTriangle, CheckCircle, CreditCard, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminStats, useAdminCompanies, useFeatureSuggestions } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: companies, isLoading: companiesLoading } = useAdminCompanies();
  const { data: suggestions } = useFeatureSuggestions();

  const pendingSuggestions = suggestions?.filter((s) => s.status === "pending").length || 0;
  const recentCompanies = companies?.slice(0, 4) || [];

  if (statsLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel de Administração</h1>
          <p className="text-muted-foreground text-sm md:text-base">Visão geral do sistema</p>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel de Administração</h1>
        <p className="text-muted-foreground text-sm md:text-base">Visão geral do sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            <p className="text-xs text-green-600">+{stats?.newCompaniesThisMonth || 0} este mês</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Alunos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-green-600">+{stats?.newStudentsThisMonth || 0} este mês</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeSubscriptions || 0} subscrições ativas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats?.totalStaff || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeStaff || 0} ativos</p>
          </CardContent>
        </Card>
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
            {companiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentCompanies.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhuma empresa registada</p>
            ) : (
              <div className="space-y-4">
                {recentCompanies.map((company: any) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{company.name || "Sem nome"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {company.subscription?.name || "Sem plano"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{company.studentCount} alunos</span>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/admin/companies")}>
              Ver Todas as Empresas
            </Button>
          </CardContent>
        </Card>

        {/* Alerts */}
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
              {pendingSuggestions > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{pendingSuggestions} sugestões pendentes de revisão</p>
                    <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate("/admin/roadmap")}>
                      Ver sugestões
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">Sistema operacional</p>
                  <p className="text-xs text-muted-foreground">Todos os serviços a funcionar</p>
                </div>
              </div>
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
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/companies")}>
              <Building2 className="h-5 w-5" />
              <span className="text-xs">Ver Empresas</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/users")}>
              <Users className="h-5 w-5" />
              <span className="text-xs">Gerir Utilizadores</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/events")}>
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Criar Banner</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/roadmap")}>
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Ver Roadmap</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
