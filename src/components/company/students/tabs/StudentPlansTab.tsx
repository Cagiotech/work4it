import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Calendar, UserCheck, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  subscription_plans: Plan;
}

interface Staff {
  id: string;
  full_name: string;
  position: string | null;
}

interface StudentPlansTabProps {
  studentId: string;
  personalTrainerId: string | null;
  companyId: string;
  canEdit: boolean;
  onUpdate: () => void;
}

export function StudentPlansTab({ studentId, personalTrainerId, companyId, canEdit, onUpdate }: StudentPlansTabProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>(personalTrainerId || "");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  useEffect(() => {
    fetchData();
  }, [studentId, companyId]);

  const fetchData = async () => {
    try {
      // Fetch available plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Fetch student subscriptions
      const { data: subsData } = await supabase
        .from('student_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      // Fetch trainers (staff that can be personal trainers)
      const { data: trainersData } = await supabase
        .from('staff')
        .select('id, full_name, position')
        .eq('company_id', companyId)
        .eq('is_active', true);

      setPlans(plansData || []);
      setSubscriptions((subsData as any) || []);
      setTrainers(trainersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrainer = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ personal_trainer_id: selectedTrainer || null })
        .eq('id', studentId);

      if (error) throw error;
      toast.success("Personal atribuído com sucesso");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir personal");
    }
  };

  const handleAddSubscription = async () => {
    if (!selectedPlan) {
      toast.error("Selecione um plano");
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days);

    try {
      const { error } = await supabase
        .from('student_subscriptions')
        .insert({
          student_id: studentId,
          plan_id: selectedPlan,
          start_date: startDate,
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: 'active',
          payment_status: 'pending'
        });

      if (error) throw error;
      toast.success("Plano adicionado com sucesso");
      setIsAddingPlan(false);
      setSelectedPlan("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar plano");
    }
  };

  const handleRemoveSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('student_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success("Plano removido");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover plano");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/10 text-green-600 border-green-500/20",
      expired: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
      suspended: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    };
    const labels = {
      active: "Ativo",
      expired: "Expirado",
      cancelled: "Cancelado",
      suspended: "Suspenso",
    };
    return <Badge variant="outline" className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      paid: "bg-green-500/10 text-green-600 border-green-500/20",
      overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    const labels = {
      pending: "Pendente",
      paid: "Pago",
      overdue: "Em Atraso",
    };
    return <Badge variant="outline" className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Personal Trainer Assignment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            Personal Trainer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Personal Atribuído</Label>
              <Select
                value={selectedTrainer}
                onValueChange={setSelectedTrainer}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar personal trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.full_name} {trainer.position && `(${trainer.position})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canEdit && (
              <Button onClick={handleAssignTrainer}>
                Guardar
              </Button>
            )}
          </div>
          {trainers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum colaborador cadastrado. Adicione colaboradores em Recursos Humanos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Planos de Assinatura
            </span>
            {canEdit && (
              <Button size="sm" onClick={() => setIsAddingPlan(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingPlan && (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - €{plan.price} ({plan.duration_days} dias)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingPlan(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSubscription}>
                  Adicionar Plano
                </Button>
              </div>
            </div>
          )}

          {plans.length === 0 && !isAddingPlan && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum plano disponível. Crie planos em Configurações → Planos.
            </p>
          )}

          {subscriptions.length === 0 && !isAddingPlan && plans.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum plano atribuído a este aluno.
            </p>
          )}

          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sub.subscription_plans?.name}</span>
                  {getStatusBadge(sub.status)}
                  {getPaymentBadge(sub.payment_status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(sub.start_date), "dd MMM yyyy", { locale: pt })} - {format(new Date(sub.end_date), "dd MMM yyyy", { locale: pt })}
                  </span>
                  <span>€{sub.subscription_plans?.price}</span>
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemoveSubscription(sub.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
