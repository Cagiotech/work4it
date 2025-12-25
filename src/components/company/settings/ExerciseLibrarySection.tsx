import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, Trash2, Pencil, Dumbbell, Search, Filter, Loader2, Save, X,
  ImagePlus, Video, FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Pernas", "Glúteos", "Abdominais", "Core", "Cardio", "Full Body"
];

const DIFFICULTIES = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermedio", label: "Intermédio" },
  { value: "avancado", label: "Avançado" },
];

interface ExerciseLibraryItem {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string;
  secondary_muscles: string[] | null;
  equipment: string | null;
  difficulty: string | null;
  image_url: string | null;
  video_url: string | null;
  instructions: string | null;
  tips: string | null;
  is_active: boolean;
}

const defaultExercise: Omit<ExerciseLibraryItem, 'id'> = {
  name: "",
  description: "",
  muscle_group: "Peito",
  secondary_muscles: [],
  equipment: "",
  difficulty: "iniciante",
  image_url: "",
  video_url: "",
  instructions: "",
  tips: "",
  is_active: true,
};

export function ExerciseLibrarySection() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseLibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseLibraryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ExerciseLibraryItem, 'id'>>(defaultExercise);

  useEffect(() => {
    if (company?.id) fetchExercises();
  }, [company?.id]);

  useEffect(() => {
    let filtered = exercises;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(query) ||
        ex.muscle_group.toLowerCase().includes(query) ||
        ex.equipment?.toLowerCase().includes(query)
      );
    }
    
    if (filterMuscle && filterMuscle !== "all") {
      filtered = filtered.filter(ex => ex.muscle_group === filterMuscle);
    }
    
    setFilteredExercises(filtered);
  }, [exercises, searchQuery, filterMuscle]);

  const fetchExercises = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("*")
        .or(`company_id.eq.${company.id},is_global.eq.true`)
        .order("muscle_group")
        .order("name");

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast.error("Erro ao carregar exercícios");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingExercise(null);
    setForm(defaultExercise);
    setShowDialog(true);
  };

  const handleOpenEdit = (ex: ExerciseLibraryItem) => {
    setEditingExercise(ex);
    setForm({
      name: ex.name,
      description: ex.description || "",
      muscle_group: ex.muscle_group,
      secondary_muscles: ex.secondary_muscles || [],
      equipment: ex.equipment || "",
      difficulty: ex.difficulty || "iniciante",
      image_url: ex.image_url || "",
      video_url: ex.video_url || "",
      instructions: ex.instructions || "",
      tips: ex.tips || "",
      is_active: ex.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!company?.id || !form.name.trim() || !form.muscle_group) {
      toast.error("Nome e grupo muscular são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_id: company.id,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        muscle_group: form.muscle_group,
        secondary_muscles: form.secondary_muscles?.length ? form.secondary_muscles : null,
        equipment: form.equipment?.trim() || null,
        difficulty: form.difficulty,
        image_url: form.image_url?.trim() || null,
        video_url: form.video_url?.trim() || null,
        instructions: form.instructions?.trim() || null,
        tips: form.tips?.trim() || null,
        is_active: form.is_active,
      };

      if (editingExercise) {
        const { error } = await supabase
          .from("exercise_library")
          .update(payload)
          .eq("id", editingExercise.id);
        if (error) throw error;
        toast.success("Exercício atualizado");
      } else {
        const { error } = await supabase
          .from("exercise_library")
          .insert(payload);
        if (error) throw error;
        toast.success("Exercício criado");
      }

      setShowDialog(false);
      fetchExercises();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar exercício");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("exercise_library")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Exercício eliminado");
      setDeleteId(null);
      fetchExercises();
    } catch (error: any) {
      toast.error(error.message || "Erro ao eliminar exercício");
    }
  };

  const getDifficultyColor = (diff: string | null) => {
    switch (diff) {
      case "iniciante": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "intermedio": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "avancado": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "";
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Biblioteca de Exercícios</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie exercícios pré-definidos para usar nos planos de treino
          </p>
        </div>
        <Button onClick={handleOpenNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Exercício
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar exercícios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterMuscle} onValueChange={setFilterMuscle}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Grupo muscular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {MUSCLE_GROUPS.map((group) => (
              <SelectItem key={group} value={group}>{group}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exercise List */}
      {filteredExercises.length === 0 ? (
        <Card className="p-8 text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">
            {exercises.length === 0 ? "Sem exercícios" : "Nenhum resultado"}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {exercises.length === 0 
              ? "Adicione exercícios à sua biblioteca para usar nos planos de treino"
              : "Tente ajustar os filtros de pesquisa"
            }
          </p>
          {exercises.length === 0 && (
            <Button onClick={handleOpenNew}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Exercício
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((ex) => (
            <Card key={ex.id} className={`group ${!ex.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {ex.image_url ? (
                      <img 
                        src={ex.image_url} 
                        alt={ex.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm truncate">{ex.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {ex.muscle_group}
                          </Badge>
                          {ex.difficulty && (
                            <Badge className={`text-xs ${getDifficultyColor(ex.difficulty)}`}>
                              {DIFFICULTIES.find(d => d.value === ex.difficulty)?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEdit(ex)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteId(ex.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {ex.equipment && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Equipamento: {ex.equipment}
                      </p>
                    )}
                  </div>
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
              {editingExercise ? "Editar Exercício" : "Novo Exercício"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Supino Reto, Agachamento"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Grupo Muscular *</Label>
                  <Select
                    value={form.muscle_group}
                    onValueChange={(v) => setForm({ ...form, muscle_group: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <Select
                    value={form.difficulty || "iniciante"}
                    onValueChange={(v) => setForm({ ...form, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((diff) => (
                        <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Equipamento</Label>
                <Input
                  value={form.equipment || ""}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="Ex: Barra, Halteres, Máquina"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Breve descrição do exercício..."
                  rows={2}
                />
              </div>

              {/* Media */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    URL da Imagem
                  </Label>
                  <Input
                    value={form.image_url || ""}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    URL do Vídeo
                  </Label>
                  <Input
                    value={form.video_url || ""}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Instruções de Execução
                </Label>
                <Textarea
                  value={form.instructions || ""}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="1. Posição inicial...&#10;2. Execute o movimento...&#10;3. Retorne à posição inicial..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Dicas</Label>
                <Textarea
                  value={form.tips || ""}
                  onChange={(e) => setForm({ ...form, tips: e.target.value })}
                  placeholder="Dicas para melhor execução..."
                  rows={2}
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
              {editingExercise ? "Guardar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar exercício?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover o exercício da biblioteca.
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
