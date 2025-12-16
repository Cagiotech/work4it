import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Calendar, Plus, Edit, Loader2, Save, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Staff {
  id: string;
  full_name: string;
  position: string | null;
  weekly_hours: number | null;
  contract_type: string | null;
}

interface WorkSchedule {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_working_day: boolean;
}

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const contractTypes = [
  { value: "full_time", label: "Tempo Integral" },
  { value: "part_time", label: "Meio Período" },
  { value: "contractor", label: "Prestador de Serviços" },
  { value: "intern", label: "Estagiário" },
];

export function WorkScheduleSection() {
  const { company } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [editSchedules, setEditSchedules] = useState<WorkSchedule[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [contractType, setContractType] = useState("full_time");

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [staffRes, schedulesRes] = await Promise.all([
        supabase.from('staff').select('id, full_name, position, weekly_hours, contract_type').eq('company_id', company.id).eq('is_active', true).order('full_name'),
        supabase.from('staff_work_schedules').select('*').eq('company_id', company.id)
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (schedulesRes.data) setSchedules(schedulesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffSchedules = (staffId: string) => {
    return schedules.filter(s => s.staff_id === staffId);
  };

  const getWorkingDays = (staffId: string) => {
    const staffSchedules = getStaffSchedules(staffId);
    return staffSchedules.filter(s => s.is_working_day).length;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const openScheduleDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setWeeklyHours(staffMember.weekly_hours || 40);
    setContractType(staffMember.contract_type || "full_time");
    
    const existingSchedules = getStaffSchedules(staffMember.id);
    
    // Create schedule for all 7 days
    const fullSchedule: WorkSchedule[] = [];
    for (let day = 0; day <= 6; day++) {
      const existing = existingSchedules.find(s => s.day_of_week === day);
      if (existing) {
        fullSchedule.push(existing);
      } else {
        fullSchedule.push({
          id: `new-${day}`,
          staff_id: staffMember.id,
          day_of_week: day,
          start_time: day === 0 || day === 6 ? "" : "09:00",
          end_time: day === 0 || day === 6 ? "" : "18:00",
          break_start: day === 0 || day === 6 ? null : "13:00",
          break_end: day === 0 || day === 6 ? null : "14:00",
          is_working_day: day !== 0 && day !== 6,
        });
      }
    }
    
    setEditSchedules(fullSchedule);
    setDialogOpen(true);
  };

  const updateSchedule = (dayOfWeek: number, field: string, value: any) => {
    setEditSchedules(prev => prev.map(s => 
      s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    if (!selectedStaff || !company?.id) return;
    setSaving(true);
    
    try {
      // Update staff weekly hours and contract type
      await supabase
        .from('staff')
        .update({ weekly_hours: weeklyHours, contract_type: contractType })
        .eq('id', selectedStaff.id);

      // Delete existing schedules
      await supabase
        .from('staff_work_schedules')
        .delete()
        .eq('staff_id', selectedStaff.id);

      // Insert new schedules
      const schedulesToInsert = editSchedules
        .filter(s => s.is_working_day && s.start_time && s.end_time)
        .map(s => ({
          company_id: company.id,
          staff_id: selectedStaff.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          break_start: s.break_start || null,
          break_end: s.break_end || null,
          is_working_day: s.is_working_day,
        }));

      if (schedulesToInsert.length > 0) {
        const { error } = await supabase
          .from('staff_work_schedules')
          .insert(schedulesToInsert);
        
        if (error) throw error;
      }

      toast.success('Horário guardado!');
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao guardar horário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Integral</p>
                <p className="text-2xl font-bold">{staff.filter(s => s.contract_type === 'full_time' || !s.contract_type).length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meio Período</p>
                <p className="text-2xl font-bold">{staff.filter(s => s.contract_type === 'part_time').length}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Horário Definido</p>
                <p className="text-2xl font-bold">{staff.filter(s => getStaffSchedules(s.id).length > 0).length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Carga Horária dos Colaboradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum colaborador ativo.
            </p>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => {
                const staffSchedules = getStaffSchedules(member.id);
                const workingDays = staffSchedules.filter(s => s.is_working_day).length;
                const hasSchedule = staffSchedules.length > 0;
                const contractLabel = contractTypes.find(c => c.value === member.contract_type)?.label || "Tempo Integral";

                return (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.position || "Sem cargo"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <Badge variant="outline">{contractLabel}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.weekly_hours || 40}h/semana
                        </p>
                      </div>
                      {hasSchedule ? (
                        <Badge className="bg-green-500">{workingDays} dias/semana</Badge>
                      ) : (
                        <Badge variant="secondary">Sem horário</Badge>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openScheduleDialog(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de {selectedStaff?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contract Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas Semanais</Label>
                <Input
                  type="number"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Horário Semanal</Label>
              {editSchedules.map((schedule) => (
                <div 
                  key={schedule.day_of_week} 
                  className={`p-3 rounded-lg border ${schedule.is_working_day ? 'bg-muted/30' : 'bg-muted/10'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{dayNames[schedule.day_of_week]}</span>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`working-${schedule.day_of_week}`} className="text-sm">Dia de trabalho</Label>
                      <Switch
                        id={`working-${schedule.day_of_week}`}
                        checked={schedule.is_working_day}
                        onCheckedChange={(checked) => updateSchedule(schedule.day_of_week, 'is_working_day', checked)}
                      />
                    </div>
                  </div>
                  {schedule.is_working_day && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Entrada</Label>
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'start_time', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Saída</Label>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'end_time', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Início Intervalo</Label>
                        <Input
                          type="time"
                          value={schedule.break_start || ""}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'break_start', e.target.value || null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fim Intervalo</Label>
                        <Input
                          type="time"
                          value={schedule.break_end || ""}
                          onChange={(e) => updateSchedule(schedule.day_of_week, 'break_end', e.target.value || null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}