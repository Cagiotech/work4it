import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Dumbbell, Clock, Target, MoreVertical, Edit, Trash, Loader2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Student {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
}

// Note: Training plans would need a dedicated table. For now, using nutrition_plans structure
// In production, create a training_plans table similar to nutrition_meal_plans

export default function PersonalTrainingPlans() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    student_id: "",
    duration: "8 semanas",
    frequency: "4x por semana",
    goal: "",
  });

  // Get staff info
  const { data: staffInfo } = useQuery({
    queryKey: ['personal-staff-info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('staff')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get assigned students
  const { data: students = [] } = useQuery({
    queryKey: ['personal-students-for-training', staffInfo?.id],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url')
        .eq('personal_trainer_id', staffInfo.id)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!staffInfo?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Get student nutrition plans as training plans proxy
  // In production, replace with actual training_plans table
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['personal-training-plans', staffInfo?.id],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      const { data: assignedStudents } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url')
        .eq('personal_trainer_id', staffInfo.id);

      if (!assignedStudents?.length) return [];

      // Return mock training plans based on students
      // In production, fetch from training_plans table
      return assignedStudents.map((student, index) => ({
        id: `training-${student.id}`,
        title: `Plano de Treino - ${student.full_name}`,
        description: 'Plano personalizado de treino',
        is_active: true,
        created_at: new Date().toISOString(),
        student_id: student.id,
        student: student,
        duration: '8 semanas',
        frequency: '4x por semana',
        goal: 'Hipertrofia',
      }));
    },
    enabled: !!staffInfo?.id,
    staleTime: 1 * 60 * 1000,
  });

  const filteredPlans = plans.filter((plan) =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePlans = filteredPlans.filter(p => p.is_active);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-32 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planos de Treino</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Criar e gerir planos de treino para os seus alunos
          </p>
        </div>
        <Button className="w-full md:w-auto" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar planos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activePlans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum plano de treino encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie planos de treino para os seus alunos atribuídos
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activePlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{plan.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(plan.created_at), "dd MMM yyyy", { locale: pt })}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {plan.student?.profile_photo_url && (
                        <AvatarImage src={plan.student.profile_photo_url} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(plan.student?.full_name || '?')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{plan.student?.full_name}</span>
                    <Badge variant="default" className="ml-auto text-xs">
                      Ativo
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.frequency}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-muted/50 text-sm">
                    <span className="text-muted-foreground">Objetivo: </span>
                    <span>{plan.goal}</span>
                  </div>

                  <Button variant="outline" className="w-full">
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Plano de Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aluno *</Label>
              <Select
                value={formData.student_id}
                onValueChange={(v) => setFormData({ ...formData, student_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar aluno" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Plano de Hipertrofia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(v) => setFormData({ ...formData, duration: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4 semanas">4 semanas</SelectItem>
                    <SelectItem value="6 semanas">6 semanas</SelectItem>
                    <SelectItem value="8 semanas">8 semanas</SelectItem>
                    <SelectItem value="12 semanas">12 semanas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x por semana">2x/semana</SelectItem>
                    <SelectItem value="3x por semana">3x/semana</SelectItem>
                    <SelectItem value="4x por semana">4x/semana</SelectItem>
                    <SelectItem value="5x por semana">5x/semana</SelectItem>
                    <SelectItem value="6x por semana">6x/semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Input
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="Ex: Ganho de massa muscular"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do plano..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button
              disabled={!formData.student_id || !formData.title}
              onClick={() => {
                toast.success("Plano de treino criado!");
                setIsCreating(false);
                setFormData({
                  title: "",
                  description: "",
                  student_id: "",
                  duration: "8 semanas",
                  frequency: "4x por semana",
                  goal: "",
                });
              }}
            >
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
