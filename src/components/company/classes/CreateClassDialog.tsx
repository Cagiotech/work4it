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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ClassType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  color: string;
  is_active: boolean;
  room_id?: string | null;
  default_instructor_id?: string | null;
  has_fixed_schedule?: boolean;
  default_start_time?: string | null;
  default_end_time?: string | null;
  default_days_of_week?: number[] | null;
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

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classType?: ClassType | null;
  rooms: Room[];
  staff: Staff[];
  onSuccess: () => void;
}

const colorOptions = [
  "#aeca12", "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

const daysOfWeek = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function CreateClassDialog({ 
  open, 
  onOpenChange, 
  classType, 
  rooms, 
  staff, 
  onSuccess 
}: CreateClassDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    capacity: 10,
    color: "#aeca12",
    room_id: "",
    default_instructor_id: "",
    has_fixed_schedule: false,
    default_start_time: "09:00",
    default_end_time: "10:00",
    default_days_of_week: [] as number[]
  });

  useEffect(() => {
    if (classType) {
      setFormData({
        name: classType.name,
        description: classType.description || "",
        duration_minutes: classType.duration_minutes,
        capacity: classType.capacity,
        color: classType.color,
        room_id: classType.room_id || "",
        default_instructor_id: classType.default_instructor_id || "",
        has_fixed_schedule: classType.has_fixed_schedule || false,
        default_start_time: classType.default_start_time?.slice(0, 5) || "09:00",
        default_end_time: classType.default_end_time?.slice(0, 5) || "10:00",
        default_days_of_week: classType.default_days_of_week || []
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        capacity: 10,
        color: "#aeca12",
        room_id: "",
        default_instructor_id: "",
        has_fixed_schedule: false,
        default_start_time: "09:00",
        default_end_time: "10:00",
        default_days_of_week: []
      });
    }
  }, [classType, open]);

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      default_days_of_week: prev.default_days_of_week.includes(day)
        ? prev.default_days_of_week.filter(d => d !== day)
        : [...prev.default_days_of_week, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        duration_minutes: formData.duration_minutes,
        capacity: formData.capacity,
        color: formData.color,
        room_id: formData.room_id || null,
        default_instructor_id: formData.default_instructor_id || null,
        has_fixed_schedule: formData.has_fixed_schedule,
        default_start_time: formData.has_fixed_schedule ? formData.default_start_time : null,
        default_end_time: formData.has_fixed_schedule ? formData.default_end_time : null,
        default_days_of_week: formData.has_fixed_schedule && formData.default_days_of_week.length > 0 
          ? formData.default_days_of_week 
          : null
      };

      if (classType) {
        const { error } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', classType.id);

        if (error) throw error;
        toast.success('Tipo de aula atualizado');
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            ...payload,
            company_id: profile.company_id
          });

        if (error) throw error;
        toast.success('Tipo de aula criado');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error('Erro ao guardar tipo de aula');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{classType ? 'Editar' : 'Criar'} Tipo de Aula</DialogTitle>
          <DialogDescription>
            {classType ? 'Edite os dados do tipo de aula' : 'Defina um novo tipo de aula para a sua empresa'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Yoga, CrossFit, Pilates"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional da aula"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={240}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sala</Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) => setFormData({ ...formData, room_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sala (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} {room.location ? `(${room.location})` : ''} - {room.capacity} pessoas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Instrutor Padrão</Label>
              <Select
                value={formData.default_instructor_id}
                onValueChange={(value) => setFormData({ ...formData, default_instructor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um instrutor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="has_fixed_schedule"
                checked={formData.has_fixed_schedule}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, has_fixed_schedule: checked === true })
                }
              />
              <Label htmlFor="has_fixed_schedule" className="cursor-pointer">
                Definir horário padrão
              </Label>
            </div>

            {formData.has_fixed_schedule && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Hora de início</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.default_start_time}
                      onChange={(e) => setFormData({ ...formData, default_start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Hora de fim</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.default_end_time}
                      onChange={(e) => setFormData({ ...formData, default_end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.default_days_of_week.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day.value)}
                        className="min-w-[50px]"
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'A guardar...' : classType ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
