import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Users, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  };
  instructor: { full_name: string } | null;
  enrollments_count: number;
}

interface MonthlyCalendarViewProps {
  schedules: ClassSchedule[];
  onEnroll: (schedule: ClassSchedule) => void;
  onDelete: (scheduleId: string) => void;
}

const weekDaysShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function MonthlyCalendarView({ schedules, onEnroll, onDelete }: MonthlyCalendarViewProps) {
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

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-heading font-semibold text-lg capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: pt })}
        </h3>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-muted">
          {weekDaysShort.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before the start of the month */}
          {Array.from({ length: startDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] p-2 border-b border-r border-border bg-muted/30" />
          ))}

          {daysInMonth.map((day, index) => {
            const daySchedules = getSchedulesForDate(day);
            const isToday = isSameDay(day, new Date());
            const hasSchedules = daySchedules.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r border-border cursor-pointer hover:bg-accent/50 transition-colors",
                  isToday && "bg-primary/5",
                  !isSameMonth(day, currentMonth) && "text-muted-foreground bg-muted/30"
                )}
                onClick={() => {
                  setSelectedDay(day);
                  if (hasSchedules) {
                    setShowDayDialog(true);
                  }
                }}
              >
                <div className={cn(
                  "font-medium text-sm mb-1",
                  isToday && "text-primary font-bold"
                )}>
                  {format(day, "d")}
                </div>
                
                {/* Class indicators */}
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map((schedule) => (
                    <div
                      key={schedule.id}
                      className="text-xs px-1.5 py-0.5 rounded truncate"
                      style={{ 
                        backgroundColor: `${schedule.class?.color || '#aeca12'}30`,
                        borderLeft: `2px solid ${schedule.class?.color || '#aeca12'}`
                      }}
                    >
                      <span className="hidden sm:inline">{schedule.start_time.slice(0, 5)} </span>
                      {schedule.class?.name}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1.5">
                      +{daySchedules.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, "EEEE, d 'de' MMMM", { locale: pt })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDaySchedules.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma aula agendada para este dia
              </p>
            ) : (
              selectedDaySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-3 rounded-lg border border-border"
                  style={{ borderLeftWidth: '4px', borderLeftColor: schedule.class?.color || '#aeca12' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{schedule.class?.name}</h4>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        schedule.enrollments_count >= (schedule.class?.capacity || 0)
                          ? "border-red-500 text-red-500"
                          : "border-primary text-primary"
                      )}
                    >
                      {schedule.enrollments_count}/{schedule.class?.capacity}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                    </div>
                    {schedule.instructor && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>{schedule.instructor.full_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
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
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setShowDayDialog(false);
                        onDelete(schedule.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
