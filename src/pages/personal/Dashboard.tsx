import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Clock, CheckCircle, DollarSign, Dumbbell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isToday, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";

interface StaffInfo {
  id: string;
  full_name: string;
  position: string | null;
  company_id: string;
}

interface Student {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  email: string | null;
}

interface ClassSchedule {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  classes: {
    name: string;
  } | null;
  enrollments: {
    student: Student;
    status: string | null;
  }[];
}

export default function PersonalDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalStudents: 0,
    todayClassCount: 0,
    completedClasses: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get staff info
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, position, company_id')
        .eq('user_id', user.id)
        .single();

      if (staffError || !staff) {
        console.error('Staff not found:', staffError);
        navigate('/login');
        return;
      }

      setStaffInfo(staff);

      // Get students assigned to this personal trainer
      const { data: assignedStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url, email')
        .eq('personal_trainer_id', staff.id)
        .eq('status', 'active');

      if (!studentsError && assignedStudents) {
        setStudents(assignedStudents);
      }

      // Get today's classes where this staff is instructor
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: classSchedules, error: classesError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          status,
          classes (name),
          class_enrollments (
            status,
            students (id, full_name, profile_photo_url, email)
          )
        `)
        .eq('instructor_id', staff.id)
        .eq('scheduled_date', today)
        .order('start_time', { ascending: true });

      if (!classesError && classSchedules) {
        const formattedClasses = classSchedules.map(cls => ({
          ...cls,
          enrollments: (cls.class_enrollments || []).map((enrollment: any) => ({
            student: enrollment.students,
            status: enrollment.status
          }))
        }));
        setTodayClasses(formattedClasses as any);
      }

      // Calculate monthly stats
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: monthClasses } = await supabase
        .from('class_schedules')
        .select('id, status')
        .eq('instructor_id', staff.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);

      const completedCount = monthClasses?.filter(c => c.status === 'completed').length || 0;
      const totalMonthClasses = monthClasses?.length || 0;

      // Get attendance rate
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('status, class_schedules!inner(instructor_id, scheduled_date)')
        .eq('class_schedules.instructor_id', staff.id)
        .gte('class_schedules.scheduled_date', startDate)
        .lte('class_schedules.scheduled_date', endDate);

      const attendedCount = enrollments?.filter((e: any) => e.status === 'attended').length || 0;
      const totalEnrollments = enrollments?.length || 1;
      const attendanceRate = Math.round((attendedCount / totalEnrollments) * 100);

      setMonthlyStats({
        totalStudents: assignedStudents?.length || 0,
        todayClassCount: classSchedules?.length || 0,
        completedClasses: completedCount,
        attendanceRate: attendanceRate || 0
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getClassStatus = (cls: ClassSchedule) => {
    const now = new Date();
    const classDate = parseISO(cls.scheduled_date);
    const [hours, minutes] = cls.start_time.split(':').map(Number);
    const classStart = new Date(classDate);
    classStart.setHours(hours, minutes, 0, 0);

    const [endHours, endMinutes] = cls.end_time.split(':').map(Number);
    const classEnd = new Date(classDate);
    classEnd.setHours(endHours, endMinutes, 0, 0);

    if (cls.status === 'completed') return 'concluída';
    if (cls.status === 'cancelled') return 'cancelada';
    if (now >= classStart && now <= classEnd) return 'em curso';
    if (now > classEnd) return 'pendente';
    return 'agendada';
  };

  const stats = [
    { 
      title: "Total de Alunos", 
      value: monthlyStats.totalStudents.toString(), 
      icon: Users, 
      change: "Alunos atribuídos", 
      trend: "neutral" 
    },
    { 
      title: "Aulas Hoje", 
      value: monthlyStats.todayClassCount.toString(), 
      icon: Calendar, 
      change: `${todayClasses.filter(c => c.status === 'completed').length} concluídas`, 
      trend: "neutral" 
    },
    { 
      title: "Taxa de Presença", 
      value: `${monthlyStats.attendanceRate}%`, 
      icon: CheckCircle, 
      change: "Este mês", 
      trend: monthlyStats.attendanceRate >= 80 ? "up" : "neutral" 
    },
    { 
      title: "Aulas Concluídas", 
      value: monthlyStats.completedClasses.toString(), 
      icon: Dumbbell, 
      change: "Este mês", 
      trend: "up" 
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Personal</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Bem-vindo de volta, {staffInfo?.full_name?.split(' ')[0]}! Aqui está o resumo do seu dia.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-muted-foreground'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agenda de Hoje
            </CardTitle>
            <CardDescription>As suas aulas programadas para hoje</CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma aula agendada para hoje</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls) => {
                  const status = getClassStatus(cls);
                  return (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                          <span className="text-sm font-medium">{cls.start_time.substring(0, 5)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm md:text-base">{cls.classes?.name || 'Aula'}</p>
                          <p className="text-xs text-muted-foreground">
                            {cls.enrollments.length} aluno(s) inscrito(s)
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          status === "concluída"
                            ? "default"
                            : status === "em curso"
                            ? "secondary"
                            : status === "cancelada"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Meus Alunos
            </CardTitle>
            <CardDescription>Alunos atribuídos a si</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum aluno atribuído ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center gap-4">
                    <Avatar>
                      {student.profile_photo_url && (
                        <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(student.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.email || 'Sem email'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {students.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/personal/students')}
              >
                Ver Todos os Alunos ({students.length})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
