import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Dumbbell, Plus, Trash2, Pencil, Calendar, Target, 
  ChevronDown, ChevronUp, GripVertical, Loader2, X, Save,
  Moon, Play
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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
import { Switch } from "@/components/ui/switch";

const WEEK_DAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", 
  "Pernas", "Glúteos", "Abdominais", "Core", "Cardio", "Full Body"
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
  sort_order: number;
}

interface TrainingDay {
  id: string;
  day_of_week: number;
  title: string | null;
  is_rest_day: boolean;
  notes: string | null;
  exercises: Exercise[];
}

interface TrainingPlan {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  days: TrainingDay[];
}

interface StudentTrainingTabProps {
  studentId: string;
  canEdit: boolean;
}

export function StudentTrainingTab({ studentId, canEdit }: StudentTrainingTabProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addingExercise, setAddingExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  const [exerciseForm, setExerciseForm] = useState({
    exercise_name: "",
    muscle_group: "",
    sets: "",
    reps: "",
    weight: "",
    rest_seconds: "",
    notes: "",
    video_url: "",
  });

  useEffect(() => {
    fetchPlans();
  }, [studentId]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('training_plans')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      const plansWithDays: TrainingPlan[] = [];

      for (const plan of plansData || []) {
        const { data: daysData } = await supabase
          .from('training_plan_days')
          .select('*')
          .eq('plan_id', plan.id)
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

        plansWithDays.push({
          ...plan,
          days: daysWithExercises,
        });
      }

      setPlans(plansWithDays);
      if (plansWithDays.length > 0 && !selectedPlan) {
        const activePlan = plansWithDays.find(p => p.is_active) || plansWithDays[0];
        setSelectedPlan(activePlan);
      }
    } catch (error: any) {
      console.error('Error fetching training plans:', error);
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
      // Create the plan
      const { data: newPlan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          student_id: studentId,
          title: planForm.title,
          description: planForm.description || null,
          goal: planForm.goal || null,
          start_date: planForm.start_date || null,
          end_date: planForm.end_date || null,
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create 7 days for the plan
      const daysToInsert = WEEK_DAYS.map(day => ({
        plan_id: newPlan.id,
        day_of_week: day.value,
        title: day.label,
        is_rest_day: day.value === 0, // Sunday as rest by default
      }));

      const { error: daysError } = await supabase
        .from('training_plan_days')
        .insert(daysToInsert);

      if (daysError) throw daysError;

      toast.success("Plano de treino criado!");
      setIsCreatingPlan(false);
      setPlanForm({ title: "", description: "", goal: "", start_date: "", end_date: "" });
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
        .from('training_plans')
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

  const togglePlanActive = async (plan: TrainingPlan) => {
    try {
      const { error } = await supabase
        .from('training_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      toast.success(plan.is_active ? "Plano desativado" : "Plano ativado");
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar plano");
    }
  };

  const handleAddExercise = async () => {
    if (!selectedPlan || !exerciseForm.exercise_name.trim()) {
      toast.error("Nome do exercício é obrigatório");
      return;
    }

    const day = selectedPlan.days.find(d => d.day_of_week === selectedDay);
    if (!day) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('training_plan_exercises')
        .insert({
          day_id: day.id,
          exercise_name: exerciseForm.exercise_name,
          muscle_group: exerciseForm.muscle_group || null,
          sets: exerciseForm.sets ? parseInt(exerciseForm.sets) : null,
          reps: exerciseForm.reps || null,
          weight: exerciseForm.weight || null,
          rest_seconds: exerciseForm.rest_seconds ? parseInt(exerciseForm.rest_seconds) : null,
          notes: exerciseForm.notes || null,
          video_url: exerciseForm.video_url || null,
          sort_order: day.exercises.length,
        });

      if (error) throw error;
      toast.success("Exercício adicionado!");
      setAddingExercise(false);
      resetExerciseForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar exercício");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('training_plan_exercises')
        .update({
          exercise_name: exerciseForm.exercise_name,
          muscle_group: exerciseForm.muscle_group || null,
          sets: exerciseForm.sets ? parseInt(exerciseForm.sets) : null,
          reps: exerciseForm.reps || null,
          weight: exerciseForm.weight || null,
          rest_seconds: exerciseForm.rest_seconds ? parseInt(exerciseForm.rest_seconds) : null,
          notes: exerciseForm.notes || null,
          video_url: exerciseForm.video_url || null,
        })
        .eq('id', editingExercise.id);

      if (error) throw error;
      toast.success("Exercício atualizado!");
      setEditingExercise(null);
      resetExerciseForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar exercício");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('training_plan_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;
      toast.success("Exercício removido");
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover exercício");
    }
  };

  const toggleRestDay = async (day: TrainingDay) => {
    try {
      const { error } = await supabase
        .from('training_plan_days')
        .update({ is_rest_day: !day.is_rest_day })
        .eq('id', day.id);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar dia");
    }
  };

  const resetExerciseForm = () => {
    setExerciseForm({
      exercise_name: "",
      muscle_group: "",
      sets: "",
      reps: "",
      weight: "",
      rest_seconds: "",
      notes: "",
      video_url: "",
    });
  };

  const openEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      exercise_name: exercise.exercise_name,
      muscle_group: exercise.muscle_group || "",
      sets: exercise.sets?.toString() || "",
      reps: exercise.reps || "",
      weight: exercise.weight || "",
      rest_seconds: exercise.rest_seconds?.toString() || "",
      notes: exercise.notes || "",
      video_url: exercise.video_url || "",
    });
  };

  const currentDay = selectedPlan?.days.find(d => d.day_of_week === selectedDay);

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
            <Dumbbell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Planos de Treino</h3>
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
                  {selectedPlan.goal && (
                    <div className="flex items-center gap-2 mt-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm">{selectedPlan.goal}</span>
                    </div>
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
                    const hasExercises = (dayData?.exercises.length || 0) > 0;
                    const isRest = dayData?.is_rest_day;
                    return (
                      <TabsTrigger
                        key={day.value}
                        value={day.value.toString()}
                        className={`text-xs sm:text-sm ${isRest ? 'opacity-60' : ''}`}
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
                  const dayData = selectedPlan.days.find(d => d.day_of_week === day.value);
                  return (
                    <TabsContent key={day.value} value={day.value.toString()} className="mt-4">
                      {dayData && (
                        <div className="space-y-4">
                          {/* Day Header */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{day.label}</h4>
                            {canEdit && (
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={dayData.is_rest_day}
                                    onCheckedChange={() => toggleRestDay(dayData)}
                                  />
                                  <span className="text-sm text-muted-foreground">Dia de descanso</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {dayData.is_rest_day ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                              <Moon className="h-12 w-12 mb-3 opacity-50" />
                              <p className="text-sm">Dia de descanso</p>
                            </div>
                          ) : (
                            <>
                              {/* Exercises List */}
                              {dayData.exercises.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                  <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
                                  <p className="text-sm mb-3">Nenhum exercício adicionado</p>
                                  {canEdit && (
                                    <Button size="sm" onClick={() => setAddingExercise(true)}>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Adicionar Exercício
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {dayData.exercises.map((exercise, idx) => (
                                    <div
                                      key={exercise.id}
                                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{exercise.exercise_name}</p>
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                          {exercise.muscle_group && (
                                            <Badge variant="outline" className="text-xs">
                                              {exercise.muscle_group}
                                            </Badge>
                                          )}
                                          {exercise.sets && exercise.reps && (
                                            <span>{exercise.sets}x{exercise.reps}</span>
                                          )}
                                          {exercise.weight && (
                                            <span>{exercise.weight}</span>
                                          )}
                                          {exercise.rest_seconds && (
                                            <span>⏱️ {exercise.rest_seconds}s</span>
                                          )}
                                        </div>
                                      </div>
                                      {canEdit && (
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEditExercise(exercise)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteExercise(exercise.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {canEdit && (
                                    <Button
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => setAddingExercise(true)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Adicionar Exercício
                                    </Button>
                                  )}
                                </div>
                              )}
                            </>
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
              <Dumbbell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum plano de treino</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie um plano de treino personalizado para este aluno.
              </p>
              {canEdit && (
                <Button onClick={() => setIsCreatingPlan(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Plano de Treino
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
            <DialogTitle>Novo Plano de Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={planForm.title}
                onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                placeholder="Ex: Hipertrofia - Fase 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Input
                value={planForm.goal}
                onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                placeholder="Ex: Ganho de massa muscular"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={planForm.start_date}
                  onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={planForm.end_date}
                  onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                />
              </div>
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

      {/* Add/Edit Exercise Dialog */}
      <Dialog open={addingExercise || !!editingExercise} onOpenChange={(open) => {
        if (!open) {
          setAddingExercise(false);
          setEditingExercise(null);
          resetExerciseForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExercise ? "Editar Exercício" : "Adicionar Exercício"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Exercício *</Label>
              <Input
                value={exerciseForm.exercise_name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_name: e.target.value })}
                placeholder="Ex: Supino Reto"
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo Muscular</Label>
              <Select
                value={exerciseForm.muscle_group}
                onValueChange={(v) => setExerciseForm({ ...exerciseForm, muscle_group: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Séries</Label>
                <Input
                  type="number"
                  value={exerciseForm.sets}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label>Repetições</Label>
                <Input
                  value={exerciseForm.reps}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                  placeholder="8-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Descanso (s)</Label>
                <Input
                  type="number"
                  value={exerciseForm.rest_seconds}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, rest_seconds: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Carga</Label>
              <Input
                value={exerciseForm.weight}
                onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                placeholder="Ex: 20kg, Peso corporal"
              />
            </div>
            <div className="space-y-2">
              <Label>Link de Vídeo</Label>
              <Input
                value={exerciseForm.video_url}
                onChange={(e) => setExerciseForm({ ...exerciseForm, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={exerciseForm.notes}
                onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                placeholder="Instruções, dicas..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setAddingExercise(false);
                setEditingExercise(null);
                resetExerciseForm();
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={editingExercise ? handleUpdateExercise : handleAddExercise} 
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingExercise ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Plano de Treino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este plano? Todos os exercícios serão removidos.
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