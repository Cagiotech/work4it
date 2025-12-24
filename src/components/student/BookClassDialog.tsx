import { useState, useEffect } from "react";
import { format, addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentClass {
  id: string;
  class: {
    id: string;
    name: string;
    color: string;
    duration_minutes: number;
    default_instructor_id: string | null;
  };
}

interface AvailableSlot {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  instructor_name: string | null;
  enrolled_count: number;
  capacity: number;
  class_name: string;
  class_color: string;
  class_id: string;
}

interface BookClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  personalTrainerId: string | null;
  onSuccess: () => void;
}

export function BookClassDialog({
  open,
  onOpenChange,
  studentId,
  personalTrainerId,
  onSuccess,
}: BookClassDialogProps) {
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStudentClasses();
    }
  }, [open, studentId]);

  useEffect(() => {
    if (selectedClassId) {
      fetchAvailableSlots();
    }
  }, [selectedClassId, selectedDate]);

  const fetchStudentClasses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_classes')
        .select(`
          id,
          class:classes(id, name, color, duration_minutes, default_instructor_id)
        `)
        .eq('student_id', studentId)
        .eq('is_active', true);

      if (error) throw error;
      setStudentClasses(data || []);
      
      if (data && data.length > 0) {
        setSelectedClassId(data[0].class?.id || null);
      }
    } catch (error) {
      console.error('Error fetching student classes:', error);
      toast.error('Erro ao carregar modalidades');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedClassId) return;

    try {
      const startDate = format(selectedDate, 'yyyy-MM-dd');
      const endDate = format(addDays(selectedDate, 7), 'yyyy-MM-dd');

      // Fetch class schedules for the selected class
      let query = supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          instructor:staff(id, full_name),
          class:classes(id, name, color, capacity)
        `)
        .eq('class_id', selectedClassId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .eq('status', 'scheduled')
        .order('scheduled_date')
        .order('start_time');

      // If student has a personal trainer, filter by that trainer
      if (personalTrainerId) {
        query = query.eq('instructor_id', personalTrainerId);
      }

      const { data: schedules, error } = await query;

      if (error) throw error;

      // Get enrollment counts for each schedule
      const scheduleIds = schedules?.map(s => s.id) || [];
      
      let enrollmentCounts: Record<string, number> = {};
      if (scheduleIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('class_schedule_id')
          .in('class_schedule_id', scheduleIds)
          .neq('status', 'cancelled');

        enrollmentCounts = (enrollments || []).reduce((acc, e) => {
          acc[e.class_schedule_id] = (acc[e.class_schedule_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      // Check which schedules the student is already enrolled in
      const { data: myEnrollments } = await supabase
        .from('class_enrollments')
        .select('class_schedule_id')
        .eq('student_id', studentId)
        .in('class_schedule_id', scheduleIds)
        .neq('status', 'cancelled');

      const enrolledScheduleIds = new Set(myEnrollments?.map(e => e.class_schedule_id));

      const slots: AvailableSlot[] = (schedules || [])
        .filter(s => !enrolledScheduleIds.has(s.id)) // Filter out already enrolled
        .filter(s => {
          // Filter out past slots
          const slotDate = parseISO(`${s.scheduled_date}T${s.start_time}`);
          return !isBefore(slotDate, new Date());
        })
        .map(s => ({
          id: s.id,
          scheduled_date: s.scheduled_date,
          start_time: s.start_time,
          end_time: s.end_time,
          instructor_name: s.instructor?.full_name || null,
          enrolled_count: enrollmentCounts[s.id] || 0,
          capacity: s.class?.capacity || 10,
          class_name: s.class?.name || '',
          class_color: s.class?.color || '#aeca12',
          class_id: s.class?.id || '',
        }));

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleBook = async () => {
    if (!selectedSlotId) {
      toast.error('Selecione um horário');
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .insert({
          student_id: studentId,
          class_schedule_id: selectedSlotId,
          status: 'enrolled',
        });

      if (error) throw error;

      toast.success('Aula agendada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error booking class:', error);
      toast.error('Erro ao agendar aula');
    } finally {
      setIsBooking(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => 
      direction === 'next' ? addDays(prev, 7) : addDays(prev, -7)
    );
    setSelectedSlotId(null);
  };

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.scheduled_date]) {
      acc[slot.scheduled_date] = [];
    }
    acc[slot.scheduled_date].push(slot);
    return acc;
  }, {} as Record<string, AvailableSlot[]>);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (studentClasses.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agendar Aula</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Não tem modalidades atribuídas. Contacte o seu treinador para ser inscrito em aulas.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Aula
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Selection */}
          <div className="flex flex-wrap gap-2">
            {studentClasses.map((sc) => (
              <Button
                key={sc.id}
                variant={selectedClassId === sc.class?.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedClassId(sc.class?.id || null);
                  setSelectedSlotId(null);
                }}
                className="gap-1.5"
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: sc.class?.color }}
                />
                {sc.class?.name}
              </Button>
            ))}
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('prev')}
              disabled={isBefore(selectedDate, startOfDay(new Date()))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm font-medium">
              {format(selectedDate, "d 'de' MMMM", { locale: pt })} - {format(addDays(selectedDate, 6), "d 'de' MMMM", { locale: pt })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Available Slots */}
          <ScrollArea className="h-[300px]">
            {Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Não há horários disponíveis nesta semana.</p>
                <p className="text-sm">Tente a próxima semana.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: pt })}
                    </h4>
                    <div className="space-y-2">
                      {slots.map((slot) => {
                        const isFull = slot.enrolled_count >= slot.capacity;
                        const isSelected = selectedSlotId === slot.id;
                        
                        return (
                          <Card
                            key={slot.id}
                            className={`cursor-pointer transition-all ${
                              isFull 
                                ? 'opacity-50 cursor-not-allowed' 
                                : isSelected 
                                  ? 'ring-2 ring-primary border-primary' 
                                  : 'hover:border-primary/50'
                            }`}
                            onClick={() => !isFull && setSelectedSlotId(slot.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                  </div>
                                  {slot.instructor_name && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                      <User className="h-3.5 w-3.5" />
                                      {slot.instructor_name}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={isFull ? "destructive" : "secondary"} className="text-xs">
                                    {slot.enrolled_count}/{slot.capacity}
                                  </Badge>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleBook} 
            disabled={isBooking || !selectedSlotId}
          >
            {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
