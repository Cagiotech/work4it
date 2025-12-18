import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay, parseISO, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClassSchedule {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
  classes: {
    name: string;
    color: string | null;
    capacity: number;
  } | null;
  enrollments: {
    id: string;
    status: string | null;
    student: {
      id: string;
      full_name: string;
      profile_photo_url: string | null;
    };
  }[];
}

export default function PersonalSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadSchedules();
  }, [currentWeek]);

  const loadSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!staff) return;
      setStaffId(staff.id);

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          notes,
          classes (name, color, capacity),
          class_enrollments (
            id,
            status,
            students (id, full_name, profile_photo_url)
          )
        `)
        .eq('instructor_id', staff.id)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSchedules = data?.map(schedule => ({
        ...schedule,
        enrollments: (schedule.class_enrollments || []).map((e: any) => ({
          id: e.id,
          status: e.status,
          student: e.students
        }))
      })) || [];

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(s => isSameDay(parseISO(s.scheduled_date), date));
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'in_progress': return 'bg-blue-500';
      default: return 'bg-primary';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      case 'in_progress': return 'Em Curso';
      default: return 'Agendada';
    }
  };

  const updateClassStatus = async (classId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({ status })
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Aula marcada como ${getStatusText(status).toLowerCase()}`
      });

      loadSchedules();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a aula",
        variant: "destructive"
      });
    }
  };

  const updateAttendance = async (enrollmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .update({ 
          status, 
          attended_at: status === 'attended' ? new Date().toISOString() : null 
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Presença atualizada"
      });

      loadSchedules();
      
      if (selectedClass) {
        setSelectedClass(prev => prev ? {
          ...prev,
          enrollments: prev.enrollments.map(e => 
            e.id === enrollmentId ? { ...e, status } : e
          )
        } : null);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerencie as suas aulas e confirme presenças
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {format(weekStart, "d 'de' MMMM", { locale: pt })} - {format(weekEnd, "d 'de' MMMM yyyy", { locale: pt })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          {/* Desktop View */}
          <div className="hidden md:grid md:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const daySchedules = getSchedulesForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[150px] p-2 rounded-lg border ${
                    isToday(day) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`text-center mb-2 ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                    <p className="text-xs uppercase">{format(day, 'EEE', { locale: pt })}</p>
                    <p className="text-lg font-medium">{format(day, 'd')}</p>
                  </div>
                  <div className="space-y-1">
                    {daySchedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => {
                          setSelectedClass(schedule);
                          setDialogOpen(true);
                        }}
                        className={`w-full text-left p-2 rounded text-xs ${getStatusColor(schedule.status)} text-white hover:opacity-90 transition-opacity`}
                      >
                        <p className="font-medium truncate">{schedule.classes?.name}</p>
                        <p className="opacity-90">{schedule.start_time.substring(0, 5)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3" />
                          <span>{schedule.enrollments.length}/{schedule.classes?.capacity}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {weekDays.map((day) => {
              const daySchedules = getSchedulesForDay(day);
              if (daySchedules.length === 0 && !isToday(day)) return null;
              
              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 rounded-lg border ${
                    isToday(day) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-3 ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                    <Calendar className="h-4 w-4" />
                    <span>{format(day, "EEEE, d 'de' MMMM", { locale: pt })}</span>
                  </div>
                  {daySchedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma aula agendada</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <button
                          key={schedule.id}
                          onClick={() => {
                            setSelectedClass(schedule);
                            setDialogOpen(true);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg ${getStatusColor(schedule.status)} text-white`}
                        >
                          <div>
                            <p className="font-medium">{schedule.classes?.name}</p>
                            <div className="flex items-center gap-2 text-sm opacity-90">
                              <Clock className="h-3 w-3" />
                              <span>{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{schedule.enrollments.length}/{schedule.classes?.capacity}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Class Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedClass?.classes?.name}</DialogTitle>
            <DialogDescription>
              {selectedClass && format(parseISO(selectedClass.scheduled_date), "EEEE, d 'de' MMMM", { locale: pt })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedClass?.start_time.substring(0, 5)} - {selectedClass?.end_time.substring(0, 5)}</span>
                </div>
                <Badge variant={selectedClass?.status === 'completed' ? 'default' : 'secondary'}>
                  {getStatusText(selectedClass?.status)}
                </Badge>
              </div>

              {selectedClass?.status !== 'completed' && selectedClass?.status !== 'cancelled' && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => selectedClass && updateClassStatus(selectedClass.id, 'completed')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Concluir Aula
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => selectedClass && updateClassStatus(selectedClass.id, 'cancelled')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Lista de Presença ({selectedClass?.enrollments.length || 0})
                </h4>
                {selectedClass?.enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum aluno inscrito
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedClass?.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {enrollment.student.profile_photo_url && (
                              <AvatarImage src={enrollment.student.profile_photo_url} />
                            )}
                            <AvatarFallback className="text-xs">
                              {getInitials(enrollment.student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{enrollment.student.full_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={enrollment.status === 'attended' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateAttendance(enrollment.id, 'attended')}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant={enrollment.status === 'absent' ? 'destructive' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateAttendance(enrollment.id, 'absent')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedClass?.notes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{selectedClass.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
