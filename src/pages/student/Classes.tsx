import { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast } from "date-fns";
import { pt } from "date-fns/locale";
import { BookClassDialog } from "@/components/student/BookClassDialog";

interface ClassSession {
  id: string;
  enrollment_status: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  schedule_status: string;
  class_name: string;
  class_color: string;
  instructor_name: string | null;
}

export default function StudentClasses() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [studentData, setStudentData] = useState<{ id: string; personal_trainer_id: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First get student id and personal trainer
      const { data: student } = await supabase
        .from('students')
        .select('id, personal_trainer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) {
        setIsLoading(false);
        return;
      }
      
      setStudentData({ id: student.id, personal_trainer_id: student.personal_trainer_id });

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
            class:classes(name, color),
            instructor:staff(full_name)
          )
        `)
        .eq('student_id', student.id)
        .neq('status', 'cancelled')
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
          class_color: item.class_schedule.class?.color || '#aeca12',
          instructor_name: item.class_schedule.instructor?.full_name || null
        }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, scheduleStatus: string, date: string) => {
    if (status === 'attended' || scheduleStatus === 'completed') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Realizada</Badge>;
    }
    if (status === 'no_show') {
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Falta</Badge>;
    }
    if (isPast(new Date(date))) {
      return <Badge className="bg-muted text-muted-foreground">Passada</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Agendada</Badge>;
  };

  const upcomingSessions = sessions.filter(s => !isPast(new Date(s.scheduled_date)));
  const pastSessions = sessions.filter(s => isPast(new Date(s.scheduled_date)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aulas e Horários</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Ainda não está inscrito em nenhuma aula.
            </p>
            {studentData && (
              <Button onClick={() => setShowBookDialog(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Agendar Aula
              </Button>
            )}
          </CardContent>
        </Card>
        
        {studentData && (
          <BookClassDialog
            open={showBookDialog}
            onOpenChange={setShowBookDialog}
            studentId={studentData.id}
            personalTrainerId={studentData.personal_trainer_id}
            onSuccess={fetchSessions}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Book Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">As Minhas Aulas</h1>
        {studentData && (
          <Button onClick={() => setShowBookDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Agendar Aula
          </Button>
        )}
      </div>
      
      {/* Upcoming Classes */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Aulas
            </CardTitle>
            <CardDescription>As suas aulas agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-l-4 bg-card hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: session.class_color }}
                >
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary">
                    <span className="text-xs font-medium">
                      {format(new Date(session.scheduled_date), "MMM", { locale: pt }).toUpperCase()}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(new Date(session.scheduled_date), "dd")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{session.class_name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                      </span>
                      {session.instructor_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {session.instructor_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(session.enrollment_status, session.schedule_status, session.scheduled_date)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Classes */}
      {pastSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Histórico
            </CardTitle>
            <CardDescription>Aulas anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastSessions.slice(0, 10).map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session.scheduled_date), "dd MMM", { locale: pt })}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.class_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        {session.instructor_name && ` • ${session.instructor_name}`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(session.enrollment_status, session.schedule_status, session.scheduled_date)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{sessions.length}</p>
            <p className="text-xs text-muted-foreground">Total de Aulas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{upcomingSessions.length}</p>
            <p className="text-xs text-muted-foreground">Agendadas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.enrollment_status === 'attended').length}
            </p>
            <p className="text-xs text-muted-foreground">Realizadas</p>
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
      </div>

      {/* Book Class Dialog */}
      {studentData && (
        <BookClassDialog
          open={showBookDialog}
          onOpenChange={setShowBookDialog}
          studentId={studentData.id}
          personalTrainerId={studentData.personal_trainer_id}
          onSuccess={fetchSessions}
        />
      )}
    </div>
  );
}
