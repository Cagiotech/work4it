import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Square, Coffee, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { pt } from "date-fns/locale";

interface Staff {
  id: string;
  full_name: string;
  position: string | null;
}

interface TimeRecord {
  id: string;
  staff_id: string;
  clock_in: string;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  status: string;
  staff?: Staff;
}

export function TimeTrackingSection() {
  const { company } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [staffRes, recordsRes] = await Promise.all([
        supabase.from('staff').select('id, full_name, position').eq('company_id', company.id).eq('is_active', true).order('full_name'),
        supabase.from('staff_time_records').select('*').eq('company_id', company.id).gte('clock_in', new Date().toISOString().split('T')[0]).order('clock_in', { ascending: false })
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (recordsRes.data) setRecords(recordsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveRecord = (staffId: string) => {
    return records.find(r => r.staff_id === staffId && r.status !== 'completed');
  };

  const handleClockIn = async () => {
    if (!selectedStaff || !company?.id) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from('staff_time_records').insert({
        company_id: company.id,
        staff_id: selectedStaff,
        clock_in: new Date().toISOString(),
        status: 'active'
      }).select().single();

      if (error) throw error;
      setRecords([data, ...records]);
      toast.success('Entrada registada!');
      setSelectedStaff("");
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registar entrada');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakStart = async (recordId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('staff_time_records').update({
        break_start: new Date().toISOString(),
        status: 'break'
      }).eq('id', recordId);

      if (error) throw error;
      fetchData();
      toast.success('Intervalo iniciado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar intervalo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async (recordId: string) => {
    setActionLoading(true);
    try {
      const record = records.find(r => r.id === recordId);
      const breakDuration = record?.break_start 
        ? differenceInMinutes(new Date(), new Date(record.break_start))
        : 0;

      const { error } = await supabase.from('staff_time_records').update({
        break_end: new Date().toISOString(),
        break_duration_minutes: breakDuration,
        status: 'active'
      }).eq('id', recordId);

      if (error) throw error;
      fetchData();
      toast.success('Intervalo terminado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao terminar intervalo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async (recordId: string) => {
    setActionLoading(true);
    try {
      const record = records.find(r => r.id === recordId);
      if (!record) return;

      const clockIn = new Date(record.clock_in);
      const clockOut = new Date();
      const totalMinutes = differenceInMinutes(clockOut, clockIn);
      const breakMinutes = record.break_start && record.break_end 
        ? differenceInMinutes(new Date(record.break_end), new Date(record.break_start))
        : 0;
      const totalHours = (totalMinutes - breakMinutes) / 60;

      const { error } = await supabase.from('staff_time_records').update({
        clock_out: clockOut.toISOString(),
        total_hours: Math.round(totalHours * 100) / 100,
        status: 'completed'
      }).eq('id', recordId);

      if (error) throw error;
      fetchData();
      toast.success('Saída registada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registar saída');
    } finally {
      setActionLoading(false);
    }
  };

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.full_name || 'Desconhecido';
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const availableStaff = staff.filter(s => !getActiveRecord(s.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clock In Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registar Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar colaborador" />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.length === 0 ? (
                  <SelectItem value="__none__" disabled>Todos já registaram entrada</SelectItem>
                ) : (
                  availableStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleClockIn} disabled={!selectedStaff || actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Records */}
      <Card>
        <CardHeader>
          <CardTitle>Colaboradores Ativos Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {records.filter(r => r.status !== 'completed').length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum colaborador com entrada registada hoje.
            </p>
          ) : (
            <div className="space-y-3">
              {records.filter(r => r.status !== 'completed').map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(getStaffName(record.staff_id))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getStaffName(record.staff_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        Entrada: {format(new Date(record.clock_in), "HH:mm", { locale: pt })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.status === 'break' ? 'secondary' : 'default'}>
                      {record.status === 'break' ? 'Intervalo' : 'Ativo'}
                    </Badge>
                    {record.status === 'active' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleBreakStart(record.id)} disabled={actionLoading}>
                          <Coffee className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleClockOut(record.id)} disabled={actionLoading}>
                          <Square className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {record.status === 'break' && (
                      <Button size="sm" variant="outline" onClick={() => handleBreakEnd(record.id)} disabled={actionLoading}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Records */}
      <Card>
        <CardHeader>
          <CardTitle>Registos Completos Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {records.filter(r => r.status === 'completed').length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registo completo hoje.
            </p>
          ) : (
            <div className="space-y-3">
              {records.filter(r => r.status === 'completed').map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(getStaffName(record.staff_id))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getStaffName(record.staff_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.clock_in), "HH:mm")} - {record.clock_out ? format(new Date(record.clock_out), "HH:mm") : "--:--"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {record.total_hours?.toFixed(1)}h
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
