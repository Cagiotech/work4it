import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

interface Staff {
  id: string;
  full_name: string;
}

interface Absence {
  id: string;
  staff_id: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  staff?: Staff;
}

const absenceTypes = [
  { value: "vacation", label: "Férias" },
  { value: "sick", label: "Doença" },
  { value: "personal", label: "Pessoal" },
  { value: "maternity", label: "Maternidade/Paternidade" },
  { value: "unpaid", label: "Sem Vencimento" },
  { value: "other", label: "Outro" },
];

export function AbsencesSection() {
  const { company } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: "",
    absence_type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [staffRes, absencesRes] = await Promise.all([
        supabase.from('staff').select('id, full_name').eq('company_id', company.id).eq('is_active', true).order('full_name'),
        supabase.from('staff_absences').select('*').eq('company_id', company.id).order('start_date', { ascending: false })
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (absencesRes.data) setAbsences(absencesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id || !formData.staff_id || !formData.start_date || !formData.end_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const totalDays = differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;
    if (totalDays < 1) {
      toast.error('Data de fim deve ser igual ou posterior à data de início');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('staff_absences').insert({
        company_id: company.id,
        staff_id: formData.staff_id,
        absence_type: formData.absence_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_days: totalDays,
        reason: formData.reason || null,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Ausência registada!');
      setDialogOpen(false);
      setFormData({ staff_id: "", absence_type: "vacation", start_date: "", end_date: "", reason: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registar ausência');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_absences').update({
        status: 'approved',
        approved_at: new Date().toISOString()
      }).eq('id', id);

      if (error) throw error;
      toast.success('Ausência aprovada!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprovar');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase.from('staff_absences').update({
        status: 'rejected'
      }).eq('id', id);

      if (error) throw error;
      toast.success('Ausência rejeitada');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar');
    }
  };

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.full_name || 'Desconhecido';
  };

  const getTypeName = (type: string) => {
    return absenceTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingAbsences = absences.filter(a => a.status === 'pending');
  const otherAbsences = absences.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Ausência
        </Button>
      </div>

      {/* Pending Approvals */}
      {pendingAbsences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pendentes de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAbsences.map((absence) => (
                <div key={absence.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div>
                    <p className="font-medium">{getStaffName(absence.staff_id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getTypeName(absence.absence_type)} • {absence.total_days} dia(s)
                    </p>
                    <p className="text-sm">
                      {format(new Date(absence.start_date), "dd/MM/yyyy", { locale: pt })} - {format(new Date(absence.end_date), "dd/MM/yyyy", { locale: pt })}
                    </p>
                    {absence.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{absence.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(absence.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(absence.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Absences */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ausências</CardTitle>
        </CardHeader>
        <CardContent>
          {otherAbsences.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma ausência registada.
            </p>
          ) : (
            <div className="space-y-3">
              {otherAbsences.map((absence) => (
                <div key={absence.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{getStaffName(absence.staff_id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getTypeName(absence.absence_type)} • {absence.total_days} dia(s)
                    </p>
                    <p className="text-sm">
                      {format(new Date(absence.start_date), "dd/MM/yyyy")} - {format(new Date(absence.end_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  {getStatusBadge(absence.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Absence Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ausência</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select value={formData.staff_id} onValueChange={(v) => setFormData({ ...formData, staff_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Ausência *</Label>
              <Select value={formData.absence_type} onValueChange={(v) => setFormData({ ...formData, absence_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Motivo da ausência (opcional)"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Registar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
