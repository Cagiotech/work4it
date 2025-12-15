import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CheckCircle, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast } from "date-fns";
import { pt } from "date-fns/locale";

interface StudentScheduleTabProps {
  studentId: string;
}

interface ClassSession {
  id: string;
  enrollment_status: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  schedule_status: string;
  class_name: string;
  instructor_name: string | null;
}

export function StudentScheduleTab({ studentId }: StudentScheduleTabProps) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [studentId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          id,
          status,
          class_schedule:class_schedules(
            id,
            scheduled_date,
            start_time,
            end_time,
            status,
            class:classes(name),
            instructor:staff(full_name)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSessions: ClassSession[] = (data || [])
        .filter(item => item.class_schedule)
        .map(item => ({
          id: item.id,
          enrollment_status: item.status,
          scheduled_date: item.class_schedule.scheduled_date,
          start_time: item.class_schedule.start_time,
          end_time: item.class_schedule.end_time,
          schedule_status: item.class_schedule.status,
          class_name: item.class_schedule.class?.name || 'Aula',
          instructor_name: item.class_schedule.instructor?.full_name || null
        }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (enrollmentStatus: string, scheduleStatus: string, date: string) => {
    if (enrollmentStatus === 'cancelled') {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelada</Badge>;
    }
    if (enrollmentStatus === 'no_show') {
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Falta</Badge>;
    }
    if (enrollmentStatus === 'attended' || scheduleStatus === 'completed') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Realizada</Badge>;
    }
    if (isPast(new Date(date))) {
      return <Badge className="bg-muted text-muted-foreground">Passada</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Agendada</Badge>;
  };

  const upcomingSessions = sessions.filter(
    s => !isPast(new Date(s.scheduled_date)) && s.enrollment_status !== 'cancelled'
  );
  const pastSessions = sessions.filter(
    s => isPast(new Date(s.scheduled_date)) || s.enrollment_status === 'cancelled'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderSessionCard = (session: ClassSession, isPastSession: boolean) => (
    <div 
      key={session.id}
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        isPastSession ? 'bg-muted/30' : 'bg-card hover:bg-accent/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg ${
          isPastSession ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        }`}>
          <span className="text-xs font-medium">
            {format(new Date(session.scheduled_date), "MMM", { locale: pt }).toUpperCase()}
          </span>
          <span className="text-xl font-bold">
            {format(new Date(session.scheduled_date), "dd")}
          </span>
        </div>
        <div>
          <p className="font-medium">{session.class_name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
          </div>
          {session.instructor_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{session.instructor_name}</span>
            </div>
          )}
        </div>
      </div>
      {getStatusBadge(session.enrollment_status, session.schedule_status, session.scheduled_date)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Upcoming Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximas Aulas
          </CardTitle>
          <CardDescription>Aulas agendadas para este aluno</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma aula agendada</p>
              <p className="text-sm mt-1">Inscreva o aluno em aulas através do módulo de Aulas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => renderSessionCard(session, false))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Histórico de Aulas
          </CardTitle>
          <CardDescription>Aulas realizadas anteriormente</CardDescription>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma aula realizada</p>
              <p className="text-sm mt-1">O histórico de aulas aparecerá aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((session) => renderSessionCard(session, true))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {sessions.filter(s => s.enrollment_status === 'attended').length}
            </p>
            <p className="text-xs text-muted-foreground">Aulas Realizadas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{upcomingSessions.length}</p>
            <p className="text-xs text-muted-foreground">Aulas Agendadas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {sessions.filter(s => s.enrollment_status === 'no_show').length}
            </p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {sessions.filter(s => s.enrollment_status === 'cancelled').length}
            </p>
            <p className="text-xs text-muted-foreground">Canceladas</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
