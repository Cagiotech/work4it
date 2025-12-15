import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, addWeeks, subWeeks, startOfDay, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Users, UserPlus, Trash2, User, MapPin, List, CalendarDays, Calendar as CalendarIcon, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MonthlyCalendarView } from "./MonthlyCalendarView";

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
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
  class: {
    id: string;
    name: string;
    capacity: number;
    color: string;
    room?: Room | null;
  };
  instructor: { full_name: string } | null;
  enrollments_count: number;
}

interface CalendarSectionProps {
  weekSchedules: ClassSchedule[];
  monthSchedules: ClassSchedule[];
  hasClassTypes: boolean;
  onEnroll: (schedule: ClassSchedule) => void;
  onDelete: (id: string) => void;
  onScheduleClass: () => void;
}

const weekDays = [
  { key: "seg", label: "Segunda", shortLabel: "Seg", dayOffset: 0 },
  { key: "ter", label: "Terça", shortLabel: "Ter", dayOffset: 1 },
  { key: "qua", label: "Quarta", shortLabel: "Qua", dayOffset: 2 },
  { key: "qui", label: "Quinta", shortLabel: "Qui", dayOffset: 3 },
  { key: "sex", label: "Sexta", shortLabel: "Sex", dayOffset: 4 },
  { key: "sab", label: "Sábado", shortLabel: "Sáb", dayOffset: 5 },
  { key: "dom", label: "Domingo", shortLabel: "Dom", dayOffset: 6 },
];

export function CalendarSection({ 
  weekSchedules, 
  monthSchedules, 
  hasClassTypes,
  onEnroll, 
  onDelete,
  onScheduleClass 
}: CalendarSectionProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));

  // If no class types exist, show empty state with button to settings
  if (!hasClassTypes) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <CalendarIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Nenhum tipo de aula configurado</h3>
          <p className="text-muted-foreground max-w-md">
            Antes de agendar aulas, é necessário criar os tipos de aula nas configurações.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/company/settings?tab=classes')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Criar Tipo de Aula
        </Button>
      </div>
    );
  }

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return weekSchedules.filter(s => s.scheduled_date === dateStr);
  };

  const getSchedulesForDay = (dayOffset: number) => {
    const date = format(addDays(currentWeekStart, dayOffset), 'yyyy-MM-dd');
    return weekSchedules.filter(s => s.scheduled_date === date);
  };

  const renderScheduleCard = (schedule: ClassSchedule, compact = false) => (
    <Card 
      key={schedule.id} 
      className="hover:shadow-lg transition-shadow border-l-4"
      style={{ borderLeftColor: schedule.class?.color || '#aeca12' }}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex justify-between items-start mb-2">
          <h3 className={cn("font-heading font-semibold text-foreground", compact ? "text-base" : "text-lg")}>
            {schedule.class?.name}
          </h3>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              schedule.enrollments_count >= (schedule.class?.capacity || 0)
                ? "border-red-500 text-red-500"
                : "border-primary text-primary"
            )}
          >
            {schedule.enrollments_count}/{schedule.class?.capacity}
          </Badge>
        </div>
        
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
          </div>
          {schedule.instructor && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{schedule.instructor.full_name}</span>
            </div>
          )}
          {schedule.class?.room && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{schedule.class.room.name}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEnroll(schedule)}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Inscrever
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(schedule.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header with view toggle and navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="gap-1.5 px-2.5"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Dia</span>
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="gap-1.5 px-2.5"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Semana</span>
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="gap-1.5 px-2.5"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Mês</span>
            </Button>
          </div>
        </div>

        <Button onClick={onScheduleClass} className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          Agendar Aula
        </Button>
      </div>

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDay(addDays(selectedDay, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-heading font-semibold text-lg capitalize">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: pt })}
            </h3>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDay(addDays(selectedDay, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSchedulesForDate(selectedDay).map((schedule) => renderScheduleCard(schedule))}
            {getSchedulesForDate(selectedDay).length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhuma aula agendada para este dia
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-heading font-semibold text-base sm:text-lg">
              {format(currentWeekStart, "d", { locale: pt })} - {format(addDays(currentWeekStart, 6), "d MMMM yyyy", { locale: pt })}
            </h3>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="seg" className="w-full">
            <TabsList className="w-full grid grid-cols-7 h-auto p-1">
              {weekDays.map((day) => {
                const dayDate = addDays(currentWeekStart, day.dayOffset);
                const isToday = isSameDay(dayDate, new Date());
                const count = getSchedulesForDay(day.dayOffset).length;
                return (
                  <TabsTrigger 
                    key={day.key} 
                    value={day.key} 
                    className={cn(
                      "py-2 px-1 text-xs font-medium",
                      isToday && "ring-2 ring-primary ring-inset"
                    )}
                  >
                    {day.shortLabel}
                    {count > 0 && (
                      <span className="ml-1 text-[10px] bg-muted-foreground/20 rounded-full px-1.5">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          
            {weekDays.map((day) => (
              <TabsContent key={day.key} value={day.key} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSchedulesForDay(day.dayOffset).map((schedule) => renderScheduleCard(schedule))}
                  {getSchedulesForDay(day.dayOffset).length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Nenhuma aula agendada para este dia
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <MonthlyCalendarView
          schedules={monthSchedules}
          onEnroll={onEnroll}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
