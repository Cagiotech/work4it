import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Clock, CheckCircle, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { title: "Total de Alunos", value: "24", icon: Users, change: "+2 este mês", trend: "up" },
  { title: "Aulas Hoje", value: "6", icon: Calendar, change: "3 concluídas", trend: "neutral" },
  { title: "Taxa de Presença", value: "94%", icon: CheckCircle, change: "+2% vs semana passada", trend: "up" },
  { title: "Rendimento Mensal", value: "€2.450", icon: DollarSign, change: "+€200 vs mês passado", trend: "up" },
];

const todayClasses = [
  { time: "08:00", student: "Maria Santos", type: "Musculação", status: "concluída" },
  { time: "09:30", student: "Pedro Costa", type: "Funcional", status: "concluída" },
  { time: "11:00", student: "Ana Ferreira", type: "Pilates", status: "concluída" },
  { time: "14:00", student: "João Oliveira", type: "Musculação", status: "em curso" },
  { time: "16:00", student: "Sofia Rodrigues", type: "HIIT", status: "pendente" },
  { time: "17:30", student: "Miguel Almeida", type: "Funcional", status: "pendente" },
];

const recentStudents = [
  { name: "Maria Santos", plan: "Premium", lastSession: "Hoje", progress: 85 },
  { name: "Pedro Costa", plan: "Básico", lastSession: "Hoje", progress: 72 },
  { name: "Ana Ferreira", plan: "Premium", lastSession: "Hoje", progress: 90 },
  { name: "João Oliveira", plan: "Intermédio", lastSession: "Ontem", progress: 65 },
];

export default function PersonalDashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Personal</h1>
        <p className="text-muted-foreground text-sm md:text-base">Bem-vindo de volta, João! Aqui está o resumo do seu dia.</p>
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
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agenda de Hoje
            </CardTitle>
            <CardDescription>As suas aulas programadas para hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.map((cls, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-sm font-medium">{cls.time}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base">{cls.student}</p>
                      <p className="text-xs text-muted-foreground">{cls.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      cls.status === "concluída"
                        ? "default"
                        : cls.status === "em curso"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {cls.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Alunos Recentes
            </CardTitle>
            <CardDescription>Progresso dos seus alunos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.map((student, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{student.name}</p>
                      <Badge variant="outline" className="text-xs ml-2">
                        {student.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{student.progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última sessão: {student.lastSession}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Todos os Alunos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
