import { useTranslation } from "react-i18next";
import { Dumbbell, Calendar, Clock, ChevronRight, Play, CheckCircle2 } from "lucide-react";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const currentPlan = {
  name: "Hipertrofia - Fase 2",
  trainer: "João Silva",
  startDate: "01 Dezembro 2024",
  endDate: "31 Dezembro 2024",
  progress: 35,
  daysCompleted: 7,
  totalDays: 20,
};

const weekWorkouts = [
  { 
    day: "Segunda", 
    name: "Peito e Tríceps", 
    duration: "60 min",
    exercises: 6,
    completed: true 
  },
  { 
    day: "Terça", 
    name: "Costas e Bíceps", 
    duration: "55 min",
    exercises: 6,
    completed: true 
  },
  { 
    day: "Quarta", 
    name: "Descanso Ativo", 
    duration: "30 min",
    exercises: 3,
    completed: true 
  },
  { 
    day: "Quinta", 
    name: "Pernas", 
    duration: "65 min",
    exercises: 7,
    completed: false 
  },
  { 
    day: "Sexta", 
    name: "Ombros e Core", 
    duration: "50 min",
    exercises: 5,
    completed: false 
  },
  { 
    day: "Sábado", 
    name: "Full Body", 
    duration: "45 min",
    exercises: 8,
    completed: false 
  },
];

const todayWorkout = {
  name: "Pernas",
  exercises: [
    { name: "Agachamento Livre", sets: 4, reps: "8-10", weight: "80kg", rest: "90s" },
    { name: "Leg Press", sets: 4, reps: "10-12", weight: "150kg", rest: "60s" },
    { name: "Extensão de Pernas", sets: 3, reps: "12-15", weight: "45kg", rest: "45s" },
    { name: "Flexão de Pernas", sets: 3, reps: "12-15", weight: "35kg", rest: "45s" },
    { name: "Elevação de Gémeos", sets: 4, reps: "15-20", weight: "60kg", rest: "45s" },
    { name: "Lunges", sets: 3, reps: "10 cada", weight: "20kg", rest: "60s" },
    { name: "Prancha", sets: 3, reps: "60s", weight: "-", rest: "30s" },
  ]
};

export default function TrainingPlans() {
  const { t } = useTranslation();

  return (
    <>
      <StudentHeader title={t("student.plans")} />
      
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Current Plan Overview */}
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Badge className="mb-2">Plano Atual</Badge>
                <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                  {currentPlan.name}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  Personal: {currentPlan.trainer} • {currentPlan.startDate} - {currentPlan.endDate}
                </p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-3xl font-bold text-primary">{currentPlan.progress}%</div>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.daysCompleted}/{currentPlan.totalDays} dias
                </p>
              </div>
            </div>
            <Progress value={currentPlan.progress} className="h-2 mt-4" />
          </CardContent>
        </Card>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex">
            <TabsTrigger value="today">Treino de Hoje</TabsTrigger>
            <TabsTrigger value="week">Plano Semanal</TabsTrigger>
          </TabsList>

          {/* Today's Workout */}
          <TabsContent value="today" className="mt-4 md:mt-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 md:pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    {todayWorkout.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {todayWorkout.exercises.length} exercícios • ~65 minutos
                  </p>
                </div>
                <Button className="gap-2 w-full sm:w-auto">
                  <Play className="h-4 w-4" />
                  Iniciar Treino
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {todayWorkout.exercises.map((exercise, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 md:p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-foreground text-sm md:text-base truncate">{exercise.name}</h4>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {exercise.sets} séries × {exercise.reps} • {exercise.weight}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <Badge variant="outline" className="hidden sm:flex text-xs">{exercise.rest}</Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Plan */}
          <TabsContent value="week" className="mt-4 md:mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {weekWorkouts.map((workout, index) => (
                <Card 
                  key={index}
                  className={`hover:shadow-lg transition-all ${
                    workout.completed ? "opacity-75" : ""
                  } ${workout.day === "Quinta" ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <Badge variant={workout.completed ? "secondary" : "default"} className="text-xs">
                        {workout.day}
                      </Badge>
                      {workout.completed && (
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-success" />
                      )}
                    </div>
                    <h4 className="font-semibold text-foreground text-sm md:text-base">{workout.name}</h4>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        {workout.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3 md:h-4 md:w-4" />
                        {workout.exercises} ex.
                      </div>
                    </div>
                    {!workout.completed && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 text-xs"
                      >
                        Ver Treino
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
