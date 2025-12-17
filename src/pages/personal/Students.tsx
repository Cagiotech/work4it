import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Calendar, User, Dumbbell, Apple, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  status: string | null;
  enrollment_date: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  health_notes: string | null;
  subscription?: {
    plan_name: string;
    status: string;
  } | null;
}

export default function PersonalStudents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get staff info
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!staff) {
        console.error('Staff not found');
        return;
      }

      // Get students assigned to this personal trainer
      const { data: studentsData, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          email,
          phone,
          profile_photo_url,
          status,
          enrollment_date,
          birth_date,
          gender,
          address,
          city,
          health_notes,
          student_subscriptions (
            status,
            subscription_plans (name)
          )
        `)
        .eq('personal_trainer_id', staff.id)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading students:', error);
        return;
      }

      const formattedStudents = studentsData?.map(student => ({
        ...student,
        subscription: student.student_subscriptions?.[0] ? {
          plan_name: (student.student_subscriptions[0] as any).subscription_plans?.name || 'Sem plano',
          status: (student.student_subscriptions[0] as any).status || 'inactive'
        } : null
      })) || [];

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openStudentProfile = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meus Alunos</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {students.length} aluno(s) atribuído(s) a si
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar alunos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
                className="flex-1 sm:flex-none"
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
                className="flex-1 sm:flex-none"
              >
                Ativos
              </Button>
              <Button
                variant={filterStatus === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("inactive")}
                className="flex-1 sm:flex-none"
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm || filterStatus !== "all" 
                ? "Tente ajustar os filtros de pesquisa"
                : "Ainda não tem alunos atribuídos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <Card 
              key={student.id} 
              className="hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => openStudentProfile(student)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    {student.profile_photo_url && (
                      <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(student.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{student.full_name}</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {student.subscription?.plan_name || 'Sem plano'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(student.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {student.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.enrollment_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Desde {format(new Date(student.enrollment_date), "MMM yyyy", { locale: pt })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Profile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {selectedStudent?.profile_photo_url && (
                  <AvatarImage src={selectedStudent.profile_photo_url} alt={selectedStudent?.full_name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {selectedStudent ? getInitials(selectedStudent.full_name) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{selectedStudent?.full_name}</DialogTitle>
                <DialogDescription>
                  {selectedStudent?.subscription?.plan_name || 'Sem plano ativo'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info" className="text-xs">
                  <User className="h-3.5 w-3.5 mr-1" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="training" className="text-xs">
                  <Dumbbell className="h-3.5 w-3.5 mr-1" />
                  Treino
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="text-xs">
                  <Apple className="h-3.5 w-3.5 mr-1" />
                  Nutrição
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  {selectedStudent?.email && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{selectedStudent.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedStudent?.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="text-sm font-medium">{selectedStudent.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedStudent?.birth_date && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedStudent.birth_date), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedStudent?.health_notes && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Notas de Saúde</p>
                      </div>
                      <p className="text-sm">{selectedStudent.health_notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="training" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Planos de treino serão exibidos aqui</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Criar Plano de Treino
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="nutrition" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Apple className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Planos nutricionais serão exibidos aqui</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Criar Plano Nutricional
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}