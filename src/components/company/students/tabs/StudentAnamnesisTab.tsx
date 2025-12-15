import { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, Heart, Moon, Dumbbell, Stethoscope } from "lucide-react";
import { SaveTriggerContext } from "../StudentProfileDialog";
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

interface AnamnesisData {
  id?: string;
  student_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  has_heart_condition: boolean;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_respiratory_issues: boolean;
  has_joint_problems: boolean;
  has_back_problems: boolean;
  has_allergies: boolean;
  allergies_description: string | null;
  current_medications: string | null;
  previous_surgeries: string | null;
  injuries_history: string | null;
  is_smoker: boolean;
  alcohol_consumption: string | null;
  sleep_hours_avg: number | null;
  stress_level: string | null;
  previous_exercise_experience: string | null;
  current_activity_level: string | null;
  fitness_goals: string | null;
  available_days_per_week: number | null;
  preferred_training_time: string | null;
  doctor_clearance: boolean;
  doctor_name: string | null;
  doctor_contact: string | null;
  additional_notes: string | null;
}

interface StudentAnamnesisTabProps {
  studentId: string;
  canEdit: boolean;
}

const defaultAnamnesis: Omit<AnamnesisData, 'student_id'> = {
  height_cm: null,
  weight_kg: null,
  body_fat_percentage: null,
  has_heart_condition: false,
  has_diabetes: false,
  has_hypertension: false,
  has_respiratory_issues: false,
  has_joint_problems: false,
  has_back_problems: false,
  has_allergies: false,
  allergies_description: null,
  current_medications: null,
  previous_surgeries: null,
  injuries_history: null,
  is_smoker: false,
  alcohol_consumption: null,
  sleep_hours_avg: null,
  stress_level: null,
  previous_exercise_experience: null,
  current_activity_level: null,
  fitness_goals: null,
  available_days_per_week: null,
  preferred_training_time: null,
  doctor_clearance: false,
  doctor_name: null,
  doctor_contact: null,
  additional_notes: null,
};

export function StudentAnamnesisTab({ studentId, canEdit }: StudentAnamnesisTabProps) {
  const { registerSave, unregisterSave } = useContext(SaveTriggerContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AnamnesisData>({ ...defaultAnamnesis, student_id: studentId });
  const [originalData, setOriginalData] = useState<string>("");
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    fetchAnamnesis();
  }, [studentId]);

  const fetchAnamnesis = async () => {
    try {
      const { data: anamnesis, error } = await supabase
        .from('student_anamnesis')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      const anamnesisData = anamnesis ? (anamnesis as AnamnesisData) : { ...defaultAnamnesis, student_id: studentId };
      setData(anamnesisData);
      setOriginalData(JSON.stringify(anamnesisData));
    } catch (error: any) {
      console.error('Error fetching anamnesis:', error);
    } finally {
      setLoading(false);
    }
  };
  const hasChanges = JSON.stringify(data) !== originalData;

  // Register save function with parent
  useEffect(() => {
    const saveFn = async () => {
      setConfirmSaveOpen(true);
    };
    registerSave("anamnesis", saveFn);
    return () => unregisterSave("anamnesis");
  }, [registerSave, unregisterSave]);

  const handleSave = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);
    try {
      if (data.id) {
        const { error } = await supabase
          .from('student_anamnesis')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_anamnesis')
          .insert({ ...data, student_id: studentId });
        if (error) throw error;
      }
      toast.success("Anamnese guardada com sucesso");
      fetchAnamnesis();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar anamnese");
    } finally {
      setSaving(false);
    }
  };

  const bmi = data.height_cm && data.weight_kg 
    ? (data.weight_kg / Math.pow(data.height_cm / 100, 2)).toFixed(1)
    : null;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Physical Measurements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Medidas Físicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                value={data.height_cm || ""}
                onChange={(e) => setData({ ...data, height_cm: e.target.value ? Number(e.target.value) : null })}
                disabled={!canEdit}
                placeholder="175"
              />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                value={data.weight_kg || ""}
                onChange={(e) => setData({ ...data, weight_kg: e.target.value ? Number(e.target.value) : null })}
                disabled={!canEdit}
                placeholder="70"
              />
            </div>
            <div className="space-y-2">
              <Label>% Gordura</Label>
              <Input
                type="number"
                value={data.body_fat_percentage || ""}
                onChange={(e) => setData({ ...data, body_fat_percentage: e.target.value ? Number(e.target.value) : null })}
                disabled={!canEdit}
                placeholder="20"
              />
            </div>
            <div className="space-y-2">
              <Label>IMC</Label>
              <Input value={bmi || "-"} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Health Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Condições de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { key: 'has_heart_condition', label: 'Problemas Cardíacos' },
                { key: 'has_diabetes', label: 'Diabetes' },
                { key: 'has_hypertension', label: 'Hipertensão' },
                { key: 'has_respiratory_issues', label: 'Problemas Respiratórios' },
                { key: 'has_joint_problems', label: 'Problemas Articulares' },
                { key: 'has_back_problems', label: 'Problemas de Coluna' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <Label className="text-sm">{label}</Label>
                  <Switch
                    checked={(data as any)[key]}
                    onCheckedChange={(checked) => setData({ ...data, [key]: checked })}
                    disabled={!canEdit}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
              <Label className="text-sm">Alergias</Label>
              <Switch
                checked={data.has_allergies}
                onCheckedChange={(checked) => setData({ ...data, has_allergies: checked })}
                disabled={!canEdit}
              />
            </div>
            {data.has_allergies && (
              <Textarea
                value={data.allergies_description || ""}
                onChange={(e) => setData({ ...data, allergies_description: e.target.value })}
                disabled={!canEdit}
                placeholder="Descreva as alergias..."
                rows={2}
              />
            )}

            <div className="space-y-2">
              <Label>Medicamentos Atuais</Label>
              <Textarea
                value={data.current_medications || ""}
                onChange={(e) => setData({ ...data, current_medications: e.target.value })}
                disabled={!canEdit}
                placeholder="Liste os medicamentos em uso..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Cirurgias Anteriores</Label>
              <Textarea
                value={data.previous_surgeries || ""}
                onChange={(e) => setData({ ...data, previous_surgeries: e.target.value })}
                disabled={!canEdit}
                placeholder="Descreva cirurgias realizadas..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Histórico de Lesões</Label>
              <Textarea
                value={data.injuries_history || ""}
                onChange={(e) => setData({ ...data, injuries_history: e.target.value })}
                disabled={!canEdit}
                placeholder="Descreva lesões anteriores..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              Estilo de Vida
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 col-span-2 sm:col-span-1">
              <Label className="text-sm">Fumador</Label>
              <Switch
                checked={data.is_smoker}
                onCheckedChange={(checked) => setData({ ...data, is_smoker: checked })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Consumo de Álcool</Label>
              <Select
                value={data.alcohol_consumption || ""}
                onValueChange={(value) => setData({ ...data, alcohol_consumption: value })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="occasional">Ocasional</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="frequent">Frequente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horas de Sono</Label>
              <Input
                type="number"
                value={data.sleep_hours_avg || ""}
                onChange={(e) => setData({ ...data, sleep_hours_avg: e.target.value ? Number(e.target.value) : null })}
                disabled={!canEdit}
                placeholder="7"
              />
            </div>
            <div className="space-y-2">
              <Label>Nível de Stress</Label>
              <Select
                value={data.stress_level || ""}
                onValueChange={(value) => setData({ ...data, stress_level: value })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="very_high">Muito Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Background */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              Histórico Fitness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nível de Atividade Atual</Label>
                <Select
                  value={data.current_activity_level || ""}
                  onValueChange={(value) => setData({ ...data, current_activity_level: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentário</SelectItem>
                    <SelectItem value="lightly_active">Levemente Ativo</SelectItem>
                    <SelectItem value="moderately_active">Moderadamente Ativo</SelectItem>
                    <SelectItem value="very_active">Muito Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dias Disponíveis por Semana</Label>
                <Input
                  type="number"
                  min="1"
                  max="7"
                  value={data.available_days_per_week || ""}
                  onChange={(e) => setData({ ...data, available_days_per_week: e.target.value ? Number(e.target.value) : null })}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário Preferido</Label>
                <Input
                  value={data.preferred_training_time || ""}
                  onChange={(e) => setData({ ...data, preferred_training_time: e.target.value })}
                  disabled={!canEdit}
                  placeholder="Ex: Manhã, 08h-10h"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Experiência Anterior com Exercício</Label>
              <Textarea
                value={data.previous_exercise_experience || ""}
                onChange={(e) => setData({ ...data, previous_exercise_experience: e.target.value })}
                disabled={!canEdit}
                placeholder="Descreva experiências anteriores com treino..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivos de Fitness</Label>
              <Textarea
                value={data.fitness_goals || ""}
                onChange={(e) => setData({ ...data, fitness_goals: e.target.value })}
                disabled={!canEdit}
                placeholder="Quais são os objetivos do aluno?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Clearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Autorização Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
              <Label className="text-sm">Atestado Médico</Label>
              <Switch
                checked={data.doctor_clearance}
                onCheckedChange={(checked) => setData({ ...data, doctor_clearance: checked })}
                disabled={!canEdit}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Médico</Label>
                <Input
                  value={data.doctor_name || ""}
                  onChange={(e) => setData({ ...data, doctor_name: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label>Contacto do Médico</Label>
                <Input
                  value={data.doctor_contact || ""}
                  onChange={(e) => setData({ ...data, doctor_contact: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas Adicionais</Label>
              <Textarea
                value={data.additional_notes || ""}
                onChange={(e) => setData({ ...data, additional_notes: e.target.value })}
                disabled={!canEdit}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja guardar as alterações na anamnese?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
