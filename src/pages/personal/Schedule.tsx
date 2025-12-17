import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface ClassSchedule {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  class_info: {
    name: string;
    color: string | null;
    room?: {
      name: string;
    } | null;
  } | null;
  enrollments_count: number;
}

export default function PersonalSchedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Adjust for Monday start
  });

  // Get staff info
  const { data: staffInfo } = useQuery({
    queryKey: ['personal-staff-info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('staff')
        .select('id, company_id, full_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get week's classes
  const { data: weekClasses = [], isLoading } = useQuery({
    queryKey: ['personal-schedule', staffInfo?.id, format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      const weekEnd = addDays(currentWeekStart, 6);

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          classes (
            name,
            color,
            rooms (name)
          ),
          class_enrollments (id)
        `)
        .eq('instructor_id', staffInfo.id)
        .gte('scheduled_date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('start_time');

      if (error) throw error;

      return (data || []).map(cls => ({
        id: cls.id,
        scheduled_date: cls.scheduled_date,
        start_time: cls.start_time,
        end_time: cls.end_time,
        status: cls.status,
        class_info: cls.classes ? {
          name: cls.classes.name,
          color: cls.classes.color,
          room: cls.classes.rooms,
        } : null,
        enrollments_count: cls.class_enrollments?.length || 0,
      })) as ClassSchedule[];
    },
    enabled: !!staffInfo?.id,
    staleTime: 60 * 1000,
  });

  const getWeekDates = () => {
    return weekDays.map((_, index) => {
      const date = addDays(currentWeekStart, index);
      return {
        date,
        dayNum: format(date, 'd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
      };
    });
  };

  const weekDates = getWeekDates();

  const selectedDate = addDays(currentWeekStart, selectedDayIndex);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const dayClasses = weekClasses.filter(cls => cls.scheduled_date === selectedDateStr);
  
  const classesPerDay = weekDays.map((_, i) => {
    const dateStr = format(addDays(currentWeekStart, i), 'yyyy-MM-dd');
    return weekClasses.filter(cls => cls.scheduled_date === dateStr).length;
  });

  const isCurrentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') === 
                        format(currentWeekStart, 'yyyy-MM-dd');

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
    }
    return `${totalMinutes}min`;
  };

  if (isLoading && !staffInfo) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          As suas aulas e compromissos
        </p>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <span className="font-medium">
                {format(currentWeekStart, "d MMM", { locale: pt })} - {format(addDays(currentWeekStart, 6), "d MMM yyyy", { locale: pt })}
              </span>
              {isCurrentWeek && (
                <Badge variant="secondary" className="ml-2">Esta Semana</Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week Days Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {weekDays.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex flex-col items-center p-2 md:p-3 rounded-lg transition-all ${
                  selectedDayIndex === index
                    ? "bg-primary text-primary-foreground"
                    : weekDates[index].isToday
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "hover:bg-muted"
                }`}
              >
                <span className="text-xs font-medium">{day}</span>
                <span className={`text-lg md:text-xl font-bold mt-1 ${
                  selectedDayIndex === index ? "" : "text-foreground"
                }`}>
                  {weekDates[index].dayNum}
                </span>
                {classesPerDay[index] > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    selectedDayIndex === index ? "bg-primary-foreground" : "bg-primary"
                  }`} />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
          </CardTitle>
          <CardDescription>
            {dayClasses.length} aula{dayClasses.length !== 1 ? 's' : ''} agendada{dayClasses.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : dayClasses.length > 0 ? (
            <div className="space-y-3">
              {dayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: cls.class_info?.color || 'hsl(var(--primary))',
                  }}
                >
                  <div className="flex items-center gap-3 md:w-28">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{cls.start_time.substring(0, 5)}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDuration(cls.start_time, cls.end_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{cls.class_info?.name || 'Aula'}</p>
                    {cls.class_info?.room && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{cls.class_info.room.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{cls.enrollments_count}</span>
                    </div>
                    <Badge
                      variant={cls.status === 'completed' ? 'default' : cls.status === 'cancelled' ? 'destructive' : 'secondary'}
                    >
                      {cls.status === 'completed' ? 'Concluída' : cls.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Sem aulas agendadas para este dia</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
