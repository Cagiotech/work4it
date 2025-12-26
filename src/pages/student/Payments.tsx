import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Loader2, Calendar, RefreshCw, Clock, AlertTriangle, Upload, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionPayment {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  payment_method: string | null;
}

interface Subscription {
  id: string;
  status: string | null;
  start_date: string;
  end_date: string;
  payment_status: string | null;
  total_installments: number | null;
  paid_installments: number | null;
  installment_amount: number | null;
  auto_renewal: boolean | null;
  next_payment_date: string | null;
  subscription_plans: {
    name: string;
    price: number;
    description: string | null;
    duration_days: number;
    billing_frequency: string | null;
  };
  subscription_payments?: SubscriptionPayment[];
}

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [companyMbway, setCompanyMbway] = useState<string | null>(null);
  
  // Payment proof dialog
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPayment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [existingProofs, setExistingProofs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id, company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        setStudentId(studentData.id);
        
        // Fetch company MBWay
        const { data: companyData } = await supabase
          .from('companies')
          .select('mbway_phone')
          .eq('id', studentData.company_id)
          .single();
        
        if (companyData) {
          setCompanyMbway(companyData.mbway_phone);
        }

        // Fetch subscriptions
        const { data: subsData } = await supabase
          .from('student_subscriptions')
          .select(`
            *,
            subscription_plans(name, price, description, duration_days, billing_frequency),
            subscription_payments(*)
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false });

        if (subsData) {
          setSubscriptions(subsData as Subscription[]);
          const active = subsData.find(s => s.status === 'active');
          if (active) {
            setActiveSubscription(active as Subscription);
          }
        }

        // Fetch existing payment proofs to check which payments have pending proofs
        const { data: proofsData } = await supabase
          .from('payment_proofs')
          .select('subscription_id, status')
          .eq('student_id', studentData.id)
          .eq('status', 'pending');

        if (proofsData) {
          const proofsMap: Record<string, string> = {};
          proofsData.forEach(proof => {
            if (proof.subscription_id) {
              proofsMap[proof.subscription_id] = proof.status;
            }
          });
          setExistingProofs(proofsMap);
        }
      }

      setLoading(false);
    };

    fetchPayments();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Ativo</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Expirado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pendente'}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="border-success text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Em Atraso</Badge>;
      default:
        return <Badge variant="outline">{status || '-'}</Badge>;
    }
  };

  const getBillingLabel = (frequency: string | null) => {
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
    };
    return labels[frequency || ''] || frequency || 'Único';
  };

  const handleOpenProofDialog = (payment: SubscriptionPayment) => {
    setSelectedPayment(payment);
    setAmount(payment.amount.toFixed(2));
    setNotes("");
    setSelectedFile(null);
    setProofDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O ficheiro não pode exceder 5MB");
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        toast.error("Formato inválido. Use JPG, PNG ou PDF");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedFile || !studentId || !activeSubscription) {
      toast.error("Selecione um ficheiro");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${studentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('payment_proofs')
        .insert({
          student_id: studentId,
          subscription_id: activeSubscription.id,
          amount: parseFloat(amount) || selectedPayment?.amount || 0,
          proof_file_name: selectedFile.name,
          proof_file_path: fileName,
          proof_file_type: selectedFile.type,
          notes: notes || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success("Comprovante enviado com sucesso!");
      setProofDialogOpen(false);
      setSelectedFile(null);
      setExistingProofs(prev => ({
        ...prev,
        [activeSubscription.id]: 'pending'
      }));
    } catch (error: any) {
      console.error('Error uploading proof:', error);
      toast.error("Erro ao enviar comprovante");
    } finally {
      setIsUploading(false);
    }
  };

  // Get overdue payments
  const overduePayments = activeSubscription?.subscription_payments?.filter(payment => {
    return payment.status === 'pending' && new Date(payment.due_date) < new Date();
  }) || [];

  const pendingPayments = activeSubscription?.subscription_payments?.filter(payment => {
    return payment.status === 'pending' && new Date(payment.due_date) >= new Date();
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalInstallments = activeSubscription?.total_installments || 1;
  const paidInstallments = activeSubscription?.paid_installments || 0;
  const progressPercent = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overdue Alert */}
      {overduePayments.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Pagamentos em Atraso</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Você tem {overduePayments.length} pagamento(s) em atraso. 
                  Total: €{overduePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
                {!existingProofs[activeSubscription?.id || ''] && (
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={() => overduePayments[0] && handleOpenProofDialog(overduePayments[0])}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Comprovante
                  </Button>
                )}
                {existingProofs[activeSubscription?.id || ''] === 'pending' && (
                  <Badge variant="outline" className="mt-3 border-yellow-500 text-yellow-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Comprovante em análise
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MBWay Info Card */}
      {companyMbway && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagamento por MBWay</p>
                <p className="font-semibold text-lg">{companyMbway}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan Card */}
      {activeSubscription ? (
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                      {activeSubscription.subscription_plans?.name || 'Plano Ativo'}
                    </h2>
                    {getStatusBadge(activeSubscription.status)}
                    {activeSubscription.auto_renewal && (
                      <Badge variant="outline" className="border-primary text-primary">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Renovação Auto.
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    {getBillingLabel(activeSubscription.subscription_plans?.billing_frequency)} • 
                    Válido até: {formatDate(activeSubscription.end_date)}
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  €{activeSubscription.subscription_plans?.price || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeSubscription.subscription_plans?.duration_days || 30} dias
                </p>
              </div>
            </div>
            
            {/* Installments Progress */}
            {totalInstallments > 1 && (
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Parcelas Pagas</span>
                  <span className="text-sm font-bold text-primary">
                    {paidInstallments} de {totalInstallments}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {activeSubscription.installment_amount && activeSubscription.installment_amount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Valor por parcela: €{activeSubscription.installment_amount.toFixed(2)}
                  </p>
                )}
                {activeSubscription.next_payment_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Próximo vencimento: {formatDate(activeSubscription.next_payment_date)}
                  </p>
                )}
              </div>
            )}
            
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Início: {formatDate(activeSubscription.start_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Dias restantes: 
                  </span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {getDaysRemaining(activeSubscription.end_date)} dias
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sem Plano Ativo</h2>
            <p className="text-muted-foreground">
              Não tem nenhum plano de subscrição ativo. 
              Contacte a receção para ativar um plano.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Installment Payments for Active Subscription */}
      {activeSubscription && activeSubscription.subscription_payments && activeSubscription.subscription_payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Parcelas do Plano Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSubscription.subscription_payments
                .sort((a, b) => a.installment_number - b.installment_number)
                .map((payment) => {
                  const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
                  return (
                    <div 
                      key={payment.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 ${
                        isOverdue ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          payment.status === 'paid' 
                            ? 'bg-success/10' 
                            : isOverdue 
                              ? 'bg-destructive/10' 
                              : 'bg-primary/10'
                        }`}>
                          {payment.status === 'paid' ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : isOverdue ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Clock className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            Parcela {payment.installment_number} de {totalInstallments}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {formatDate(payment.due_date)}
                            {payment.paid_at && ` • Pago em: ${formatDate(payment.paid_at)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="font-semibold">€{payment.amount.toFixed(2)}</span>
                        {getPaymentStatusBadge(isOverdue ? 'overdue' : payment.status)}
                        {(isOverdue || payment.status === 'pending') && payment.status !== 'paid' && !existingProofs[activeSubscription.id] && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenProofDialog(payment)}>
                            <Upload className="h-4 w-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Histórico de Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div 
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-xl border border-border gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">
                          {sub.subscription_plans?.name || 'Plano'}
                        </p>
                        {sub.auto_renewal && (
                          <RefreshCw className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                        {sub.total_installments && sub.total_installments > 1 && (
                          <span> • {sub.paid_installments || 0}/{sub.total_installments} parcelas</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-semibold text-foreground">
                      €{sub.subscription_plans?.price || 0}
                    </span>
                    {getStatusBadge(sub.status)}
                    {getPaymentStatusBadge(sub.payment_status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {subscriptions.length === 0 && !activeSubscription && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum histórico de pagamentos encontrado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Proof Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Envie o comprovante do seu pagamento para validação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {companyMbway && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Número MBWay</p>
                    <p className="font-semibold text-lg">{companyMbway}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Comprovante (JPG, PNG ou PDF - máx 5MB)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Ficheiro: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setProofDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitProof}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
