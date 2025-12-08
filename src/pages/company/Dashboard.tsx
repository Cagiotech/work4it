import { useTranslation } from "react-i18next";
import { Users, Calendar, DollarSign, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanyDashboard() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.title")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t("dashboard.totalStudents")}
            value={248}
            icon={Users}
            trend="up"
            trendValue="+12% este mês"
          />
          <StatCard
            title={t("dashboard.activeClasses")}
            value={32}
            icon={Calendar}
            trend="up"
            trendValue="+5 esta semana"
          />
          <StatCard
            title={t("dashboard.monthlyRevenue")}
            value="€12,450"
            icon={DollarSign}
            trend="up"
            trendValue="+8% vs. mês anterior"
          />
          <StatCard
            title={t("dashboard.pendingPayments")}
            value={15}
            icon={AlertCircle}
            trend="down"
            trendValue="-3 vs. semana passada"
            className="border-l-4 border-l-warning"
          />
        </div>

        {/* Charts and Activity */}
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
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Gráfico de receitas</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { text: "Novo aluno registado: Maria Santos", time: "5 min" },
                { text: "Aula de Yoga confirmada", time: "15 min" },
                { text: "Pagamento recebido: €45", time: "1 hora" },
                { text: "Personal João adicionou plano", time: "2 horas" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Aulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Yoga Matinal", time: "08:00", trainer: "Ana Costa", students: 12 },
                { name: "CrossFit", time: "10:00", trainer: "Pedro Silva", students: 8 },
                { name: "Pilates", time: "14:00", trainer: "Marta Reis", students: 15 },
                { name: "Funcional", time: "18:00", trainer: "João Santos", students: 10 },
              ].map((classItem, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors">
                  <h4 className="font-semibold text-foreground">{classItem.name}</h4>
                  <p className="text-primary font-medium">{classItem.time}</p>
                  <p className="text-sm text-muted-foreground mt-1">{classItem.trainer}</p>
                  <p className="text-xs text-muted-foreground">{classItem.students} alunos</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
