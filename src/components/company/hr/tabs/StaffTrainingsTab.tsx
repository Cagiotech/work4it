import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GraduationCap, Plus, Pencil, Trash2, Loader2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Training {
  id: string;
  training_name: string;
  institution: string | null;
  start_date: string | null;
  completion_date: string | null;
  expiry_date: string | null;
  hours: number | null;
  certification_number: string | null;
  cost: number | null;
  status: string | null;
  notes: string | null;
}

interface StaffTrainingsTabProps {
  staffId: string;
  canEdit: boolean;
}

const defaultTraining = {
  training_name: "",
  institution: "",
  start_date: "",
  completion_date: "",
  expiry_date: "",
  hours: 0,
  certification_number: "",
  cost: 0,
  status: "completed",
  notes: "",
};

export function StaffTrainingsTab({ staffId, canEdit }: StaffTrainingsTabProps) {
  const { company } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [trainingToDelete, setTrainingToDelete] = useState<Training | null>(null);
  const [formData, setFormData] = useState(defaultTraining);

  useEffect(() => {
    fetchTrainings();
  }, [staffId]);

  const fetchTrainings = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_trainings")
        .select("*")
        .eq("staff_id", staffId)
        .order("completion_date", { ascending: false });

      if (error) throw error;
      setTrainings(data || []);
    } catch (error) {
      console.error("Error fetching trainings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (training?: Training) => {
    if (training) {
      setEditingTraining(training);
      setFormData({
        training_name: training.training_name,
        institution: training.institution || "",
        start_date: training.start_date || "",
        completion_date: training.completion_date || "",
        expiry_date: training.expiry_date || "",
        hours: training.hours || 0,
        certification_number: training.certification_number || "",
        cost: training.cost || 0,
        status: training.status || "completed",
        notes: training.notes || "",
      });
    } else {
      setEditingTraining(null);
      setFormData(defaultTraining);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!company?.id || !formData.training_name.trim()) {
      toast.error("Nome da formação é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const trainingData = {
        staff_id: staffId,
        company_id: company.id,
        training_name: formData.training_name.trim(),
        institution: formData.institution || null,
        start_date: formData.start_date || null,
        completion_date: formData.completion_date || null,
        expiry_date: formData.expiry_date || null,
        hours: formData.hours || null,
        certification_number: formData.certification_number || null,
        cost: formData.cost || null,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (editingTraining) {
        const { error } = await supabase
          .from("staff_trainings")
          .update(trainingData)
          .eq("id", editingTraining.id);
        if (error) throw error;
        toast.success("Formação atualizada!");
      } else {
        const { error } = await supabase.from("staff_trainings").insert(trainingData);
        if (error) throw error;
        toast.success("Formação adicionada!");
      }

      setDialogOpen(false);
      fetchTrainings();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Erro ao guardar formação");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!trainingToDelete) return;

    try {
      const { error } = await supabase
        .from("staff_trainings")
        .delete()
        .eq("id", trainingToDelete.id);

      if (error) throw error;
      toast.success("Formação eliminada!");
      fetchTrainings();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Erro ao eliminar formação");
    } finally {
      setDeleteDialogOpen(false);
      setTrainingToDelete(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="border-green-500 text-green-600">Concluída</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Em Curso</Badge>;
      case "planned":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Planeada</Badge>;
      case "expired":
        return <Badge variant="outline" className="border-red-500 text-red-600">Expirada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Formação
          </Button>
        </div>
      )}

      {/* Trainings List */}
      {trainings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma formação registada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trainings.map((training) => (
            <Card key={training.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{training.training_name}</p>
                    {getStatusBadge(training.status)}
                  </div>
                  {training.institution && (
                    <p className="text-sm text-muted-foreground">{training.institution}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {training.completion_date && (
                      <span>Concluída: {format(new Date(training.completion_date), "dd/MM/yyyy")}</span>
                    )}
                    {training.hours && <span>{training.hours}h</span>}
                    {training.certification_number && (
                      <span>Cert: {training.certification_number}</span>
                    )}
                    {training.expiry_date && (
                      <span
                        className={
                          new Date(training.expiry_date) < new Date()
                            ? "text-destructive"
                            : ""
                        }
                      >
                        Expira: {format(new Date(training.expiry_date), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(training)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        setTrainingToDelete(training);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Training Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTraining ? "Editar Formação" : "Nova Formação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Formação *</Label>
              <Input
                value={formData.training_name}
                onChange={(e) =>
                  setFormData({ ...formData, training_name: e.target.value })
                }
                placeholder="Ex: Certificação Personal Trainer"
              />
            </div>
            <div className="space-y-2">
              <Label>Instituição</Label>
              <Input
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                placeholder="Ex: IPDJ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Conclusão</Label>
                <Input
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) =>
                    setFormData({ ...formData, completion_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horas</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Validade</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº Certificado</Label>
                <Input
                  value={formData.certification_number}
                  onChange={(e) =>
                    setFormData({ ...formData, certification_number: e.target.value })
                  }
                  placeholder="Número do certificado"
                />
              </div>
              <div className="space-y-2">
                <Label>Custo (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="in_progress">Em Curso</SelectItem>
                  <SelectItem value="planned">Planeada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingTraining ? "Guardar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Formação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{trainingToDelete?.training_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
