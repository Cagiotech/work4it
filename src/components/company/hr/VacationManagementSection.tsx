import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Plus, Check, X, Loader2, Palmtree, ThermometerSun, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";

interface Staff {
  id: string;
  full_name: string;
}

interface LeaveBalance {
  id: string;
  staff_id: string;
  year: number;
  vacation_days_entitled: number;
  vacation_days_used: number;
  sick_days_used: number;
  personal_days_entitled: number;
  personal_days_used: number;
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
}

const absenceTypes = [
  { value: "vacation", label: "Férias", icon: Palmtree, color: "bg-green-500" },
  { value: "sick", label: "Doença", icon: ThermometerSun, color: "bg-red-500" },
  { value: "personal", label: "Pessoal", icon: User, color: "bg-blue-500" },
  { value: "maternity", label: "Maternidade/Paternidade", icon: User, color: "bg-purple-500" },
  { value: "unpaid", label: "Sem Vencimento", icon: FileText, color: "bg-gray-500" },
  { value: "other", label: "Outro", icon: FileText, color: "bg-gray-400" },
];

export function VacationManagementSection() {
  const { company } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStaffForBalance, setSelectedStaffForBalance] = useState<string>("");
  
  const [formData, setFormData] = useState({
    staff_id: "",
    absence_type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [balanceForm, setBalanceForm] = useState({
    vacation_days_entitled: 22,
    personal_days_entitled: 2,
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [staffRes, balancesRes, absencesRes] = await Promise.all([
        supabase.from('staff').select('id, full_name').eq('company_id', company.id).eq('is_active', true).order('full_name'),
        supabase.from('staff_leave_balances').select('*').eq('company_id', company.id).eq('year', currentYear),
        supabase.from('staff_absences').select('*').eq('company_id', company.id).order('start_date', { ascending: false })
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (balancesRes.data) setBalances(balancesRes.data);
      if (absencesRes.data) setAbsences(absencesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffBalance = (staffId: string): LeaveBalance | null => {
    return balances.find(b => b.staff_id === staffId) || null;
  };

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.full_name || 'Desconhecido';
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getTypeInfo = (type: string) => {
    return absenceTypes.find(t => t.value === type) || absenceTypes[5];
  };

  const handleSubmitAbsence = async (e: React.FormEvent) => {
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

  const handleApprove = async (absence: Absence) => {
    try {
      // Update absence status
      const { error } = await supabase.from('staff_absences').update({
        status: 'approved',
        approved_at: new Date().toISOString()
      }).eq('id', absence.id);

      if (error) throw error;

      // Update leave balance if vacation or personal
      if (absence.absence_type === 'vacation' || absence.absence_type === 'personal' || absence.absence_type === 'sick') {
        const balance = getStaffBalance(absence.staff_id);
        if (balance) {
          const updateField = absence.absence_type === 'vacation' ? 'vacation_days_used' 
            : absence.absence_type === 'sick' ? 'sick_days_used' 
            : 'personal_days_used';
          
          const currentUsed = absence.absence_type === 'vacation' ? balance.vacation_days_used
            : absence.absence_type === 'sick' ? balance.sick_days_used
            : balance.personal_days_used;

          await supabase.from('staff_leave_balances').update({
            [updateField]: currentUsed + absence.total_days
          }).eq('id', balance.id);
        } else {
          // Create balance if doesn't exist
          const newBalance: any = {
            company_id: company?.id,
            staff_id: absence.staff_id,
            year: currentYear,
            vacation_days_entitled: 22,
            vacation_days_used: absence.absence_type === 'vacation' ? absence.total_days : 0,
            sick_days_used: absence.absence_type === 'sick' ? absence.total_days : 0,
            personal_days_entitled: 2,
            personal_days_used: absence.absence_type === 'personal' ? absence.total_days : 0,
          };
          await supabase.from('staff_leave_balances').insert(newBalance);
        }
      }

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

  const openBalanceDialog = (staffId: string) => {
    setSelectedStaffForBalance(staffId);
    const balance = getStaffBalance(staffId);
    if (balance) {
      setBalanceForm({
        vacation_days_entitled: balance.vacation_days_entitled,
        personal_days_entitled: balance.personal_days_entitled,
      });
    } else {
      setBalanceForm({ vacation_days_entitled: 22, personal_days_entitled: 2 });
    }
    setBalanceDialogOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!company?.id || !selectedStaffForBalance) return;
    setSaving(true);
    try {
      const existingBalance = getStaffBalance(selectedStaffForBalance);
      
      if (existingBalance) {
        const { error } = await supabase.from('staff_leave_balances').update({
          vacation_days_entitled: balanceForm.vacation_days_entitled,
          personal_days_entitled: balanceForm.personal_days_entitled,
        }).eq('id', existingBalance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('staff_leave_balances').insert({
          company_id: company.id,
          staff_id: selectedStaffForBalance,
          year: currentYear,
          vacation_days_entitled: balanceForm.vacation_days_entitled,
          personal_days_entitled: balanceForm.personal_days_entitled,
        });
        if (error) throw error;
      }

      toast.success('Saldo atualizado!');
      setBalanceDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAbsencesForDay = (date: Date) => {
    return absences.filter(a => {
      if (a.status !== 'approved') return false;
      const start = parseISO(a.start_date);
      const end = parseISO(a.end_date);
      return isWithinInterval(date, { start, end });
    });
  };

  const pendingAbsences = absences.filter(a => a.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="balances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="balances" className="gap-2">
            <Palmtree className="h-4 w-4" />
            Saldos
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <FileText className="h-4 w-4" />
            Pedidos
            {pendingAbsences.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingAbsences.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Ausência
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Saldo de Férias e Folgas - {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum colaborador ativo.</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => {
                    const balance = getStaffBalance(member.id);
                    const vacationUsed = balance?.vacation_days_used || 0;
                    const vacationEntitled = balance?.vacation_days_entitled || 22;
                    const vacationRemaining = vacationEntitled - vacationUsed;
                    const vacationPercent = (vacationUsed / vacationEntitled) * 100;

                    const personalUsed = balance?.personal_days_used || 0;
                    const personalEntitled = balance?.personal_days_entitled || 2;
                    const sickUsed = balance?.sick_days_used || 0;

                    return (
                      <div key={member.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.full_name}</span>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openBalanceDialog(member.id)}>
                            Configurar
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Vacation */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <Palmtree className="h-4 w-4 text-green-500" />
                                Férias
                              </span>
                              <span>{vacationRemaining} de {vacationEntitled} dias</span>
                            </div>
                            <Progress value={vacationPercent} className="h-2" />
                          </div>

                          {/* Personal */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4 text-blue-500" />
                                Pessoal
                              </span>
                              <span>{personalEntitled - personalUsed} de {personalEntitled} dias</span>
                            </div>
                            <Progress value={(personalUsed / personalEntitled) * 100} className="h-2" />
                          </div>

                          {/* Sick */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <ThermometerSun className="h-4 w-4 text-red-500" />
                                Doença
                              </span>
                              <span>{sickUsed} dias usados</span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {pendingAbsences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-500">Pedidos Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingAbsences.map((absence) => {
                    const typeInfo = getTypeInfo(absence.absence_type);
                    return (
                      <div key={absence.id} className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-3">
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          <div>
                            <p className="font-medium">{getStaffName(absence.staff_id)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(absence.start_date), "dd/MM/yyyy", { locale: pt })} - {format(parseISO(absence.end_date), "dd/MM/yyyy", { locale: pt })}
                              {" • "}{absence.total_days} dia(s)
                            </p>
                            {absence.reason && <p className="text-xs text-muted-foreground mt-1">{absence.reason}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApprove(absence)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(absence.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ausências</CardTitle>
            </CardHeader>
            <CardContent>
              {absences.filter(a => a.status !== 'pending').length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma ausência registada.</p>
              ) : (
                <div className="space-y-3">
                  {absences.filter(a => a.status !== 'pending').map((absence) => {
                    const typeInfo = getTypeInfo(absence.absence_type);
                    return (
                      <div key={absence.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          <div>
                            <p className="font-medium">{getStaffName(absence.staff_id)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(absence.start_date), "dd/MM/yyyy")} - {format(parseISO(absence.end_date), "dd/MM/yyyy")}
                              {" • "}{absence.total_days} dia(s)
                            </p>
                          </div>
                        </div>
                        <Badge variant={absence.status === 'approved' ? 'default' : 'destructive'}>
                          {absence.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calendário de Ausências</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                    ←
                  </Button>
                  <span className="font-medium min-w-[150px] text-center">
                    {format(currentMonth, "MMMM yyyy", { locale: pt })}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {monthDays.map((day) => {
                  const dayAbsences = getAbsencesForDay(day);
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={`p-2 min-h-[60px] border rounded-lg ${
                        isToday(day) ? 'border-primary bg-primary/5' : 'border-border/50'
                      } ${dayAbsences.length > 0 ? 'bg-muted/50' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                      <div className="space-y-1">
                        {dayAbsences.slice(0, 2).map((absence) => {
                          const typeInfo = getTypeInfo(absence.absence_type);
                          return (
                            <div 
                              key={absence.id} 
                              className={`text-xs px-1 py-0.5 rounded truncate ${typeInfo.color} text-white`}
                              title={getStaffName(absence.staff_id)}
                            >
                              {getStaffName(absence.staff_id).split(' ')[0]}
                            </div>
                          );
                        })}
                        {dayAbsences.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayAbsences.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                {absenceTypes.slice(0, 4).map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${type.color}`} />
                    <span className="text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Absence Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ausência</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAbsence} className="space-y-4">
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

      {/* Balance Config Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Saldo de Férias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dias de Férias Anuais</Label>
              <Input
                type="number"
                value={balanceForm.vacation_days_entitled}
                onChange={(e) => setBalanceForm({ ...balanceForm, vacation_days_entitled: Number(e.target.value) })}
                min={0}
                max={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Dias Pessoais Anuais</Label>
              <Input
                type="number"
                value={balanceForm.personal_days_entitled}
                onChange={(e) => setBalanceForm({ ...balanceForm, personal_days_entitled: Number(e.target.value) })}
                min={0}
                max={30}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBalance} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}