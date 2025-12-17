import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

interface ClassEnrollment {
  id: string;
  status: string | null;
  attended_at: string | null;
  student: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

interface ClassSchedule {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  class_info: {
    name: string;
  } | null;
  enrollments: ClassEnrollment[];
}

export default function PersonalAttendance() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Get classes for selected date
  const { data: classSchedules = [], isLoading } = useQuery({
    queryKey: ['personal-attendance-classes', staffInfo?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          classes (name),
          class_enrollments (
            id,
            status,
            attended_at,
            students (id, full_name, profile_photo_url)
          )
        `)
        .eq('instructor_id', staffInfo.id)
        .eq('scheduled_date', dateStr)
        .order('start_time');

      if (error) throw error;

      return (data || []).map(cls => ({
        ...cls,
        class_info: cls.classes,
        enrollments: (cls.class_enrollments || []).map((e: any) => ({
          id: e.id,
          status: e.status,
          attended_at: e.attended_at,
          student: e.students,
        })),
      })) as ClassSchedule[];
    },
    enabled: !!staffInfo?.id,
    staleTime: 30 * 1000,
  });

  // Get weekly stats
  const { data: weeklyStats = [] } = useQuery({
    queryKey: ['personal-weekly-stats', staffInfo?.id, format(selectedDate, 'yyyy-ww')],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          scheduled_date,
          class_enrollments (status)
        `)
        .eq('instructor_id', staffInfo.id)
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const statsByDay: Record<string, { total: number; present: number; absent: number }> = {};

      days.forEach(day => {
        statsByDay[day] = { total: 0, present: 0, absent: 0 };
      });

      (data || []).forEach((cls: any) => {
        const date = new Date(cls.scheduled_date);
        const dayIndex = (date.getDay() + 6) % 7;
        const dayName = days[dayIndex];

        (cls.class_enrollments || []).forEach((e: any) => {
          statsByDay[dayName].total++;
          if (e.status === 'attended') {
            statsByDay[dayName].present++;
          } else if (e.status === 'absent') {
            statsByDay[dayName].absent++;
          }
        });
      });

      return days.map(day => ({
        day,
        ...statsByDay[day],
      }));
    },
    enabled: !!staffInfo?.id,
    staleTime: 60 * 1000,
  });

  // Get monthly student attendance
  const { data: studentAttendance = [] } = useQuery({
    queryKey: ['personal-student-attendance', staffInfo?.id, format(selectedDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          status,
          students!inner (id, full_name, profile_photo_url),
          class_schedules!inner (instructor_id, scheduled_date)
        `)
        .eq('class_schedules.instructor_id', staffInfo.id)
        .gte('class_schedules.scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('class_schedules.scheduled_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const studentStats: Record<string, { 
        name: string; 
        photo: string | null;
        total: number; 
        present: number;
      }> = {};

      (data || []).forEach((e: any) => {
        const studentId = e.students.id;
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            name: e.students.full_name,
            photo: e.students.profile_photo_url,
            total: 0,
            present: 0,
          };
        }
        studentStats[studentId].total++;
        if (e.status === 'attended') {
          studentStats[studentId].present++;
        }
      });

      return Object.values(studentStats).map(s => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      })).sort((a, b) => b.rate - a.rate);
    },
    enabled: !!staffInfo?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Mark attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async ({ enrollmentId, attended }: { enrollmentId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('class_enrollments')
        .update({
          status: attended ? 'attended' : 'absent',
          attended_at: attended ? new Date().toISOString() : null,
        })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-attendance-classes'] });
      queryClient.invalidateQueries({ queryKey: ['personal-weekly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['personal-student-attendance'] });
      toast.success("Presença atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar presença");
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isLoading && !staffInfo) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lista de Presença</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Registar e acompanhar a presença dos alunos
          </p>
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium capitalize">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Today's Classes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Aulas do Dia
            </CardTitle>
            <CardDescription>Marcar presença dos alunos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : classSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma aula agendada para este dia</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classSchedules.map((cls) => (
                  <div key={cls.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className="font-bold text-lg">{cls.start_time.substring(0, 5)}</span>
                          <p className="text-xs text-muted-foreground">{cls.class_info?.name}</p>
                        </div>
                      </div>
                      <Badge variant={cls.status === 'completed' ? 'default' : 'secondary'}>
                        {cls.status === 'completed' ? 'Concluída' : 'Agendada'}
                      </Badge>
                    </div>

                    {cls.enrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem alunos inscritos</p>
                    ) : (
                      <div className="space-y-2">
                        {cls.enrollments.map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              enrollment.status === 'attended'
                                ? 'bg-green-500/10 border border-green-500/20'
                                : enrollment.status === 'absent'
                                ? 'bg-red-500/10 border border-red-500/20'
                                : 'bg-muted/30 border'
                            }`}
                          >
                            <Avatar className="h-9 w-9">
                              {enrollment.student?.profile_photo_url && (
                                <AvatarImage src={enrollment.student.profile_photo_url} />
                              )}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(enrollment.student?.full_name || '?')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 font-medium text-sm">
                              {enrollment.student?.full_name}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant={enrollment.status === 'attended' ? 'default' : 'outline'}
                                size="sm"
                                className={enrollment.status === 'attended' ? 'bg-green-600 hover:bg-green-700' : ''}
                                onClick={() => attendanceMutation.mutate({ 
                                  enrollmentId: enrollment.id, 
                                  attended: true 
                                })}
                                disabled={attendanceMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={enrollment.status === 'absent' ? 'default' : 'outline'}
                                size="sm"
                                className={enrollment.status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => attendanceMutation.mutate({ 
                                  enrollmentId: enrollment.id, 
                                  attended: false 
                                })}
                                disabled={attendanceMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Semanal</CardTitle>
            <CardDescription>Taxa de presença por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyStats.map((day) => (
                <div key={day.day} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-10">{day.day}</span>
                  <div className="flex items-center gap-2 flex-1 ml-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: day.total > 0 ? `${(day.present / day.total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {day.present}/{day.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Presença por Aluno</CardTitle>
          <CardDescription>
            Acompanhamento de {format(selectedDate, "MMMM yyyy", { locale: pt })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentAttendance.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Sem dados de presença este mês</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studentAttendance.map((student) => (
                <div
                  key={student.name}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar className="h-10 w-10">
                    {student.photo && <AvatarImage src={student.photo} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.present}/{student.total} aulas
                    </p>
                  </div>
                  <Badge
                    variant={student.rate >= 90 ? "default" : student.rate >= 75 ? "secondary" : "destructive"}
                    className={`${
                      student.rate >= 90
                        ? "bg-green-600"
                        : student.rate >= 75
                        ? "bg-yellow-600"
                        : ""
                    }`}
                  >
                    {student.rate}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
