import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isFuture, isToday } from "date-fns";
import { pt } from "date-fns/locale";

interface StudentScheduleTabProps {
  studentId: string;
}

interface ClassSession {
  id: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: string;
  trainer_name: string;
  class_type: string;
  notes?: string;
}

export function StudentScheduleTab({ studentId }: StudentScheduleTabProps) {
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [pastClasses, setPastClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, show empty state since classes table doesn't exist yet
    // This will be connected to real data when the Classes module is implemented
    setIsLoading(false);
  }, [studentId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Realizada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelada</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Agendada</Badge>;
      case 'no_show':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Falta</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          {upcomingClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma aula agendada</p>
              <p className="text-sm mt-1">As aulas serão mostradas aqui quando forem agendadas no módulo de Aulas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary">
                      <span className="text-xs font-medium">
                        {format(new Date(session.date), "MMM", { locale: pt }).toUpperCase()}
                      </span>
                      <span className="text-xl font-bold">
                        {format(new Date(session.date), "dd")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.class_type}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{session.time} ({session.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{session.trainer_name}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              ))}
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
          {pastClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma aula realizada</p>
              <p className="text-sm mt-1">O histórico de aulas aparecerá aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastClasses.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-muted text-muted-foreground">
                      <span className="text-xs font-medium">
                        {format(new Date(session.date), "MMM", { locale: pt }).toUpperCase()}
                      </span>
                      <span className="text-xl font-bold">
                        {format(new Date(session.date), "dd")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.class_type}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{session.time} ({session.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{session.trainer_name}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{pastClasses.filter(c => c.status === 'completed').length}</p>
            <p className="text-xs text-muted-foreground">Aulas Realizadas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{upcomingClasses.length}</p>
            <p className="text-xs text-muted-foreground">Aulas Agendadas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{pastClasses.filter(c => c.status === 'no_show').length}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{pastClasses.filter(c => c.status === 'cancelled').length}</p>
            <p className="text-xs text-muted-foreground">Canceladas</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
