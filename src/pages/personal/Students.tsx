import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Calendar, User, Dumbbell, Apple, FileText, Heart, Plus, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
  anamnesis?: StudentAnamnesis | null;
  nutrition_plans?: NutritionPlan[];
  training_plans?: TrainingPlan[];
}

interface StudentAnamnesis {
  id: string;
  height_cm: number | null;
  weight_kg: number | null;
  has_heart_condition: boolean | null;
  has_diabetes: boolean | null;
  has_hypertension: boolean | null;
  has_joint_problems: boolean | null;
  has_back_problems: boolean | null;
  has_respiratory_issues: boolean | null;
  has_allergies: boolean | null;
  allergies_description: string | null;
  current_medications: string | null;
  previous_surgeries: string | null;
  injuries_history: string | null;
  fitness_goals: string | null;
  current_activity_level: string | null;
  additional_notes: string | null;
}

interface NutritionPlan {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface TrainingPlan {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export default function PersonalStudents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [editingAnamnesis, setEditingAnamnesis] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState<Partial<StudentAnamnesis>>({});

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

      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!staff) {
        console.error('Staff not found');
        return;
      }

      setStaffId(staff.id);

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
          ),
          student_anamnesis (
            id, height_cm, weight_kg, has_heart_condition, has_diabetes,
            has_hypertension, has_joint_problems, has_back_problems,
            has_respiratory_issues, has_allergies, allergies_description,
            current_medications, previous_surgeries, injuries_history,
            fitness_goals, current_activity_level, additional_notes
          ),
          nutrition_meal_plans (id, title, is_active, created_at),
          training_plans (id, title, is_active, created_at)
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
        } : null,
        anamnesis: student.student_anamnesis as StudentAnamnesis | null,
        nutrition_plans: student.nutrition_meal_plans as NutritionPlan[] || [],
        training_plans: student.training_plans as TrainingPlan[] || []
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
    setAnamnesisForm(student.anamnesis || {});
    setDialogOpen(true);
    setActiveTab("info");
    setEditingAnamnesis(false);
  };

  const saveAnamnesis = async () => {
    if (!selectedStudent) return;

    try {
      if (selectedStudent.anamnesis?.id) {
        const { error } = await supabase
          .from('student_anamnesis')
          .update(anamnesisForm)
          .eq('id', selectedStudent.anamnesis.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_anamnesis')
          .insert({ ...anamnesisForm, student_id: selectedStudent.id });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Anamnese atualizada com sucesso"
      });

      setEditingAnamnesis(false);
      loadStudents();
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível guardar a anamnese",
        variant: "destructive"
      });
    }
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
            </div>
          </div>
        </CardContent>
      </Card>

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
                <div className="flex items-center gap-3 pt-2">
                  <Badge variant="outline" className="text-xs">
                    <Dumbbell className="h-3 w-3 mr-1" />
                    {student.training_plans?.filter(p => p.is_active).length || 0} treinos
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Apple className="h-3 w-3 mr-1" />
                    {student.nutrition_plans?.filter(p => p.is_active).length || 0} nutrição
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Profile Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
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
          
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info" className="text-xs">
                    <User className="h-3.5 w-3.5 mr-1" />
                    Info
                  </TabsTrigger>
                  <TabsTrigger value="anamnesis" className="text-xs">
                    <Heart className="h-3.5 w-3.5 mr-1" />
                    Anamnese
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

                <TabsContent value="anamnesis" className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Avaliação de Saúde</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAnamnesis(!editingAnamnesis)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {editingAnamnesis ? 'Cancelar' : 'Editar'}
                    </Button>
                  </div>

                  {editingAnamnesis ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Altura (cm)</Label>
                          <Input
                            type="number"
                            value={anamnesisForm.height_cm || ''}
                            onChange={(e) => setAnamnesisForm(prev => ({ ...prev, height_cm: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input
                            type="number"
                            value={anamnesisForm.weight_kg || ''}
                            onChange={(e) => setAnamnesisForm(prev => ({ ...prev, weight_kg: Number(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Condições de Saúde</Label>
                        {[
                          { key: 'has_heart_condition', label: 'Condição Cardíaca' },
                          { key: 'has_diabetes', label: 'Diabetes' },
                          { key: 'has_hypertension', label: 'Hipertensão' },
                          { key: 'has_joint_problems', label: 'Problemas Articulares' },
                          { key: 'has_back_problems', label: 'Problemas de Coluna' },
                          { key: 'has_respiratory_issues', label: 'Problemas Respiratórios' },
                          { key: 'has_allergies', label: 'Alergias' },
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between">
                            <span className="text-sm">{item.label}</span>
                            <Switch
                              checked={anamnesisForm[item.key as keyof StudentAnamnesis] as boolean || false}
                              onCheckedChange={(checked) => setAnamnesisForm(prev => ({ ...prev, [item.key]: checked }))}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label>Objetivos de Fitness</Label>
                        <Textarea
                          value={anamnesisForm.fitness_goals || ''}
                          onChange={(e) => setAnamnesisForm(prev => ({ ...prev, fitness_goals: e.target.value }))}
                          placeholder="Ex: Perder peso, ganhar massa muscular..."
                        />
                      </div>

                      <div>
                        <Label>Nível de Atividade Atual</Label>
                        <Input
                          value={anamnesisForm.current_activity_level || ''}
                          onChange={(e) => setAnamnesisForm(prev => ({ ...prev, current_activity_level: e.target.value }))}
                          placeholder="Ex: Sedentário, Moderado, Ativo..."
                        />
                      </div>

                      <div>
                        <Label>Notas Adicionais</Label>
                        <Textarea
                          value={anamnesisForm.additional_notes || ''}
                          onChange={(e) => setAnamnesisForm(prev => ({ ...prev, additional_notes: e.target.value }))}
                        />
                      </div>

                      <Button onClick={saveAnamnesis} className="w-full">
                        Guardar Anamnese
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedStudent?.anamnesis ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Altura</p>
                              <p className="font-medium">{selectedStudent.anamnesis.height_cm || '-'} cm</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Peso</p>
                              <p className="font-medium">{selectedStudent.anamnesis.weight_kg || '-'} kg</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-2">Condições de Saúde</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedStudent.anamnesis.has_heart_condition && <Badge variant="outline">Cardíaco</Badge>}
                              {selectedStudent.anamnesis.has_diabetes && <Badge variant="outline">Diabetes</Badge>}
                              {selectedStudent.anamnesis.has_hypertension && <Badge variant="outline">Hipertensão</Badge>}
                              {selectedStudent.anamnesis.has_joint_problems && <Badge variant="outline">Articulações</Badge>}
                              {selectedStudent.anamnesis.has_back_problems && <Badge variant="outline">Coluna</Badge>}
                              {selectedStudent.anamnesis.has_respiratory_issues && <Badge variant="outline">Respiratório</Badge>}
                              {selectedStudent.anamnesis.has_allergies && <Badge variant="outline">Alergias</Badge>}
                            </div>
                          </div>

                          {selectedStudent.anamnesis.fitness_goals && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Objetivos</p>
                              <p className="text-sm">{selectedStudent.anamnesis.fitness_goals}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Anamnese não preenchida</p>
                          <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditingAnamnesis(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Preencher Anamnese
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="training" className="mt-4">
                  {selectedStudent?.training_plans && selectedStudent.training_plans.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStudent.training_plans.map(plan => (
                        <div key={plan.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{plan.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Criado em {format(new Date(plan.created_at), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhum plano de treino</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => navigate('/personal/training-plans')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Criar Plano de Treino
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="nutrition" className="mt-4">
                  {selectedStudent?.nutrition_plans && selectedStudent.nutrition_plans.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStudent.nutrition_plans.map(plan => (
                        <div key={plan.id} className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{plan.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Criado em {format(new Date(plan.created_at), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Apple className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhum plano nutricional</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => navigate('/personal/nutrition')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Criar Plano Nutricional
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
