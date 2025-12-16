import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, Plus, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Evaluation {
  id: string;
  evaluation_date: string;
  evaluation_period: string | null;
  overall_score: number | null;
  technical_score: number | null;
  punctuality_score: number | null;
  teamwork_score: number | null;
  communication_score: number | null;
  initiative_score: number | null;
  strengths: string | null;
  areas_to_improve: string | null;
  goals: string | null;
  feedback: string | null;
  status: string | null;
}

interface StaffEvaluationsTabProps {
  staffId: string;
  canEdit: boolean;
}

const defaultEvaluation = {
  evaluation_date: new Date().toISOString().split("T")[0],
  evaluation_period: "",
  technical_score: 0,
  punctuality_score: 0,
  teamwork_score: 0,
  communication_score: 0,
  initiative_score: 0,
  strengths: "",
  areas_to_improve: "",
  goals: "",
  feedback: "",
  status: "completed",
};

export function StaffEvaluationsTab({ staffId, canEdit }: StaffEvaluationsTabProps) {
  const { company } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState(defaultEvaluation);

  useEffect(() => {
    fetchEvaluations();
  }, [staffId]);

  const fetchEvaluations = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_evaluations")
        .select("*")
        .eq("staff_id", staffId)
        .order("evaluation_date", { ascending: false });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evaluation?: Evaluation) => {
    if (evaluation) {
      setEditingEvaluation(evaluation);
      setFormData({
        evaluation_date: evaluation.evaluation_date,
        evaluation_period: evaluation.evaluation_period || "",
        technical_score: evaluation.technical_score || 0,
        punctuality_score: evaluation.punctuality_score || 0,
        teamwork_score: evaluation.teamwork_score || 0,
        communication_score: evaluation.communication_score || 0,
        initiative_score: evaluation.initiative_score || 0,
        strengths: evaluation.strengths || "",
        areas_to_improve: evaluation.areas_to_improve || "",
        goals: evaluation.goals || "",
        feedback: evaluation.feedback || "",
        status: evaluation.status || "completed",
      });
    } else {
      setEditingEvaluation(null);
      setFormData(defaultEvaluation);
    }
    setDialogOpen(true);
  };

  const calculateOverallScore = () => {
    const scores = [
      formData.technical_score,
      formData.punctuality_score,
      formData.teamwork_score,
      formData.communication_score,
      formData.initiative_score,
    ];
    const validScores = scores.filter((s) => s > 0);
    if (validScores.length === 0) return 0;
    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  };

  const handleSave = async () => {
    if (!company?.id) return;

    setSaving(true);
    try {
      const overallScore = calculateOverallScore();
      const evaluationData = {
        staff_id: staffId,
        company_id: company.id,
        evaluation_date: formData.evaluation_date,
        evaluation_period: formData.evaluation_period || null,
        overall_score: overallScore,
        technical_score: formData.technical_score || null,
        punctuality_score: formData.punctuality_score || null,
        teamwork_score: formData.teamwork_score || null,
        communication_score: formData.communication_score || null,
        initiative_score: formData.initiative_score || null,
        strengths: formData.strengths || null,
        areas_to_improve: formData.areas_to_improve || null,
        goals: formData.goals || null,
        feedback: formData.feedback || null,
        status: formData.status,
      };

      if (editingEvaluation) {
        const { error } = await supabase
          .from("staff_evaluations")
          .update(evaluationData)
          .eq("id", editingEvaluation.id);
        if (error) throw error;
        toast.success("Avaliação atualizada!");
      } else {
        const { error } = await supabase.from("staff_evaluations").insert(evaluationData);
        if (error) throw error;
        toast.success("Avaliação adicionada!");
      }

      setDialogOpen(false);
      fetchEvaluations();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Erro ao guardar avaliação");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!evaluationToDelete) return;

    try {
      const { error } = await supabase
        .from("staff_evaluations")
        .delete()
        .eq("id", evaluationToDelete.id);

      if (error) throw error;
      toast.success("Avaliação eliminada!");
      fetchEvaluations();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Erro ao eliminar avaliação");
    } finally {
      setDeleteDialogOpen(false);
      setEvaluationToDelete(null);
    }
  };

  const ScoreInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium">{value}/10</span>
      </div>
      <Input
        type="range"
        min="0"
        max="10"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2"
      />
    </div>
  );

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
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
            Nova Avaliação
          </Button>
        </div>
      )}

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma avaliação registada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className={`text-lg font-bold ${getScoreColor(evaluation.overall_score || 0)}`}>
                    {(evaluation.overall_score || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">
                      Avaliação de {format(new Date(evaluation.evaluation_date), "dd/MM/yyyy")}
                    </p>
                    {evaluation.evaluation_period && (
                      <Badge variant="outline">{evaluation.evaluation_period}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {[
                      { label: "Técnico", value: evaluation.technical_score },
                      { label: "Pontualidade", value: evaluation.punctuality_score },
                      { label: "Equipa", value: evaluation.teamwork_score },
                      { label: "Comunicação", value: evaluation.communication_score },
                      { label: "Iniciativa", value: evaluation.initiative_score },
                    ].map((item) => (
                      <div key={item.label} className="text-xs">
                        <div className="text-muted-foreground">{item.label}</div>
                        <Progress value={(item.value || 0) * 10} className="h-1 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(evaluation)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        setEvaluationToDelete(evaluation);
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

      {/* Evaluation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingEvaluation ? "Editar Avaliação" : "Nova Avaliação"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Avaliação</Label>
                  <Input
                    type="date"
                    value={formData.evaluation_date}
                    onChange={(e) =>
                      setFormData({ ...formData, evaluation_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Input
                    value={formData.evaluation_period}
                    onChange={(e) =>
                      setFormData({ ...formData, evaluation_period: e.target.value })
                    }
                    placeholder="Ex: 1º Semestre 2024"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Pontuações (0-10)</h4>
                <ScoreInput
                  label="Competência Técnica"
                  value={formData.technical_score}
                  onChange={(v) => setFormData({ ...formData, technical_score: v })}
                />
                <ScoreInput
                  label="Pontualidade"
                  value={formData.punctuality_score}
                  onChange={(v) => setFormData({ ...formData, punctuality_score: v })}
                />
                <ScoreInput
                  label="Trabalho em Equipa"
                  value={formData.teamwork_score}
                  onChange={(v) => setFormData({ ...formData, teamwork_score: v })}
                />
                <ScoreInput
                  label="Comunicação"
                  value={formData.communication_score}
                  onChange={(v) => setFormData({ ...formData, communication_score: v })}
                />
                <ScoreInput
                  label="Iniciativa"
                  value={formData.initiative_score}
                  onChange={(v) => setFormData({ ...formData, initiative_score: v })}
                />
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Média Geral</span>
                    <span className={`text-xl font-bold ${getScoreColor(calculateOverallScore())}`}>
                      {calculateOverallScore().toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pontos Fortes</Label>
                  <Textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    placeholder="Descreva os pontos fortes..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Áreas a Melhorar</Label>
                  <Textarea
                    value={formData.areas_to_improve}
                    onChange={(e) =>
                      setFormData({ ...formData, areas_to_improve: e.target.value })
                    }
                    placeholder="Descreva as áreas que precisam de melhoria..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objetivos</Label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder="Defina objetivos para o próximo período..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feedback Geral</Label>
                  <Textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    placeholder="Comentários adicionais..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingEvaluation ? "Guardar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar esta avaliação? Esta ação não pode ser
              desfeita.
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
