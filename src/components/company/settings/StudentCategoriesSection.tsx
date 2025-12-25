import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Trash2, Pencil, Tag, Star, Percent, Dumbbell,
  Apple, Lock, Gift, Calendar, Users, Shirt, Car, Loader2, Save, X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface StudentCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  has_priority_service: boolean;
  discount_percentage: number;
  has_personal_trainer: boolean;
  has_nutrition_plan: boolean;
  has_locker: boolean;
  free_guest_passes: number;
  can_book_advance_days: number;
  max_classes_per_week: number | null;
  has_towel_service: boolean;
  has_parking: boolean;
  custom_benefits: unknown[];
  is_active: boolean;
  sort_order: number;
}

const defaultCategory: Omit<StudentCategory, 'id'> = {
  name: "",
  description: "",
  color: "#3B82F6",
  has_priority_service: false,
  discount_percentage: 0,
  has_personal_trainer: false,
  has_nutrition_plan: false,
  has_locker: false,
  free_guest_passes: 0,
  can_book_advance_days: 7,
  max_classes_per_week: null,
  has_towel_service: false,
  has_parking: false,
  custom_benefits: [],
  is_active: true,
  sort_order: 0,
};

export function StudentCategoriesSection() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<StudentCategory[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StudentCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<StudentCategory, 'id'>>(defaultCategory);

  useEffect(() => {
    if (company?.id) fetchCategories();
  }, [company?.id]);

  const fetchCategories = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_categories")
        .select("*")
        .eq("company_id", company.id)
        .order("sort_order");

      if (error) throw error;
      setCategories((data || []).map(cat => ({
        ...cat,
        custom_benefits: Array.isArray(cat.custom_benefits) ? cat.custom_benefits : []
      })));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingCategory(null);
    setForm(defaultCategory);
    setShowDialog(true);
  };

  const handleOpenEdit = (cat: StudentCategory) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || "",
      color: cat.color,
      has_priority_service: cat.has_priority_service,
      discount_percentage: cat.discount_percentage,
      has_personal_trainer: cat.has_personal_trainer,
      has_nutrition_plan: cat.has_nutrition_plan,
      has_locker: cat.has_locker,
      free_guest_passes: cat.free_guest_passes,
      can_book_advance_days: cat.can_book_advance_days,
      max_classes_per_week: cat.max_classes_per_week,
      has_towel_service: cat.has_towel_service,
      has_parking: cat.has_parking,
      custom_benefits: cat.custom_benefits || [],
      is_active: cat.is_active,
      sort_order: cat.sort_order,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!company?.id || !form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_id: company.id,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        color: form.color,
        has_priority_service: form.has_priority_service,
        discount_percentage: form.discount_percentage,
        has_personal_trainer: form.has_personal_trainer,
        has_nutrition_plan: form.has_nutrition_plan,
        has_locker: form.has_locker,
        free_guest_passes: form.free_guest_passes,
        can_book_advance_days: form.can_book_advance_days,
        max_classes_per_week: form.max_classes_per_week,
        has_towel_service: form.has_towel_service,
        has_parking: form.has_parking,
        custom_benefits: form.custom_benefits,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("student_categories")
          .update(payload)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success("Categoria atualizada");
      } else {
        const { error } = await supabase
          .from("student_categories")
          .insert(payload);
        if (error) throw error;
        toast.success("Categoria criada");
      }

      setShowDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar categoria");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("student_categories")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Categoria eliminada");
      setDeleteId(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Erro ao eliminar categoria");
    }
  };

  const getBenefitsCount = (cat: StudentCategory) => {
    let count = 0;
    if (cat.has_priority_service) count++;
    if (cat.discount_percentage > 0) count++;
    if (cat.has_personal_trainer) count++;
    if (cat.has_nutrition_plan) count++;
    if (cat.has_locker) count++;
    if (cat.free_guest_passes > 0) count++;
    if (cat.has_towel_service) count++;
    if (cat.has_parking) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Categorias de Alunos</h3>
          <p className="text-sm text-muted-foreground">
            Crie categorias com benefícios especiais para diferentes tipos de alunos
          </p>
        </div>
        <Button onClick={handleOpenNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-8 text-center">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">Sem categorias</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Crie categorias para organizar alunos e atribuir benefícios
          </p>
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Categoria
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className={`relative ${!cat.is_active ? "opacity-60" : ""}`}>
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: cat.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(cat)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteId(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {cat.description && (
                  <CardDescription className="text-xs">{cat.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {cat.has_priority_service && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Prioridade
                    </Badge>
                  )}
                  {cat.discount_percentage > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Percent className="h-3 w-3 mr-1" />
                      {cat.discount_percentage}% desc.
                    </Badge>
                  )}
                  {cat.has_personal_trainer && (
                    <Badge variant="secondary" className="text-xs">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      Personal
                    </Badge>
                  )}
                  {cat.has_nutrition_plan && (
                    <Badge variant="secondary" className="text-xs">
                      <Apple className="h-3 w-3 mr-1" />
                      Nutrição
                    </Badge>
                  )}
                  {cat.has_locker && (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Cacifo
                    </Badge>
                  )}
                  {cat.free_guest_passes > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Gift className="h-3 w-3 mr-1" />
                      {cat.free_guest_passes} passes
                    </Badge>
                  )}
                  {cat.has_towel_service && (
                    <Badge variant="secondary" className="text-xs">
                      <Shirt className="h-3 w-3 mr-1" />
                      Toalha
                    </Badge>
                  )}
                  {cat.has_parking && (
                    <Badge variant="secondary" className="text-xs">
                      <Car className="h-3 w-3 mr-1" />
                      Parking
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{getBenefitsCount(cat)} benefícios</span>
                  {!cat.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Premium, VIP, Gold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva os benefícios desta categoria..."
                  rows={2}
                />
              </div>

              {/* Benefits Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Benefícios</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Prioridade no Atendimento</span>
                    </div>
                    <Switch
                      checked={form.has_priority_service}
                      onCheckedChange={(v) => setForm({ ...form, has_priority_service: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Personal Trainer Incluído</span>
                    </div>
                    <Switch
                      checked={form.has_personal_trainer}
                      onCheckedChange={(v) => setForm({ ...form, has_personal_trainer: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Apple className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Plano de Nutrição</span>
                    </div>
                    <Switch
                      checked={form.has_nutrition_plan}
                      onCheckedChange={(v) => setForm({ ...form, has_nutrition_plan: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Cacifo Incluído</span>
                    </div>
                    <Switch
                      checked={form.has_locker}
                      onCheckedChange={(v) => setForm({ ...form, has_locker: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm">Serviço de Toalha</span>
                    </div>
                    <Switch
                      checked={form.has_towel_service}
                      onCheckedChange={(v) => setForm({ ...form, has_towel_service: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Estacionamento</span>
                    </div>
                    <Switch
                      checked={form.has_parking}
                      onCheckedChange={(v) => setForm({ ...form, has_parking: v })}
                    />
                  </div>
                </div>

                {/* Numeric Benefits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Desconto Recorrente (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_percentage}
                      onChange={(e) => setForm({ ...form, discount_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Passes de Convidado Grátis
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.free_guest_passes}
                      onChange={(e) => setForm({ ...form, free_guest_passes: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dias de Antecedência para Reservas
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.can_book_advance_days}
                      onChange={(e) => setForm({ ...form, can_book_advance_days: parseInt(e.target.value) || 7 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Máximo Aulas por Semana
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Sem limite"
                      value={form.max_classes_per_week || ""}
                      onChange={(e) => setForm({ ...form, max_classes_per_week: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Categoria Ativa</p>
                  <p className="text-xs text-muted-foreground">Categorias inativas não aparecem para seleção</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingCategory ? "Guardar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover a categoria e desassociar todos os alunos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
