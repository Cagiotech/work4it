import { useState, useEffect, useRef, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, Heart, CreditCard, FileText, StickyNote, Pencil, Trash2, X, Save, 
  Apple, CalendarDays, Dumbbell, Mail, Phone, MapPin, Calendar, Clock,
  TrendingUp, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

// Context for save trigger
export const SaveTriggerContext = createContext<{
  registerSave: (tabId: string, saveFn: () => Promise<void>) => void;
  unregisterSave: (tabId: string) => void;
}>({
  registerSave: () => {},
  unregisterSave: () => {},
});
import { StudentProfileTab } from "./tabs/StudentProfileTab";
import { StudentAnamnesisTab } from "./tabs/StudentAnamnesisTab";
import { StudentPlansTab } from "./tabs/StudentPlansTab";
import { StudentNotesTab } from "./tabs/StudentNotesTab";
import { StudentDocumentsTab } from "./tabs/StudentDocumentsTab";
import { StudentNutritionTabNew } from "./tabs/StudentNutritionTabNew";
import { StudentScheduleTab } from "./tabs/StudentScheduleTab";
import { StudentTrainingTab } from "./tabs/StudentTrainingTab";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  nationality?: string | null;
  nif?: string | null;
  niss?: string | null;
  citizen_card?: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
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
}

interface StudentProfileDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function StudentProfileDialog({ 
  student, 
  open, 
  onOpenChange, 
  onUpdate,
  onDelete,
  canEdit = true,
  canDelete = true,
}: StudentProfileDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
    totalClasses: 0,
    attendedClasses: 0,
    activeSubscription: null,
    lastAttendance: null,
    daysSinceRegistration: 0
  });
  const [personalTrainer, setPersonalTrainer] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (open && student) {
      setActiveTab("overview");
      setIsEditing(false);
      fetchStudentStats();
      fetchPersonalTrainer();
    }
  }, [open, student?.id]);

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

      // Fetch active subscription with plan name
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

      // Calculate days since registration
      const daysSince = student.created_at 
        ? differenceInDays(new Date(), new Date(student.created_at))
        : 0;

      setStats({
        totalClasses: total,
        attendedClasses: attended,
        activeSubscription: planName,
        lastAttendance: lastAttended?.attended_at || null,
        daysSinceRegistration: daysSince
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPersonalTrainer = async () => {
    if (!student?.personal_trainer_id) {
      setPersonalTrainer(null);
      return;
    }
    
    const { data } = await supabase
      .from('staff')
      .select('full_name')
      .eq('id', student.personal_trainer_id)
      .single();
    
    setPersonalTrainer(data?.full_name || null);
  };

  if (!student) return null;

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

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 pt-10 pb-4 shrink-0">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-lg shrink-0">
              <AvatarImage src={student.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-semibold">
                {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pr-2">
              <DialogTitle className="text-xl sm:text-2xl font-bold truncate">{student.full_name}</DialogTitle>
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
          
          {/* Action Buttons - Below header info */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
            {canEdit && (
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
                    Editar Perfil
                  </>
                )}
              </Button>
            )}
            {canDelete && onDelete && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>

        <SaveTriggerContext.Provider value={{ registerSave, unregisterSave }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 sm:px-6 border-b shrink-0">
              <TabsList className="flex h-auto gap-0.5 justify-start bg-transparent p-0 overflow-x-auto">
                <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Resumo</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="anamnesis" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Saúde</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Agenda</span>
                </TabsTrigger>
                <TabsTrigger value="training" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <Dumbbell className="h-4 w-4" />
                  <span className="hidden sm:inline">Treino</span>
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <Apple className="h-4 w-4" />
                  <span className="hidden sm:inline">Nutrição</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Planos</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary/10 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3 py-2.5">
                  <StickyNote className="h-4 w-4" />
                  <span className="hidden sm:inline">Notas</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* Editing Mode Banner */}
                {isEditing && (activeTab === "profile" || activeTab === "anamnesis") && (
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
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
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-2xl font-bold">{stats.totalClasses}</p>
                            <p className="text-xs text-muted-foreground truncate">Aulas Inscritas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/20 shrink-0">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-2xl font-bold">{stats.attendedClasses}</p>
                            <p className="text-xs text-muted-foreground truncate">Presenças</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/20 shrink-0">
                            <Clock className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-2xl font-bold">{stats.daysSinceRegistration}</p>
                            <p className="text-xs text-muted-foreground truncate">Dias Membro</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                            <CreditCard className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {stats.activeSubscription || "Sem plano"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">Plano Ativo</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Info Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Personal Info */}
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-primary" />
                          Informações Pessoais
                        </h3>
                        <div className="space-y-2.5">
                          {student.birth_date && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Data Nascimento</span>
                              <span className="font-medium">{format(new Date(student.birth_date), "dd/MM/yyyy")}</span>
                            </div>
                          )}
                          {student.nationality && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Nacionalidade</span>
                              <span className="font-medium">{student.nationality}</span>
                            </div>
                          )}
                          {student.nif && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">NIF</span>
                              <span className="font-medium font-mono">{student.nif}</span>
                            </div>
                          )}
                          {personalTrainer && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Personal Trainer</span>
                              <span className="font-medium text-primary">{personalTrainer}</span>
                            </div>
                          )}
                          {student.created_at && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Membro desde</span>
                              <span className="font-medium">{format(new Date(student.created_at), "dd/MM/yyyy", { locale: pt })}</span>
                            </div>
                          )}
                          {!student.birth_date && !student.nationality && !student.nif && !personalTrainer && !student.created_at && (
                            <p className="text-sm text-muted-foreground text-center py-2">Sem informações registadas</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contact & Address */}
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-primary" />
                          Contacto e Morada
                        </h3>
                        <div className="space-y-2.5">
                          {student.email && (
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-muted-foreground shrink-0">Email</span>
                              <span className="font-medium truncate">{student.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Telefone</span>
                              <span className="font-medium font-mono">{student.phone}</span>
                            </div>
                          )}
                          {student.address && (
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-muted-foreground shrink-0">Morada</span>
                              <span className="font-medium text-right truncate">{student.address}</span>
                            </div>
                          )}
                          {(student.postal_code || student.city) && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Localidade</span>
                              <span className="font-medium">{[student.postal_code, student.city].filter(Boolean).join(" ")}</span>
                            </div>
                          )}
                          {!student.email && !student.phone && !student.address && !student.postal_code && !student.city && (
                            <p className="text-sm text-muted-foreground text-center py-2">Sem informações registadas</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-sm text-amber-600">
                          <Phone className="h-4 w-4" />
                          Contacto de Emergência
                        </h3>
                        {student.emergency_contact || student.emergency_phone ? (
                          <div className="space-y-2.5">
                            {student.emergency_contact && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Nome</span>
                                <span className="font-medium">{student.emergency_contact}</span>
                              </div>
                            )}
                            {student.emergency_phone && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Telefone</span>
                                <span className="font-medium font-mono">{student.emergency_phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">Não definido</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Health Notes Preview */}
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-sm text-red-600">
                          <Heart className="h-4 w-4" />
                          Notas de Saúde
                        </h3>
                        {student.health_notes ? (
                          <p className="text-sm text-muted-foreground line-clamp-3">{student.health_notes}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">Sem notas de saúde registadas</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Last Activity */}
                  {stats.lastAttendance && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Última presença</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(stats.lastAttendance), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="profile" className="mt-0">
                  <StudentProfileTab 
                    student={student} 
                    canEdit={canEdit && isEditing} 
                    onUpdate={onUpdate} 
                  />
                </TabsContent>

                <TabsContent value="anamnesis" className="mt-0">
                  <StudentAnamnesisTab 
                    studentId={student.id} 
                    canEdit={canEdit && isEditing}
                    healthNotes={student.health_notes}
                    onHealthNotesChange={() => onUpdate()}
                  />
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                  <StudentScheduleTab studentId={student.id} />
                </TabsContent>

                <TabsContent value="training" className="mt-0">
                  <StudentTrainingTab 
                    studentId={student.id} 
                    canEdit={canEdit && isEditing} 
                  />
                </TabsContent>

                <TabsContent value="nutrition" className="mt-0">
                  <StudentNutritionTabNew 
                    studentId={student.id} 
                    canEdit={canEdit && isEditing} 
                  />
                </TabsContent>

                <TabsContent value="plans" className="mt-0">
                  <StudentPlansTab 
                    studentId={student.id}
                    personalTrainerId={student.personal_trainer_id || null}
                    companyId={student.company_id}
                    canEdit={canEdit && isEditing}
                    onUpdate={onUpdate}
                  />
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <StudentDocumentsTab 
                    studentId={student.id} 
                    canEdit={canEdit && isEditing} 
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <StudentNotesTab 
                    studentId={student.id} 
                    canEdit={canEdit && isEditing} 
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </SaveTriggerContext.Provider>
      </DialogContent>
    </Dialog>
  );
}
