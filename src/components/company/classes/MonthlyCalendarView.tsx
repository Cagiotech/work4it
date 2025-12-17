import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Users, UserPlus, Trash2, Pencil, X, MapPin, User, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface MonthlyCalendarViewProps {
  schedules: ClassSchedule[];
  onEnroll: (schedule: ClassSchedule) => void;
  onEdit: (schedule: ClassSchedule) => void;
  onDuplicate: (schedule: ClassSchedule) => void;
  onDelete: (scheduleId: string) => void;
}

const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthlyCalendarView({ schedules, onEnroll, onEdit, onDuplicate, onDelete }: MonthlyCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter(s => s.scheduled_date === dateStr);
  };

  const selectedDaySchedules = selectedDay ? getSchedulesForDate(selectedDay) : [];

  // Calculate total classes this month
  const totalClassesThisMonth = schedules.length;
  const totalEnrollmentsThisMonth = schedules.reduce((sum, s) => sum + s.enrollments_count, 0);

  return (
    <div className="space-y-4">
      {/* Month Navigation with Stats */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="font-heading font-semibold text-lg capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: pt })}
              </h3>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{totalClassesThisMonth} aulas</span>
                <span>•</span>
                <span>{totalEnrollmentsThisMonth} inscrições</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 bg-muted/50">
            {weekDaysShort.map((day, index) => (
              <div 
                key={day} 
                className={cn(
                  "p-3 text-center text-sm font-medium text-muted-foreground border-b border-border",
                  index === 0 && "text-red-500/70"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before the start of the month */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[110px] p-2 border-b border-r border-border bg-muted/20" />
            ))}

            {daysInMonth.map((day) => {
              const daySchedules = getSchedulesForDate(day);
              const isToday = isSameDay(day, new Date());
              const hasSchedules = daySchedules.length > 0;
              const isSunday = getDay(day) === 0;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[110px] p-2 border-b border-r border-border cursor-pointer hover:bg-accent/30 transition-colors",
                    isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground bg-muted/30",
                    isSunday && "bg-red-500/5"
                  )}
                  onClick={() => {
                    setSelectedDay(day);
                    if (hasSchedules) {
                      setShowDayDialog(true);
                    }
                  }}
                >
                  <div className={cn(
                    "font-medium text-sm mb-1.5 flex items-center justify-between",
                    isToday && "text-primary font-bold"
                  )}>
                    <span className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    {hasSchedules && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {daySchedules.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Class indicators */}
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="text-[11px] px-1.5 py-1 rounded truncate font-medium"
                        style={{ 
                          backgroundColor: `${schedule.class?.color || '#aeca12'}20`,
                          borderLeft: `3px solid ${schedule.class?.color || '#aeca12'}`,
                          color: schedule.class?.color || '#aeca12'
                        }}
                      >
                        <span className="hidden sm:inline text-foreground/70">{schedule.start_time.slice(0, 5)} </span>
                        <span className="text-foreground">{schedule.class?.name}</span>
                      </div>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-[11px] text-muted-foreground px-1.5 font-medium">
                        +{daySchedules.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="capitalize">
                {selectedDay && format(selectedDay, "EEEE, d 'de' MMMM", { locale: pt })}
              </span>
              {selectedDaySchedules.length > 0 && (
                <Badge variant="outline">{selectedDaySchedules.length} aula(s)</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDaySchedules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma aula agendada para este dia
              </p>
            ) : (
              selectedDaySchedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="border-l-4"
                  style={{ borderLeftColor: schedule.class?.color || '#aeca12' }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: schedule.class?.color || '#aeca12' }}
                        />
                        <h4 className="font-heading font-semibold">{schedule.class?.name}</h4>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          schedule.enrollments_count >= (schedule.class?.capacity || 0)
                            ? "border-red-500 text-red-600 bg-red-500/10"
                            : "border-primary text-primary bg-primary/10"
                        )}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {schedule.enrollments_count}/{schedule.class?.capacity}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium">{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                      </div>
                      {schedule.instructor && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{schedule.instructor.full_name}</span>
                        </div>
                      )}
                      {schedule.class?.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{schedule.class.room.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setShowDayDialog(false);
                                onEnroll(schedule);
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1" />
                              Inscrever
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Inscrever alunos</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setShowDayDialog(false);
                                onEdit(schedule);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar aula</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setShowDayDialog(false);
                                onDuplicate(schedule);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicar aula</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:border-destructive"
                              onClick={() => {
                                setShowDayDialog(false);
                                onDelete(schedule.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar aula</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
