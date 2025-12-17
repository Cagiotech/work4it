import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Apple, Plus, Trash2, Pencil, Utensils, Loader2, Moon,
  Coffee, Sun, Sunset, Moon as MoonIcon, Cookie
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  { value: "evening_snack", label: "Ceia", icon: MoonIcon },
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
  sort_order: number;
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
  created_at: string;
  days: NutritionDay[];
}

interface StudentNutritionTabNewProps {
  studentId: string;
  canEdit: boolean;
}

export function StudentNutritionTabNew({ studentId, canEdit }: StudentNutritionTabNewProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addingMeal, setAddingMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingDayMacros, setEditingDayMacros] = useState(false);
  const [saving, setSaving] = useState(false);

  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
  });

  const [mealForm, setMealForm] = useState({
    meal_type: "breakfast",
    meal_time: "",
    description: "",
    foods: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const [dayMacrosForm, setDayMacrosForm] = useState({
    calories_target: "",
    protein_target: "",
    carbs_target: "",
    fat_target: "",
    notes: "",
  });

  useEffect(() => {
    fetchPlans();
  }, [studentId]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('nutrition_meal_plans')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      const plansWithDays: NutritionPlan[] = [];

      for (const plan of plansData || []) {
        const { data: daysData } = await supabase
          .from('nutrition_plan_days')
          .select('*')
          .eq('plan_id', plan.id)
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

        plansWithDays.push({
          ...plan,
          days: daysWithMeals,
        });
      }

      setPlans(plansWithDays);
      if (plansWithDays.length > 0 && !selectedPlan) {
        const activePlan = plansWithDays.find(p => p.is_active) || plansWithDays[0];
        setSelectedPlan(activePlan);
      }
    } catch (error: any) {
      console.error('Error fetching nutrition plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { data: newPlan, error: planError } = await supabase
        .from('nutrition_meal_plans')
        .insert({
          student_id: studentId,
          title: planForm.title,
          description: planForm.description || null,
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create 7 days for the plan
      const daysToInsert = WEEK_DAYS.map(day => ({
        plan_id: newPlan.id,
        day_of_week: day.value,
        calories_target: 2000,
        protein_target: 150,
        carbs_target: 200,
        fat_target: 70,
      }));

      const { error: daysError } = await supabase
        .from('nutrition_plan_days')
        .insert(daysToInsert);

      if (daysError) throw daysError;

      toast.success("Plano nutricional criado!");
      setIsCreatingPlan(false);
      setPlanForm({ title: "", description: "" });
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar plano");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await supabase
        .from('nutrition_meal_plans')
        .delete()
        .eq('id', confirmDeleteId);

      if (error) throw error;
      toast.success("Plano removido");
      setConfirmDeleteId(null);
      if (selectedPlan?.id === confirmDeleteId) {
        setSelectedPlan(null);
      }
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover plano");
    }
  };

  const togglePlanActive = async (plan: NutritionPlan) => {
    try {
      const { error } = await supabase
        .from('nutrition_meal_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      toast.success(plan.is_active ? "Plano desativado" : "Plano ativado");
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar plano");
    }
  };

  const handleAddMeal = async () => {
    if (!selectedPlan || !mealForm.meal_type) {
      toast.error("Tipo de refeição é obrigatório");
      return;
    }

    const day = selectedPlan.days.find(d => d.day_of_week === selectedDay);
    if (!day) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('nutrition_plan_meals')
        .insert({
          day_id: day.id,
          meal_type: mealForm.meal_type,
          meal_time: mealForm.meal_time || null,
          description: mealForm.description || null,
          foods: mealForm.foods || null,
          calories: mealForm.calories ? parseInt(mealForm.calories) : null,
          protein: mealForm.protein ? parseInt(mealForm.protein) : null,
          carbs: mealForm.carbs ? parseInt(mealForm.carbs) : null,
          fat: mealForm.fat ? parseInt(mealForm.fat) : null,
          sort_order: day.meals.length,
        });

      if (error) throw error;
      toast.success("Refeição adicionada!");
      setAddingMeal(false);
      resetMealForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar refeição");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMeal = async () => {
    if (!editingMeal) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('nutrition_plan_meals')
        .update({
          meal_type: mealForm.meal_type,
          meal_time: mealForm.meal_time || null,
          description: mealForm.description || null,
          foods: mealForm.foods || null,
          calories: mealForm.calories ? parseInt(mealForm.calories) : null,
          protein: mealForm.protein ? parseInt(mealForm.protein) : null,
          carbs: mealForm.carbs ? parseInt(mealForm.carbs) : null,
          fat: mealForm.fat ? parseInt(mealForm.fat) : null,
        })
        .eq('id', editingMeal.id);

      if (error) throw error;
      toast.success("Refeição atualizada!");
      setEditingMeal(null);
      resetMealForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar refeição");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_plan_meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
      toast.success("Refeição removida");
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover refeição");
    }
  };

  const handleUpdateDayMacros = async () => {
    const day = selectedPlan?.days.find(d => d.day_of_week === selectedDay);
    if (!day) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('nutrition_plan_days')
        .update({
          calories_target: dayMacrosForm.calories_target ? parseInt(dayMacrosForm.calories_target) : null,
          protein_target: dayMacrosForm.protein_target ? parseInt(dayMacrosForm.protein_target) : null,
          carbs_target: dayMacrosForm.carbs_target ? parseInt(dayMacrosForm.carbs_target) : null,
          fat_target: dayMacrosForm.fat_target ? parseInt(dayMacrosForm.fat_target) : null,
          notes: dayMacrosForm.notes || null,
        })
        .eq('id', day.id);

      if (error) throw error;
      toast.success("Metas atualizadas!");
      setEditingDayMacros(false);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar metas");
    } finally {
      setSaving(false);
    }
  };

  const resetMealForm = () => {
    setMealForm({
      meal_type: "breakfast",
      meal_time: "",
      description: "",
      foods: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
  };

  const openEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setMealForm({
      meal_type: meal.meal_type,
      meal_time: meal.meal_time || "",
      description: meal.description || "",
      foods: meal.foods || "",
      calories: meal.calories?.toString() || "",
      protein: meal.protein?.toString() || "",
      carbs: meal.carbs?.toString() || "",
      fat: meal.fat?.toString() || "",
    });
  };

  const openEditDayMacros = () => {
    const day = selectedPlan?.days.find(d => d.day_of_week === selectedDay);
    if (day) {
      setDayMacrosForm({
        calories_target: day.calories_target?.toString() || "",
        protein_target: day.protein_target?.toString() || "",
        carbs_target: day.carbs_target?.toString() || "",
        fat_target: day.fat_target?.toString() || "",
        notes: day.notes || "",
      });
      setEditingDayMacros(true);
    }
  };

  const getMealTypeLabel = (type: string) => {
    return MEAL_TYPES.find(m => m.value === type)?.label || type;
  };

  const getMealTypeIcon = (type: string) => {
    const MealIcon = MEAL_TYPES.find(m => m.value === type)?.icon || Utensils;
    return MealIcon;
  };

  const currentDay = selectedPlan?.days.find(d => d.day_of_week === selectedDay);

  // Calculate totals for current day
  const dayTotals = currentDay?.meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fat: acc.fat + (meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Planos Nutricionais</h3>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => setIsCreatingPlan(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Plano
            </Button>
          )}
        </div>

        {/* Plan Selector */}
        {plans.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plans.map((plan) => (
              <Button
                key={plan.id}
                variant={selectedPlan?.id === plan.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlan(plan)}
                className="gap-2"
              >
                {plan.title}
                {plan.is_active && (
                  <Badge variant="secondary" className="text-xs">Ativo</Badge>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Selected Plan */}
        {selectedPlan ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedPlan.title}</CardTitle>
                  {selectedPlan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedPlan.description}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlanActive(selectedPlan)}
                    >
                      {selectedPlan.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDeleteId(selectedPlan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Week Days Tabs */}
              <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                <TabsList className="grid grid-cols-7 w-full">
                  {WEEK_DAYS.map((day) => {
                    const dayData = selectedPlan.days.find(d => d.day_of_week === day.value);
                    const hasMeals = (dayData?.meals.length || 0) > 0;
                    return (
                      <TabsTrigger
                        key={day.value}
                        value={day.value.toString()}
                        className="text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">{day.short}</span>
                        <span className="sm:hidden">{day.short.substring(0, 1)}</span>
                        {hasMeals && (
                          <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {WEEK_DAYS.map((day) => {
                  const dayData = selectedPlan.days.find(d => d.day_of_week === day.value);
                  return (
                    <TabsContent key={day.value} value={day.value.toString()} className="mt-4">
                      {dayData && (
                        <div className="space-y-4">
                          {/* Day Header with Macros */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                            <div>
                              <h4 className="font-medium">{day.label}</h4>
                              <p className="text-xs text-muted-foreground">Metas diárias</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <div className="text-center px-3 py-1 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Calorias</p>
                                <p className="font-semibold text-sm">
                                  {dayTotals.calories}/{dayData.calories_target || 0}
                                </p>
                              </div>
                              <div className="text-center px-3 py-1 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Proteína</p>
                                <p className="font-semibold text-sm text-blue-600">
                                  {dayTotals.protein}/{dayData.protein_target || 0}g
                                </p>
                              </div>
                              <div className="text-center px-3 py-1 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Carbs</p>
                                <p className="font-semibold text-sm text-orange-600">
                                  {dayTotals.carbs}/{dayData.carbs_target || 0}g
                                </p>
                              </div>
                              <div className="text-center px-3 py-1 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Gordura</p>
                                <p className="font-semibold text-sm text-yellow-600">
                                  {dayTotals.fat}/{dayData.fat_target || 0}g
                                </p>
                              </div>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={openEditDayMacros}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Meals List */}
                          {dayData.meals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                              <Utensils className="h-8 w-8 mb-2 opacity-50" />
                              <p className="text-sm mb-3">Nenhuma refeição adicionada</p>
                              {canEdit && (
                                <Button size="sm" onClick={() => setAddingMeal(true)}>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar Refeição
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {dayData.meals.map((meal) => {
                                const MealIcon = getMealTypeIcon(meal.meal_type);
                                return (
                                  <div
                                    key={meal.id}
                                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <MealIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{getMealTypeLabel(meal.meal_type)}</p>
                                        {meal.meal_time && (
                                          <span className="text-xs text-muted-foreground">{meal.meal_time}</span>
                                        )}
                                      </div>
                                      {meal.foods && (
                                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{meal.foods}</p>
                                      )}
                                      {(meal.calories || meal.protein || meal.carbs || meal.fat) && (
                                        <div className="flex flex-wrap gap-2 text-xs mt-2">
                                          {meal.calories && (
                                            <span className="bg-muted px-2 py-0.5 rounded">{meal.calories} kcal</span>
                                          )}
                                          {meal.protein && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">P: {meal.protein}g</span>
                                          )}
                                          {meal.carbs && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">C: {meal.carbs}g</span>
                                          )}
                                          {meal.fat && (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">G: {meal.fat}g</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {canEdit && (
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => openEditMeal(meal)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteMeal(meal.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setAddingMeal(true)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Adicionar Refeição
                                </Button>
                              )}
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
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Apple className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum plano nutricional</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie um plano nutricional personalizado para este aluno.
              </p>
              {canEdit && (
                <Button onClick={() => setIsCreatingPlan(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Plano Nutricional
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={isCreatingPlan} onOpenChange={setIsCreatingPlan}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Plano Nutricional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={planForm.title}
                onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                placeholder="Ex: Dieta Hipercalórica"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Descrição geral do plano..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreatingPlan(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePlan} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Plano
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Meal Dialog */}
      <Dialog open={addingMeal || !!editingMeal} onOpenChange={(open) => {
        if (!open) {
          setAddingMeal(false);
          setEditingMeal(null);
          resetMealForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMeal ? "Editar Refeição" : "Adicionar Refeição"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Refeição *</Label>
                <Select
                  value={mealForm.meal_type}
                  onValueChange={(v) => setMealForm({ ...mealForm, meal_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={mealForm.meal_time}
                  onChange={(e) => setMealForm({ ...mealForm, meal_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alimentos</Label>
              <Textarea
                value={mealForm.foods}
                onChange={(e) => setMealForm({ ...mealForm, foods: e.target.value })}
                placeholder="Lista de alimentos e quantidades..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Calorias</Label>
                <Input
                  type="number"
                  value={mealForm.calories}
                  onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Proteína (g)</Label>
                <Input
                  type="number"
                  value={mealForm.protein}
                  onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Carbs (g)</Label>
                <Input
                  type="number"
                  value={mealForm.carbs}
                  onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Gordura (g)</Label>
                <Input
                  type="number"
                  value={mealForm.fat}
                  onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setAddingMeal(false);
                setEditingMeal(null);
                resetMealForm();
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={editingMeal ? handleUpdateMeal : handleAddMeal} 
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMeal ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Day Macros Dialog */}
      <Dialog open={editingDayMacros} onOpenChange={setEditingDayMacros}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Metas Diárias - {WEEK_DAYS.find(d => d.value === selectedDay)?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calorias (kcal)</Label>
                <Input
                  type="number"
                  value={dayMacrosForm.calories_target}
                  onChange={(e) => setDayMacrosForm({ ...dayMacrosForm, calories_target: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  value={dayMacrosForm.protein_target}
                  onChange={(e) => setDayMacrosForm({ ...dayMacrosForm, protein_target: e.target.value })}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label>Carboidratos (g)</Label>
                <Input
                  type="number"
                  value={dayMacrosForm.carbs_target}
                  onChange={(e) => setDayMacrosForm({ ...dayMacrosForm, carbs_target: e.target.value })}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  value={dayMacrosForm.fat_target}
                  onChange={(e) => setDayMacrosForm({ ...dayMacrosForm, fat_target: e.target.value })}
                  placeholder="70"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={dayMacrosForm.notes}
                onChange={(e) => setDayMacrosForm({ ...dayMacrosForm, notes: e.target.value })}
                placeholder="Observações para este dia..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingDayMacros(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDayMacros} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Plano Nutricional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este plano? Todas as refeições serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePlan}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}