import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Apple, Plus, Trash2, Calendar, Pencil } from "lucide-react";
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

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  calories_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  meals: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface StudentNutritionTabProps {
  studentId: string;
  canEdit: boolean;
}

export function StudentNutritionTab({ studentId, canEdit }: StudentNutritionTabProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    calories_target: "",
    protein_target: "",
    carbs_target: "",
    fat_target: "",
    meals: "",
    notes: "",
  });

  useEffect(() => {
    fetchPlans();
  }, [studentId]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('student_nutrition_plans')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching nutrition plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      calories_target: "",
      protein_target: "",
      carbs_target: "",
      fat_target: "",
      meals: "",
      notes: "",
    });
    setIsAdding(false);
    setEditingPlan(null);
  };

  const handleEdit = (plan: NutritionPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || "",
      calories_target: plan.calories_target?.toString() || "",
      protein_target: plan.protein_target?.toString() || "",
      carbs_target: plan.carbs_target?.toString() || "",
      fat_target: plan.fat_target?.toString() || "",
      meals: plan.meals || "",
      notes: plan.notes || "",
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    setConfirmSave(false);
    
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      const payload = {
        student_id: studentId,
        title: formData.title,
        description: formData.description || null,
        calories_target: formData.calories_target ? Number(formData.calories_target) : null,
        protein_target: formData.protein_target ? Number(formData.protein_target) : null,
        carbs_target: formData.carbs_target ? Number(formData.carbs_target) : null,
        fat_target: formData.fat_target ? Number(formData.fat_target) : null,
        meals: formData.meals || null,
        notes: formData.notes || null,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('student_nutrition_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
        toast.success("Plano nutricional atualizado");
      } else {
        const { error } = await supabase
          .from('student_nutrition_plans')
          .insert(payload);
        if (error) throw error;
        toast.success("Plano nutricional criado");
      }

      resetForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar plano");
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await supabase
        .from('student_nutrition_plans')
        .delete()
        .eq('id', confirmDeleteId);

      if (error) throw error;
      toast.success("Plano removido");
      setConfirmDeleteId(null);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover plano");
    }
  };

  const toggleActive = async (plan: NutritionPlan) => {
    try {
      const { error } = await supabase
        .from('student_nutrition_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      toast.success(plan.is_active ? "Plano desativado" : "Plano ativado");
      fetchPlans();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar plano");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Apple className="h-4 w-4 text-primary" />
                Planos Nutricionais
              </span>
              {canEdit && !isAdding && (
                <Button size="sm" onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Plano
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdding && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="space-y-2">
                  <Label>Título do Plano *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Plano de Emagrecimento"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição geral do plano..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Calorias (kcal)</Label>
                    <Input
                      type="number"
                      value={formData.calories_target}
                      onChange={(e) => setFormData({ ...formData, calories_target: e.target.value })}
                      placeholder="2000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proteína (g)</Label>
                    <Input
                      type="number"
                      value={formData.protein_target}
                      onChange={(e) => setFormData({ ...formData, protein_target: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Carboidratos (g)</Label>
                    <Input
                      type="number"
                      value={formData.carbs_target}
                      onChange={(e) => setFormData({ ...formData, carbs_target: e.target.value })}
                      placeholder="250"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gordura (g)</Label>
                    <Input
                      type="number"
                      value={formData.fat_target}
                      onChange={(e) => setFormData({ ...formData, fat_target: e.target.value })}
                      placeholder="65"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Refeições</Label>
                  <Textarea
                    value={formData.meals}
                    onChange={(e) => setFormData({ ...formData, meals: e.target.value })}
                    placeholder="Pequeno-almoço: ...&#10;Lanche manhã: ...&#10;Almoço: ...&#10;Lanche tarde: ...&#10;Jantar: ..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas Adicionais</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações, restrições, suplementação..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setConfirmSave(true)}>
                    {editingPlan ? "Atualizar" : "Criar"} Plano
                  </Button>
                </div>
              </div>
            )}

            {plans.length === 0 && !isAdding && (
              <div className="text-center py-8">
                <Apple className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhum plano nutricional criado para este aluno.
                </p>
                {canEdit && (
                  <Button onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Criar Primeiro Plano
                  </Button>
                )}
              </div>
            )}

            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 border rounded-lg space-y-3 ${plan.is_active ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.title}</span>
                      {plan.is_active && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(plan.created_at), "dd MMM yyyy", { locale: pt })}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(plan)}
                      >
                        {plan.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}

                {(plan.calories_target || plan.protein_target || plan.carbs_target || plan.fat_target) && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {plan.calories_target && (
                      <span className="bg-muted px-2 py-1 rounded">
                        {plan.calories_target} kcal
                      </span>
                    )}
                    {plan.protein_target && (
                      <span className="bg-muted px-2 py-1 rounded">
                        P: {plan.protein_target}g
                      </span>
                    )}
                    {plan.carbs_target && (
                      <span className="bg-muted px-2 py-1 rounded">
                        C: {plan.carbs_target}g
                      </span>
                    )}
                    {plan.fat_target && (
                      <span className="bg-muted px-2 py-1 rounded">
                        G: {plan.fat_target}g
                      </span>
                    )}
                  </div>
                )}

                {plan.meals && (
                  <div className="text-sm whitespace-pre-line bg-muted/50 p-3 rounded">
                    {plan.meals}
                  </div>
                )}

                {plan.notes && (
                  <p className="text-sm text-muted-foreground italic">{plan.notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Save */}
      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {editingPlan ? "Atualização" : "Criação"}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {editingPlan ? "atualizar" : "criar"} este plano nutricional?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este plano nutricional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}