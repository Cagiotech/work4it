import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dumbbell, Loader2, Moon, Target, Timer } from "lucide-react";
import { ExerciseTimer } from "@/components/student/ExerciseTimer";

const WEEK_DAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

interface Exercise {
  id: string;
  exercise_name: string;
  muscle_group: string | null;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  rest_seconds: number | null;
  notes: string | null;
  video_url: string | null;
}

interface TrainingDay {
  id: string;
  day_of_week: number;
  title: string | null;
  is_rest_day: boolean;
  exercises: Exercise[];
}

interface TrainingPlan {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  is_active: boolean;
  days: TrainingDay[];
}

export default function TrainingPlans() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);

  useEffect(() => {
    fetchActivePlan();
  }, [user?.id]);

  const fetchActivePlan = async () => {
    if (!user?.id) return;

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) return;

      const { data: planData } = await supabase
        .from('training_plans')
        .select('*')
        .eq('student_id', student.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!planData) {
        setPlan(null);
        return;
      }

      const { data: daysData } = await supabase
        .from('training_plan_days')
        .select('*')
        .eq('plan_id', planData.id)
        .order('day_of_week');

      const daysWithExercises: TrainingDay[] = [];

      for (const day of daysData || []) {
        const { data: exercisesData } = await supabase
          .from('training_plan_exercises')
          .select('*')
          .eq('day_id', day.id)
          .order('sort_order');

        daysWithExercises.push({
          ...day,
          exercises: exercisesData || [],
        });
      }

      setPlan({
        ...planData,
        days: daysWithExercises,
      });
    } catch (error) {
      console.error('Error fetching training plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDay = plan?.days.find(d => d.day_of_week === selectedDay);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Dumbbell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Planos de Treino</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            O seu plano de treino aparecerá aqui quando for criado pelo seu Personal Trainer.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                {plan.title}
              </CardTitle>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              )}
              {plan.goal && (
                <div className="flex items-center gap-2 mt-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm">{plan.goal}</span>
                </div>
              )}
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              Ativo
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
            <TabsList className="grid grid-cols-7 w-full">
              {WEEK_DAYS.map((day) => {
                const dayData = plan.days.find(d => d.day_of_week === day.value);
                const hasExercises = (dayData?.exercises.length || 0) > 0;
                const isRest = dayData?.is_rest_day;
                const isToday = new Date().getDay() === day.value;
                return (
                  <TabsTrigger
                    key={day.value}
                    value={day.value.toString()}
                    className={`text-xs sm:text-sm ${isRest ? 'opacity-60' : ''} ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    <span className="hidden sm:inline">{day.short}</span>
                    <span className="sm:hidden">{day.short.substring(0, 1)}</span>
                    {hasExercises && !isRest && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
                    )}
                    {isRest && <Moon className="h-3 w-3 ml-1" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {WEEK_DAYS.map((day) => {
              const dayData = plan.days.find(d => d.day_of_week === day.value);
              return (
                <TabsContent key={day.value} value={day.value.toString()} className="mt-4">
                  {dayData && (
                    <div className="space-y-4">
                      <h4 className="font-medium">{day.label}</h4>

                      {dayData.is_rest_day ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Moon className="h-12 w-12 mb-3 opacity-50" />
                          <p className="text-sm">Dia de descanso</p>
                          <p className="text-xs mt-1">Aproveite para recuperar!</p>
                        </div>
                      ) : dayData.exercises.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">Sem exercícios para este dia</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayData.exercises.map((exercise, idx) => (
                            <div
                              key={exercise.id}
                              className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold">{exercise.exercise_name}</p>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                                  {exercise.muscle_group && (
                                    <Badge variant="outline">{exercise.muscle_group}</Badge>
                                  )}
                                  {exercise.sets && exercise.reps && (
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                                      {exercise.sets}x{exercise.reps}
                                    </span>
                                  )}
                                  {exercise.weight && (
                                    <span className="bg-muted px-2 py-0.5 rounded">
                                      {exercise.weight}
                                    </span>
                                  )}
                                  {exercise.rest_seconds && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => {
                                        setTimerSeconds(exercise.rest_seconds!);
                                        setShowTimer(true);
                                      }}
                                    >
                                      <Timer className="h-3 w-3 mr-1" />
                                      {exercise.rest_seconds}s
                                    </Button>
                                  )}
                                </div>
                                {exercise.notes && (
                                  <p className="text-sm text-muted-foreground mt-2 italic">
                                    {exercise.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <ExerciseTimer
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        initialSeconds={timerSeconds}
      />
    </div>
  );
}