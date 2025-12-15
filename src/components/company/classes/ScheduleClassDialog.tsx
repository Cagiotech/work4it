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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addMinutes, parse } from "date-fns";

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

interface ScheduleClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classTypes: ClassType[];
  rooms: Room[];
  staff: Staff[];
  onSuccess: () => void;
}

export function ScheduleClassDialog({ 
  open, 
  onOpenChange, 
  classTypes, 
  rooms, 
  staff, 
  onSuccess 
}: ScheduleClassDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    class_id: "",
    instructor_id: "",
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: "09:00",
    notes: ""
  });

  // Auto-fill when class type changes
  useEffect(() => {
    if (formData.class_id) {
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
  }, [formData.class_id, classTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id) {
      toast.error('Selecione um tipo de aula');
      return;
    }

    setIsLoading(true);
    try {
      const selectedClass = classTypes.find(c => c.id === formData.class_id);
      const startTime = parse(formData.start_time, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, selectedClass?.duration_minutes || 60);

      const { error } = await supabase
        .from('class_schedules')
        .insert({
          class_id: formData.class_id,
          instructor_id: formData.instructor_id || null,
          scheduled_date: formData.scheduled_date,
          start_time: formData.start_time,
          end_time: format(endTime, 'HH:mm'),
          notes: formData.notes || null
        });

      if (error) throw error;
      
      toast.success('Aula agendada com sucesso');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        class_id: "",
        instructor_id: "",
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: "09:00",
        notes: ""
      });
    } catch (error) {
      console.error('Error scheduling class:', error);
      toast.error('Erro ao agendar aula');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClass = classTypes.find(c => c.id === formData.class_id);
  const selectedRoom = selectedClass?.room_id 
    ? rooms.find(r => r.id === selectedClass.room_id) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Aula</DialogTitle>
          <DialogDescription>
            Agende uma nova sessão de aula
          </DialogDescription>
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
            <Button type="submit" disabled={isLoading || !formData.class_id}>
              {isLoading ? 'A agendar...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
