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
import { Search, Plus, Apple, Clock, MoreVertical, Copy, Edit, Trash, Utensils, Loader2, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  student_id: string;
  student: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

interface Student {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
}

export default function PersonalNutrition() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<NutritionPlan | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    student_id: "",
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
    queryKey: ['personal-students-for-nutrition', staffInfo?.id],
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

  // Get nutrition plans for assigned students
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['personal-nutrition-plans', staffInfo?.id],
    queryFn: async () => {
      if (!staffInfo?.id) return [];

      // Get student IDs first
      const { data: assignedStudents } = await supabase
        .from('students')
        .select('id')
        .eq('personal_trainer_id', staffInfo.id);

      if (!assignedStudents?.length) return [];

      const studentIds = assignedStudents.map(s => s.id);

      const { data, error } = await supabase
        .from('nutrition_meal_plans')
        .select(`
          id,
          title,
          description,
          is_active,
          created_at,
          student_id,
          students (
            id,
            full_name,
            profile_photo_url
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(plan => ({
        ...plan,
        student: plan.students
      })) as NutritionPlan[];
    },
    enabled: !!staffInfo?.id,
    staleTime: 1 * 60 * 1000,
  });

  // Create plan mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newPlan, error } = await supabase
        .from('nutrition_meal_plans')
        .insert({
          student_id: data.student_id,
          title: data.title,
          description: data.description || null,
          is_active: true,
          created_by: staffInfo?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create 7 days for the plan
      const daysToInsert = [0, 1, 2, 3, 4, 5, 6].map(day => ({
        plan_id: newPlan.id,
        day_of_week: day,
        calories_target: 2000,
        protein_target: 150,
        carbs_target: 200,
        fat_target: 70,
      }));

      await supabase.from('nutrition_plan_days').insert(daysToInsert);

      return newPlan;
    },
    onSuccess: () => {
      toast.success("Plano nutricional criado!");
      queryClient.invalidateQueries({ queryKey: ['personal-nutrition-plans'] });
      setIsCreating(false);
      setFormData({ title: "", description: "", student_id: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar plano");
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('nutrition_meal_plans')
        .delete()
        .eq('id', planId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano removido!");
      queryClient.invalidateQueries({ queryKey: ['personal-nutrition-plans'] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover plano");
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('nutrition_meal_plans')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-nutrition-plans'] });
      toast.success("Estado atualizado!");
    },
  });

  const filteredPlans = plans.filter((plan) =>
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePlans = filteredPlans.filter(p => p.is_active);
  const inactivePlans = filteredPlans.filter(p => !p.is_active);

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
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planos Nutricionais</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Criar e gerir planos de alimentação para os seus alunos
          </p>
        </div>
        <Button className="w-full md:w-auto" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="active" className="flex-1 md:flex-none">
            Ativos ({activePlans.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex-1 md:flex-none">
            Inativos ({inactivePlans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
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
                <Apple className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum plano ativo encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onView={() => setViewingPlan(plan)}
                  onToggle={() => toggleMutation.mutate({ id: plan.id, is_active: plan.is_active })}
                  onDelete={() => setDeleteId(plan.id)}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactivePlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Apple className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum plano inativo</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {inactivePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onView={() => setViewingPlan(plan)}
                  onToggle={() => toggleMutation.mutate({ id: plan.id, is_active: plan.is_active })}
                  onDelete={() => setDeleteId(plan.id)}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Plano Nutricional</DialogTitle>
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
                placeholder="Ex: Plano de Emagrecimento"
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
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.student_id || !formData.title || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar este plano nutricional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanCard({
  plan,
  onView,
  onToggle,
  onDelete,
  getInitials,
}: {
  plan: NutritionPlan;
  onView: () => void;
  onToggle: () => void;
  onDelete: () => void;
  getInitials: (name: string) => string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Apple className="h-5 w-5 text-green-600" />
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
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                <Edit className="h-4 w-4 mr-2" />
                {plan.is_active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
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
              {getInitials(plan.student?.full_name || "?")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{plan.student?.full_name}</span>
          <Badge
            variant={plan.is_active ? "default" : "secondary"}
            className="ml-auto text-xs"
          >
            {plan.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {plan.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
        )}

        <Button variant="outline" className="w-full" onClick={onView}>
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
