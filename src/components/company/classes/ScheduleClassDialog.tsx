import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMinutes, parse, addWeeks, addDays, getDay } from "date-fns";

const WEEK_DAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface ClassType {
  id: string;
  name: string;
  duration_minutes: number;
  capacity: number;
  room_id?: string | null;
  default_instructor_id?: string | null;
  has_fixed_schedule?: boolean;
  default_start_time?: string | null;
  default_end_time?: string | null;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
}

interface Staff {
  id: string;
  full_name: string;
}

interface ClassSchedule {
  id: string;
  class_id: string;
  instructor_id: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface ScheduleClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classTypes: ClassType[];
  rooms: Room[];
  staff: Staff[];
  onSuccess: () => void;
  schedule?: ClassSchedule | null; // For editing
  duplicateMode?: boolean; // For duplicating
}

export function ScheduleClassDialog({ 
  open, 
  onOpenChange, 
  classTypes, 
  rooms, 
  staff, 
  onSuccess,
  schedule,
  duplicateMode = false
}: ScheduleClassDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    class_id: "",
    instructor_id: "",
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: "09:00",
    notes: ""
  });

  const isEditing = !!schedule && !duplicateMode;

  // Reset form when dialog opens/closes or schedule changes
  useEffect(() => {
    if (open) {
      if (schedule) {
        const scheduleDate = duplicateMode ? format(new Date(), 'yyyy-MM-dd') : schedule.scheduled_date;
        setFormData({
          class_id: schedule.class_id,
          instructor_id: schedule.instructor_id || "",
          scheduled_date: scheduleDate,
          start_time: schedule.start_time.slice(0, 5),
          notes: duplicateMode ? "" : (schedule.notes || "")
        });
        if (duplicateMode) {
          setIsRecurring(false);
          setSelectedDays([]);
        }
      } else {
        setFormData({
          class_id: "",
          instructor_id: "",
          scheduled_date: format(new Date(), 'yyyy-MM-dd'),
          start_time: "09:00",
          notes: ""
        });
        setIsRecurring(false);
        setSelectedDays([]);
      }
    }
  }, [open, schedule, duplicateMode]);

  // Auto-fill when class type changes (only for new schedules)
  useEffect(() => {
    if (formData.class_id && !isEditing) {
      const selectedClass = classTypes.find(c => c.id === formData.class_id);
      if (selectedClass) {
        setFormData(prev => ({
          ...prev,
          instructor_id: selectedClass.default_instructor_id || prev.instructor_id,
          start_time: selectedClass.has_fixed_schedule && selectedClass.default_start_time 
            ? selectedClass.default_start_time.slice(0, 5) 
            : prev.start_time
        }));
      }
    }
  }, [formData.class_id, classTypes, isEditing]);

  const generateRecurringDates = () => {
    const dates: string[] = [];
    const startDate = parse(formData.scheduled_date, 'yyyy-MM-dd', new Date());
    
    for (let week = 0; week < recurringWeeks; week++) {
      for (const dayNum of selectedDays) {
        // Calculate the date for this day of the week
        const currentDay = getDay(startDate);
        let daysToAdd = dayNum - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        
        const targetDate = addWeeks(addDays(startDate, daysToAdd), week);
        dates.push(format(targetDate, 'yyyy-MM-dd'));
      }
    }
    
    return [...new Set(dates)].sort(); // Remove duplicates and sort
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id) {
      toast.error('Selecione um tipo de aula');
      return;
    }

    if (isRecurring && selectedDays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    setIsLoading(true);
    try {
      const selectedClass = classTypes.find(c => c.id === formData.class_id);
      const startTime = parse(formData.start_time, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, selectedClass?.duration_minutes || 60);

      if (isEditing && schedule) {
        const scheduleData = {
          class_id: formData.class_id,
          instructor_id: formData.instructor_id || null,
          scheduled_date: formData.scheduled_date,
          start_time: formData.start_time,
          end_time: format(endTime, 'HH:mm'),
          notes: formData.notes || null
        };

        const { error } = await supabase
          .from('class_schedules')
          .update(scheduleData)
          .eq('id', schedule.id);

        if (error) throw error;
        toast.success('Aula atualizada com sucesso');
      } else if (isRecurring) {
        // Create multiple schedules for recurring classes
        const dates = generateRecurringDates();
        const schedules = dates.map(date => ({
          class_id: formData.class_id,
          instructor_id: formData.instructor_id || null,
          scheduled_date: date,
          start_time: formData.start_time,
          end_time: format(endTime, 'HH:mm'),
          notes: formData.notes || null
        }));

        const { error } = await supabase
          .from('class_schedules')
          .insert(schedules);

        if (error) throw error;
        toast.success(`${schedules.length} aulas agendadas com sucesso`);
      } else {
        const scheduleData = {
          class_id: formData.class_id,
          instructor_id: formData.instructor_id || null,
          scheduled_date: formData.scheduled_date,
          start_time: formData.start_time,
          end_time: format(endTime, 'HH:mm'),
          notes: formData.notes || null
        };

        const { error } = await supabase
          .from('class_schedules')
          .insert(scheduleData);

        if (error) throw error;
        toast.success(duplicateMode ? 'Aula duplicada com sucesso' : 'Aula agendada com sucesso');
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving class schedule:', error);
      toast.error(isEditing ? 'Erro ao atualizar aula' : 'Erro ao agendar aula');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectedClass = classTypes.find(c => c.id === formData.class_id);
  const selectedRoom = selectedClass?.room_id 
    ? rooms.find(r => r.id === selectedClass.room_id) 
    : null;

  const dialogTitle = isEditing 
    ? 'Editar Aula' 
    : duplicateMode 
      ? 'Duplicar Aula' 
      : 'Agendar Aula';

  const dialogDescription = isEditing 
    ? 'Altere os dados da aula agendada' 
    : duplicateMode 
      ? 'Duplique esta aula para outra data'
      : 'Agende uma nova sessão de aula';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Aula *</Label>
              <Select
                value={formData.class_id}
                onValueChange={(value) => setFormData({ ...formData, class_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de aula" />
                </SelectTrigger>
                <SelectContent>
                  {classTypes.map((classType) => (
                    <SelectItem key={classType.id} value={classType.id}>
                      {classType.name} ({classType.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Instrutor</Label>
              <Select
                value={formData.instructor_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, instructor_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um instrutor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
            </div>

            {selectedClass && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                <p>Duração: {selectedClass.duration_minutes} minutos</p>
                <p>Capacidade: {selectedClass.capacity} alunos</p>
                {selectedRoom && (
                  <p>Sala: {selectedRoom.name} {selectedRoom.location ? `(${selectedRoom.location})` : ''}</p>
                )}
              </div>
            )}

            {/* Recurring schedule option - only for new schedules */}
            {!isEditing && (
              <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                  <Label htmlFor="recurring" className="cursor-pointer font-medium">
                    Aula recorrente (fixa)
                  </Label>
                </div>
                
                {isRecurring && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Dias da semana</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEEK_DAYS.map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={selectedDays.includes(day.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDay(day.value)}
                            className="text-xs px-2.5"
                          >
                            {day.label.slice(0, 3)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weeks">Repetir por (semanas)</Label>
                      <Select
                        value={recurringWeeks.toString()}
                        onValueChange={(value) => setRecurringWeeks(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 4, 8, 12, 16, 24, 52].map((w) => (
                            <SelectItem key={w} value={w.toString()}>
                              {w} {w === 1 ? 'semana' : 'semanas'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDays.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Serão criadas {selectedDays.length * recurringWeeks} aulas
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais (opcional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.class_id || (isRecurring && selectedDays.length === 0)}>
              {isLoading 
                ? (isEditing ? 'A guardar...' : 'A agendar...') 
                : (isEditing ? 'Guardar' : duplicateMode ? 'Duplicar' : isRecurring ? 'Criar Aulas' : 'Agendar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
