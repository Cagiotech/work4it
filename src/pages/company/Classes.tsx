import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Calendar as CalendarIcon, Clock, Users, Pencil, Trash2, UserPlus, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CreateClassDialog } from "@/components/company/classes/CreateClassDialog";
import { ScheduleClassDialog } from "@/components/company/classes/ScheduleClassDialog";
import { EnrollStudentsDialog } from "@/components/company/classes/EnrollStudentsDialog";
import { MonthlyCalendarView } from "@/components/company/classes/MonthlyCalendarView";
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

interface ClassType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  color: string;
  is_active: boolean;
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
  class: ClassType;
  instructor: { full_name: string } | null;
  enrollments_count: number;
}

const weekDays = [
  { key: "seg", label: "Segunda", dayOffset: 0 },
  { key: "ter", label: "Terça", dayOffset: 1 },
  { key: "qua", label: "Quarta", dayOffset: 2 },
  { key: "qui", label: "Quinta", dayOffset: 3 },
  { key: "sex", label: "Sexta", dayOffset: 4 },
  { key: "sab", label: "Sábado", dayOffset: 5 },
];

export default function Classes() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<ClassSchedule[]>([]);
  const [monthSchedules, setMonthSchedules] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'class' | 'schedule', id: string } | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const fetchData = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      // Fetch class types
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');
      
      if (classError) throw classError;
      setClassTypes(classes || []);

      // Fetch schedules for this week
      const weekEnd = addDays(weekStart, 6);
      const { data: weekData, error: weekError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(*),
          instructor:staff(full_name)
        `)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date')
        .order('start_time');

      if (weekError) throw weekError;

      // Fetch schedules for current month (for calendar view)
      const { data: monthData, error: monthError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(*),
          instructor:staff(full_name)
        `)
        .gte('scheduled_date', format(currentMonthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(currentMonthEnd, 'yyyy-MM-dd'))
        .order('scheduled_date')
        .order('start_time');

      if (monthError) throw monthError;

      // Helper to add enrollment counts
      const addEnrollmentCounts = async (schedulesData: any[]) => {
        return Promise.all(
          (schedulesData || []).map(async (schedule) => {
            const { count } = await supabase
              .from('class_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('class_schedule_id', schedule.id)
              .neq('status', 'cancelled');
            
            return {
              ...schedule,
              enrollments_count: count || 0
            };
          })
        );
      };

      const weekWithCounts = await addEnrollmentCounts(weekData || []);
      const monthWithCounts = await addEnrollmentCounts(monthData || []);

      setWeekSchedules(weekWithCounts);
      setMonthSchedules(monthWithCounts);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleDeleteClass = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'class') return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      toast.success('Tipo de aula eliminado');
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Erro ao eliminar tipo de aula');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'schedule') return;
    
    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      toast.success('Aula eliminada');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Erro ao eliminar aula');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getSchedulesForDay = (dayOffset: number) => {
    const date = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');
    return weekSchedules.filter(s => s.scheduled_date === date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="gap-1.5"
            >
              <List className="h-4 w-4" />
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="gap-1.5"
            >
              <CalendarDays className="h-4 w-4" />
              Mês
            </Button>
          </div>
          {viewMode === 'week' && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {format(weekStart, "d", { locale: pt })} - {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: pt })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
          <Button onClick={() => setShowScheduleDialog(true)} className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Agendar Aula
          </Button>
        </div>
      </div>

      {/* Monthly Calendar View */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-4">
            <MonthlyCalendarView
              schedules={monthSchedules}
              onEnroll={(schedule) => {
                setSelectedSchedule(schedule);
                setShowEnrollDialog(true);
              }}
              onDelete={(id) => setDeleteConfirm({ type: 'schedule', id })}
            />
          </CardContent>
        </Card>
      )}

      {/* Weekly View - Classes by Day */}
      {viewMode === 'week' && (
        <Tabs defaultValue="seg" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {weekDays.map((day) => (
              <TabsTrigger key={day.key} value={day.key} className="min-w-[100px]">
                {day.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {getSchedulesForDay(day.dayOffset).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        
        {weekDays.map((day) => (
          <TabsContent key={day.key} value={day.key} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getSchedulesForDay(day.dayOffset).map((schedule) => (
                <Card 
                  key={schedule.id} 
                  className="hover:shadow-lg transition-shadow border-l-4"
                  style={{ borderLeftColor: schedule.class?.color || '#aeca12' }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-heading font-semibold text-lg text-foreground">
                        {schedule.class?.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={
                          schedule.enrollments_count >= (schedule.class?.capacity || 0)
                            ? "border-red-500 text-red-500"
                            : "border-primary text-primary"
                        }
                      >
                        {schedule.enrollments_count}/{schedule.class?.capacity}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                      </div>
                      {schedule.instructor && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{schedule.instructor.full_name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowEnrollDialog(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Inscrever
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setDeleteConfirm({ type: 'schedule', id: schedule.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getSchedulesForDay(day.dayOffset).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhuma aula agendada para este dia
                </div>
              )}
            </div>
          </TabsContent>
        ))}
        </Tabs>
      )}

      {/* All Class Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Aula</CardTitle>
        </CardHeader>
        <CardContent>
          {classTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum tipo de aula criado</p>
              <Button 
                variant="link" 
                onClick={() => setShowCreateDialog(true)}
                className="mt-2"
              >
                Criar primeiro tipo de aula
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {classTypes.map((classType) => (
                <div 
                  key={classType.id} 
                  className="p-4 rounded-xl text-center hover:shadow-md transition-all cursor-pointer group relative"
                  style={{ backgroundColor: `${classType.color}20` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: classType.color }}
                  />
                  <span className="font-medium text-foreground">{classType.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {classType.duration_minutes} min | {classType.capacity} vagas
                  </p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClassType(classType);
                        setShowCreateDialog(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'class', id: classType.id });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClassDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedClassType(null);
        }}
        classType={selectedClassType}
        onSuccess={fetchData}
      />

      <ScheduleClassDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        classTypes={classTypes}
        onSuccess={fetchData}
      />

      <EnrollStudentsDialog
        open={showEnrollDialog}
        onOpenChange={(open) => {
          setShowEnrollDialog(open);
          if (!open) setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        onSuccess={fetchData}
      />

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'class' 
                ? 'Tem certeza que deseja eliminar este tipo de aula? Todas as aulas agendadas deste tipo também serão eliminadas.'
                : 'Tem certeza que deseja eliminar esta aula agendada? Todas as inscrições serão canceladas.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteConfirm?.type === 'class' ? handleDeleteClass : handleDeleteSchedule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
