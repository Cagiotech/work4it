import { useTranslation } from "react-i18next";
import { Calendar, Dumbbell, Clock, TrendingUp, Target, Award } from "lucide-react";
import { StudentHeader } from "@/components/student/StudentHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboard() {
  const { t } = useTranslation();

  const upcomingClasses = [
    { name: "Treino Funcional", time: "10:00", trainer: "João Silva", date: "Hoje" },
    { name: "Yoga", time: "18:00", trainer: "Ana Costa", date: "Amanhã" },
    { name: "Musculação", time: "09:00", trainer: "Pedro Martins", date: "Quarta" },
  ];

  const recentProgress = [
    { exercise: "Supino", previous: "60kg", current: "65kg", improvement: "+8%" },
    { exercise: "Agachamento", previous: "80kg", current: "90kg", improvement: "+12%" },
    { exercise: "Peso Morto", previous: "100kg", current: "110kg", improvement: "+10%" },
  ];

  return (
    <>
      <StudentHeader title={t("student.dashboard")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground">
          <h2 className="font-heading text-2xl font-bold mb-2">
            Olá, Maria! 👋
          </h2>
          <p className="opacity-90">
            Tens uma aula agendada para hoje às 10:00. Continua o bom trabalho!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Aulas Este Mês"
            value={12}
            icon={Calendar}
            trend="up"
            trendValue="+3 vs. mês passado"
          />
          <StatCard
            title="Treinos Completos"
            value={45}
            icon={Dumbbell}
            trend="up"
            trendValue="Meta: 50"
          />
          <StatCard
            title="Horas de Treino"
            value="18h"
            icon={Clock}
          />
          <StatCard
            title="Sequência Atual"
            value="8 dias"
            icon={Award}
            className="border-l-4 border-l-primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Próximas Aulas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((classItem, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{classItem.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          com {classItem.trainer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-primary text-primary">
                        {classItem.date}
                      </Badge>
                      <p className="text-sm font-medium text-foreground mt-1">{classItem.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Objetivo Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Treinos</span>
                  <span className="font-medium text-foreground">4/5</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Calorias</span>
                  <span className="font-medium text-foreground">2800/3500</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Água (L)</span>
                  <span className="font-medium text-foreground">2.5/3</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Estás a 1 treino de atingir o objetivo! 💪
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProgress.map((item, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border">
                  <h4 className="font-semibold text-foreground">{item.exercise}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-muted-foreground line-through">{item.previous}</span>
                    <span className="text-lg font-bold text-primary">{item.current}</span>
                  </div>
                  <Badge variant="outline" className="mt-2 border-success text-success">
                    {item.improvement}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
