import { useState, useEffect, useRef, createContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, Heart, FileText, StickyNote, Pencil, X, Save, 
  Apple, CalendarDays, Dumbbell, Mail, Phone, MapPin, 
  TrendingUp, ArrowLeft, Loader2, Calendar, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

// Context for save trigger
export const SaveTriggerContext = createContext<{
  registerSave: (tabId: string, saveFn: () => Promise<void>) => void;
  unregisterSave: (tabId: string) => void;
}>({
  registerSave: () => {},
  unregisterSave: () => {},
});

// Import shared tabs from company
import { StudentAnamnesisTab } from "@/components/company/students/tabs/StudentAnamnesisTab";
import { StudentNotesTab } from "@/components/company/students/tabs/StudentNotesTab";
import { StudentDocumentsTab } from "@/components/company/students/tabs/StudentDocumentsTab";
import { StudentNutritionTabNew } from "@/components/company/students/tabs/StudentNutritionTabNew";
import { StudentScheduleTab } from "@/components/company/students/tabs/StudentScheduleTab";
import { StudentTrainingTab } from "@/components/company/students/tabs/StudentTrainingTab";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  city?: string | null;
  health_notes: string | null;
  status: string | null;
  company_id: string;
  personal_trainer_id?: string | null;
  created_at?: string;
  profile_photo_url?: string | null;
}

interface StudentStats {
  totalClasses: number;
  attendedClasses: number;
  activeSubscription: string | null;
  lastAttendance: string | null;
  daysSinceRegistration: number;
  activeTrainingPlans: number;
  activeNutritionPlans: number;
}

export default function PersonalStudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
    totalClasses: 0,
    attendedClasses: 0,
    activeSubscription: null,
    lastAttendance: null,
    daysSinceRegistration: 0,
    activeTrainingPlans: 0,
    activeNutritionPlans: 0
  });
  const [staffId, setStaffId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const saveFunctionsRef = useRef<Map<string, () => Promise<void>>>(new Map());

  const registerSave = (tabId: string, saveFn: () => Promise<void>) => {
    saveFunctionsRef.current.set(tabId, saveFn);
  };

  const unregisterSave = (tabId: string) => {
    saveFunctionsRef.current.delete(tabId);
  };

  const handleSave = async () => {
    const saveFn = saveFunctionsRef.current.get(activeTab);
    if (saveFn) {
      setIsSaving(true);
      try {
        await saveFn();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const fetchStudent = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Get current staff
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!staff) {
        navigate('/personal/students');
        return;
      }
      setStaffId(staff.id);

      // Fetch student ensuring it belongs to this personal trainer
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .eq('personal_trainer_id', staff.id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error: any) {
      console.error('Error fetching student:', error);
      toast.error('Erro ao carregar dados do aluno');
      navigate('/personal/students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  useEffect(() => {
    if (student) {
      fetchStudentStats();
    }
  }, [student?.id]);

  const fetchStudentStats = async () => {
    if (!student) return;
    
    try {
      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('status, attended_at')
        .eq('student_id', student.id);
      
      const total = enrollments?.length || 0;
      const attended = enrollments?.filter(e => e.status === 'attended').length || 0;
      const lastAttended = enrollments?.filter(e => e.attended_at).sort((a, b) => 
        new Date(b.attended_at!).getTime() - new Date(a.attended_at!).getTime()
      )[0];

      // Fetch active subscription
      const { data: subscription } = await supabase
        .from('student_subscriptions')
        .select('plan_id')
        .eq('student_id', student.id)
        .eq('status', 'active')
        .maybeSingle();

      let planName: string | null = null;
      if (subscription?.plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscription.plan_id)
          .single();
        planName = plan?.name || null;
      }

      // Fetch active training plans
      const { count: trainingCount } = await supabase
        .from('training_plans')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('is_active', true);

      // Fetch active nutrition plans
      const { count: nutritionCount } = await supabase
        .from('nutrition_meal_plans')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('is_active', true);

      // Calculate days since registration
      const daysSince = student.created_at 
        ? differenceInDays(new Date(), new Date(student.created_at))
        : 0;

      setStats({
        totalClasses: total,
        attendedClasses: attended,
        activeSubscription: planName,
        lastAttendance: lastAttended?.attended_at || null,
        daysSinceRegistration: daysSince,
        activeTrainingPlans: trainingCount || 0,
        activeNutritionPlans: nutritionCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-600">Suspenso</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
    }
  };

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const getGenderLabel = (gender: string | null) => {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Feminino';
      case 'other': return 'Outro';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Aluno não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/personal/students')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/personal/students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Perfil do Aluno</h1>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg shrink-0">
            <AvatarImage src={student.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{student.full_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {getStatusBadge(student.status)}
              {getAge(student.birth_date) && (
                <span className="text-sm text-muted-foreground">{getAge(student.birth_date)} anos</span>
              )}
              {getGenderLabel(student.gender) && (
                <span className="text-sm text-muted-foreground">• {getGenderLabel(student.gender)}</span>
              )}
            </div>
            
            {/* Quick info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
              {student.email && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[180px]">{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.city && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{student.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <Button 
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Cancelar Edição
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Editar Dados
              </>
            )}
          </Button>
        </div>
      </div>

      <SaveTriggerContext.Provider value={{ registerSave, unregisterSave }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex h-auto gap-1 justify-start bg-muted/50 p-1 overflow-x-auto rounded-lg">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Saúde</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Treino</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <Apple className="h-4 w-4" />
              <span className="hidden sm:inline">Nutrição</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background px-3 py-2">
              <StickyNote className="h-4 w-4" />
              <span className="hidden sm:inline">Notas</span>
            </TabsTrigger>
          </TabsList>

          {/* Editing Mode Banner */}
          {isEditing && activeTab === "anamnesis" && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Pencil className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Modo de edição ativo</span>
              </div>
              <Button 
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando..." : "Guardar Alterações"}
              </Button>
            </div>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Dias como aluno</p>
                      <p className="text-lg font-semibold">{stats.daysSinceRegistration}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aulas frequentadas</p>
                      <p className="text-lg font-semibold">{stats.attendedClasses}/{stats.totalClasses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-500/10">
                      <Dumbbell className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Treinos ativos</p>
                      <p className="text-lg font-semibold">{stats.activeTrainingPlans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Apple className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Planos nutrição</p>
                      <p className="text-lg font-semibold">{stats.activeNutritionPlans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Info Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{student.email || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm font-medium">{student.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Data Nascimento</span>
                    <span className="text-sm font-medium">
                      {student.birth_date ? format(new Date(student.birth_date), "dd/MM/yyyy") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Cidade</span>
                    <span className="text-sm font-medium">{student.city || "-"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Notas de Saúde
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {student.health_notes || "Nenhuma nota de saúde registada."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Info */}
            {stats.activeSubscription && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-primary/10">Plano Ativo</Badge>
                      <span className="font-medium">{stats.activeSubscription}</span>
                    </div>
                    {stats.lastAttendance && (
                      <span className="text-sm text-muted-foreground">
                        Última presença: {format(new Date(stats.lastAttendance), "dd/MM/yyyy", { locale: pt })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Anamnesis Tab */}
          <TabsContent value="anamnesis">
            <StudentAnamnesisTab
              studentId={student.id}
              canEdit={true}
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <StudentScheduleTab
              studentId={student.id}
            />
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <StudentTrainingTab
              studentId={student.id}
              canEdit={true}
            />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <StudentNutritionTabNew
              studentId={student.id}
              canEdit={true}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <StudentDocumentsTab
              studentId={student.id}
              canEdit={true}
            />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <StudentNotesTab
              studentId={student.id}
              canEdit={true}
            />
          </TabsContent>
        </Tabs>
      </SaveTriggerContext.Provider>
    </div>
  );
}
