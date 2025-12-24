import { useState, useEffect } from "react";
import { Apple, Flame, Loader2, Coffee, Sun, Sunset, Moon, Cookie, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const WEEK_DAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Pequeno-almoço", icon: Coffee },
  { value: "morning_snack", label: "Lanche da Manhã", icon: Cookie },
  { value: "lunch", label: "Almoço", icon: Sun },
  { value: "afternoon_snack", label: "Lanche da Tarde", icon: Cookie },
  { value: "dinner", label: "Jantar", icon: Sunset },
  { value: "evening_snack", label: "Ceia", icon: Moon },
];

interface Meal {
  id: string;
  meal_type: string;
  meal_time: string | null;
  description: string | null;
  foods: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface NutritionDay {
  id: string;
  day_of_week: number;
  calories_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  notes: string | null;
  meals: Meal[];
}

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  days: NutritionDay[];
}

export default function NutritionPlan() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  useEffect(() => {
    if (user?.id) {
      fetchNutritionPlan();
    }
  }, [user?.id]);

  const fetchNutritionPlan = async () => {
    if (!user) return;

    try {
      // Get student ID
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      // Fetch active nutrition plan with the new structure
      const { data: planData } = await supabase
        .from('nutrition_meal_plans')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!planData) {
        setPlan(null);
        setLoading(false);
        return;
      }

      // Fetch days for this plan
      const { data: daysData } = await supabase
        .from('nutrition_plan_days')
        .select('*')
        .eq('plan_id', planData.id)
        .order('day_of_week');

      const daysWithMeals: NutritionDay[] = [];

      for (const day of daysData || []) {
        const { data: mealsData } = await supabase
          .from('nutrition_plan_meals')
          .select('*')
          .eq('day_id', day.id)
          .order('sort_order');

        daysWithMeals.push({
          ...day,
          meals: mealsData || [],
        });
      }

      setPlan({
        ...planData,
        days: daysWithMeals,
      });
    } catch (error) {
      console.error('Error fetching nutrition plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeLabel = (type: string) => {
    return MEAL_TYPES.find(m => m.value === type)?.label || type;
  };

  const getMealTypeIcon = (type: string) => {
    return MEAL_TYPES.find(m => m.value === type)?.icon || Utensils;
  };

  const currentDay = plan?.days.find(d => d.day_of_week === selectedDay);

  // Calculate totals for current day
  const dayTotals = currentDay?.meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Apple className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Plano Nutricional</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              O seu plano nutricional aparecerá aqui quando for criado pelo seu Personal Trainer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5 text-primary" />
                {plan.title}
              </CardTitle>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
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
                const hasMeals = (dayData?.meals.length || 0) > 0;
                const isToday = new Date().getDay() === day.value;
                return (
                  <TabsTrigger
                    key={day.value}
                    value={day.value.toString()}
                    className={`text-xs sm:text-sm ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    <span className="hidden sm:inline">{day.short}</span>
                    <span className="sm:hidden">{day.short.substring(0, 1)}</span>
                    {hasMeals && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-green-500" />
                    )}
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
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{day.label}</h4>
                      </div>

                      {/* Day Macros */}
                      {(dayData.calories_target || dayData.protein_target || dayData.carbs_target || dayData.fat_target) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/30 border">
                          {dayData.calories_target && (
                            <div className="text-center">
                              <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                              <p className="text-xs text-muted-foreground">Calorias</p>
                              <p className="font-semibold">{dayTotals.calories}/{dayData.calories_target}</p>
                            </div>
                          )}
                          {dayData.protein_target && (
                            <div className="text-center">
                              <span className="text-blue-500 font-bold text-sm">P</span>
                              <p className="text-xs text-muted-foreground">Proteína</p>
                              <p className="font-semibold">{dayTotals.protein}g/{dayData.protein_target}g</p>
                            </div>
                          )}
                          {dayData.carbs_target && (
                            <div className="text-center">
                              <span className="text-orange-500 font-bold text-sm">C</span>
                              <p className="text-xs text-muted-foreground">Hidratos</p>
                              <p className="font-semibold">{dayTotals.carbs}g/{dayData.carbs_target}g</p>
                            </div>
                          )}
                          {dayData.fat_target && (
                            <div className="text-center">
                              <span className="text-yellow-500 font-bold text-sm">G</span>
                              <p className="text-xs text-muted-foreground">Gordura</p>
                              <p className="font-semibold">{dayTotals.fat}g/{dayData.fat_target}g</p>
                            </div>
                          )}
                        </div>
                      )}

                      {dayData.meals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Utensils className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">Sem refeições para este dia</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayData.meals.map((meal) => {
                            const MealIcon = getMealTypeIcon(meal.meal_type);
                            return (
                              <div
                                key={meal.id}
                                className="p-4 bg-muted/30 rounded-lg border"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MealIcon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold">{getMealTypeLabel(meal.meal_type)}</p>
                                      {meal.meal_time && (
                                        <Badge variant="outline" className="text-xs">
                                          {meal.meal_time}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {meal.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{meal.description}</p>
                                    )}
                                    
                                    {meal.foods && (
                                      <div className="mt-2 p-3 bg-background rounded-lg border">
                                        <p className="text-sm whitespace-pre-wrap">{meal.foods}</p>
                                      </div>
                                    )}

                                    {(meal.calories || meal.protein || meal.carbs || meal.fat) && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {meal.calories && (
                                          <Badge variant="secondary" className="text-xs">
                                            🔥 {meal.calories} kcal
                                          </Badge>
                                        )}
                                        {meal.protein && (
                                          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                                            P: {meal.protein}g
                                          </Badge>
                                        )}
                                        {meal.carbs && (
                                          <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600">
                                            C: {meal.carbs}g
                                          </Badge>
                                        )}
                                        {meal.fat && (
                                          <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                                            G: {meal.fat}g
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {dayData.notes && (
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <p className="text-xs text-muted-foreground mb-1">Notas do dia</p>
                          <p className="text-sm">{dayData.notes}</p>
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
    </div>
  );
}