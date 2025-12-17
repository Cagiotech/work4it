import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Calendar, UserCheck, Plus, Trash2, Settings, Users, RefreshCw, Eye } from "lucide-react";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  billing_frequency: string | null;
}

interface SubscriptionPayment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  total_installments: number | null;
  paid_installments: number | null;
  installment_amount: number | null;
  auto_renewal: boolean | null;
  next_payment_date: string | null;
  subscription_plans: Plan;
  subscription_payments?: SubscriptionPayment[];
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [trainers, setTrainers] = useState<Staff[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>(personalTrainerId || "__none__");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [totalInstallments, setTotalInstallments] = useState<number>(1);
  const [autoRenewal, setAutoRenewal] = useState<boolean>(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSaveTrainer, setConfirmSaveTrainer] = useState(false);
  const [confirmAddPlan, setConfirmAddPlan] = useState(false);
  const [viewPaymentsId, setViewPaymentsId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [studentId, companyId]);

  const fetchData = async () => {
    try {
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      const { data: subsData } = await supabase
        .from('student_subscriptions')
        .select('*, subscription_plans(*), subscription_payments(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      const { data: trainersData } = await supabase
        .from('staff')
        .select('id, full_name, position')
        .eq('company_id', companyId)
        .eq('is_active', true);

      setPlans((plansData as Plan[]) || []);
      setSubscriptions((subsData as Subscription[]) || []);
      setTrainers(trainersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrainer = async () => {
    setConfirmSaveTrainer(false);
    try {
      const { error } = await supabase
        .from('students')
        .update({ personal_trainer_id: selectedTrainer === "__none__" ? null : selectedTrainer })
        .eq('id', studentId);

      if (error) throw error;
      toast.success("Personal atribuído com sucesso");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir personal");
    }
  };

  const handleAddSubscription = async () => {
    setConfirmAddPlan(false);
    if (!selectedPlan) {
      toast.error("Selecione um plano");
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const endDate = addDays(new Date(startDate), plan.duration_days);
    const installmentAmount = plan.price / totalInstallments;

    try {
      // Create the subscription
      const { data: subData, error: subError } = await supabase
        .from('student_subscriptions')
        .insert({
          student_id: studentId,
          plan_id: selectedPlan,
          start_date: startDate,
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: 'active',
          payment_status: 'pending',
          total_installments: totalInstallments,
          paid_installments: 0,
          installment_amount: installmentAmount,
          auto_renewal: autoRenewal,
          next_payment_date: startDate,
        })
        .select()
        .single();

      if (subError) throw subError;

      // Create installment payments
      if (subData && totalInstallments > 0) {
        const payments = [];
        const daysPerInstallment = Math.floor(plan.duration_days / totalInstallments);
        
        for (let i = 0; i < totalInstallments; i++) {
          const dueDate = addDays(new Date(startDate), i * daysPerInstallment);
          payments.push({
            subscription_id: subData.id,
            installment_number: i + 1,
            amount: installmentAmount,
            due_date: format(dueDate, 'yyyy-MM-dd'),
            status: 'pending',
          });
        }

        const { error: paymentsError } = await supabase
          .from('subscription_payments')
          .insert(payments);

        if (paymentsError) {
          console.error('Error creating payments:', paymentsError);
        }
      }

      toast.success("Plano adicionado com sucesso");
      setIsAddingPlan(false);
      setSelectedPlan("");
      setTotalInstallments(1);
      setAutoRenewal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar plano");
    }
  };

  const handleRemoveSubscription = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await supabase
        .from('student_subscriptions')
        .delete()
        .eq('id', confirmDeleteId);

      if (error) throw error;
      toast.success("Plano removido");
      setConfirmDeleteId(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover plano");
    }
  };

  const handlePaymentStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('subscription_payments')
        .update(updates)
        .eq('id', paymentId);

      if (error) throw error;

      // Update subscription paid_installments count
      const subscription = subscriptions.find(s => 
        s.subscription_payments?.some(p => p.id === paymentId)
      );
      
      if (subscription) {
        const paidCount = (subscription.subscription_payments?.filter(p => 
          p.id === paymentId ? newStatus === 'paid' : p.status === 'paid'
        ).length || 0);

        await supabase
          .from('student_subscriptions')
          .update({ 
            paid_installments: paidCount,
            payment_status: paidCount >= (subscription.total_installments || 1) ? 'paid' : 'pending'
          })
          .eq('id', subscription.id);
      }

      toast.success("Pagamento atualizado");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar pagamento");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-600 border-green-500/20",
      expired: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
      suspended: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      expired: "Expirado",
      cancelled: "Cancelado",
      suspended: "Suspenso",
    };
    return <Badge variant="outline" className={styles[status]}>{labels[status] || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      paid: "bg-green-500/10 text-green-600 border-green-500/20",
      overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      paid: "Pago",
      overdue: "Em Atraso",
    };
    return <Badge variant="outline" className={styles[status]}>{labels[status] || status}</Badge>;
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const calculatedInstallmentAmount = selectedPlanData 
    ? (selectedPlanData.price / totalInstallments).toFixed(2) 
    : "0.00";

  const viewingSubscription = subscriptions.find(s => s.id === viewPaymentsId);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
    <>
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
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.full_name} {trainer.position && `(${trainer.position})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {canEdit && (
                <Button onClick={() => setConfirmSaveTrainer(true)}>
                  Guardar
                </Button>
              )}
            </div>
            {trainers.length === 0 && (
              <div className="text-center py-4">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhum colaborador cadastrado.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/company/hr')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ir para Recursos Humanos
                </Button>
              </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Parcelas</Label>
                    <Select 
                      value={totalInstallments.toString()} 
                      onValueChange={(v) => setTotalInstallments(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n === 1 ? "À vista" : `${n}x`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPlanData && totalInstallments > 1 && (
                      <p className="text-xs text-muted-foreground">
                        {totalInstallments}x de €{calculatedInstallmentAmount}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Renovação Automática</Label>
                    <div className="flex items-center gap-3 pt-2">
                      <Switch
                        checked={autoRenewal}
                        onCheckedChange={setAutoRenewal}
                      />
                      <span className="text-sm text-muted-foreground">
                        {autoRenewal ? "Ativada" : "Desativada"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddingPlan(false);
                    setSelectedPlan("");
                    setTotalInstallments(1);
                    setAutoRenewal(false);
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setConfirmAddPlan(true)} disabled={!selectedPlan}>
                    Adicionar Plano
                  </Button>
                </div>
              </div>
            )}

            {plans.length === 0 && !isAddingPlan && (
              <div className="text-center py-6">
                <Settings className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhum plano de assinatura criado.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/company/settings')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Planos em Configurações
                </Button>
              </div>
            )}

            {subscriptions.length === 0 && !isAddingPlan && plans.length > 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum plano atribuído a este aluno.
              </p>
            )}

            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{sub.subscription_plans?.name}</span>
                      {getStatusBadge(sub.status)}
                      {getPaymentBadge(sub.payment_status)}
                      {sub.auto_renewal && (
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sub.start_date), "dd MMM yyyy", { locale: pt })} - {format(new Date(sub.end_date), "dd MMM yyyy", { locale: pt })}
                      </span>
                      <span>€{sub.subscription_plans?.price}</span>
                      {sub.total_installments && sub.total_installments > 1 && (
                        <span className="text-primary font-medium">
                          {sub.paid_installments || 0}/{sub.total_installments} parcelas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.total_installments && sub.total_installments > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewPaymentsId(sub.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Parcelas
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* View Payments Dialog */}
      <Dialog open={!!viewPaymentsId} onOpenChange={(open) => !open && setViewPaymentsId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parcelas - {viewingSubscription?.subscription_plans?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {viewingSubscription?.subscription_payments
              ?.sort((a, b) => a.installment_number - b.installment_number)
              .map((payment) => {
                const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
                return (
                  <div 
                    key={payment.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30'
                    }`}
                  >
                    <div>
                      <p className="font-medium">
                        Parcela {payment.installment_number}/{viewingSubscription.total_installments}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {format(new Date(payment.due_date), "dd/MM/yyyy")}
                      </p>
                      {payment.paid_at && (
                        <p className="text-xs text-success">
                          Pago em: {format(new Date(payment.paid_at), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">€{payment.amount.toFixed(2)}</span>
                      {canEdit ? (
                        <Select
                          value={payment.status}
                          onValueChange={(v) => handlePaymentStatusChange(payment.id, v)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="overdue">Em Atraso</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getPaymentBadge(isOverdue ? 'overdue' : payment.status)
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Save Trainer */}
      <AlertDialog open={confirmSaveTrainer} onOpenChange={setConfirmSaveTrainer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja atribuir este personal trainer ao aluno?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssignTrainer}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Add Plan */}
      <AlertDialog open={confirmAddPlan} onOpenChange={setConfirmAddPlan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Adição</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPlanData && (
                <div className="space-y-2 text-left mt-2">
                  <p><strong>Plano:</strong> {selectedPlanData.name}</p>
                  <p><strong>Valor Total:</strong> €{selectedPlanData.price}</p>
                  <p><strong>Parcelas:</strong> {totalInstallments === 1 ? "À vista" : `${totalInstallments}x de €${calculatedInstallmentAmount}`}</p>
                  <p><strong>Renovação Automática:</strong> {autoRenewal ? "Sim" : "Não"}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddSubscription}>Adicionar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Plan */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este plano do aluno? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveSubscription}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
