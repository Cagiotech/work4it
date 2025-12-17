import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CreditCard, Calendar, AlertTriangle, Percent, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  billing_frequency: string;
  penalty_percentage: number;
  block_after_days: number | null;
  grace_period_days: number;
  is_active: boolean;
}

const BILLING_FREQUENCIES = [
  { value: "daily", label: "Diário", days: 1 },
  { value: "weekly", label: "Semanal", days: 7 },
  { value: "biweekly", label: "Quinzenal", days: 15 },
  { value: "monthly", label: "Mensal", days: 30 },
  { value: "quarterly", label: "Trimestral", days: 90 },
  { value: "semiannual", label: "Semestral", days: 180 },
  { value: "annual", label: "Anual", days: 365 },
];

export function PlansSettingsSection() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_frequency: "monthly",
    penalty_percentage: "0",
    block_after_days: "",
    grace_period_days: "3",
    enable_blocking: false,
  });

  const fetchPlans = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [profile?.company_id]);

  useEffect(() => {
    if (selectedPlan) {
      setFormData({
        name: selectedPlan.name,
        description: selectedPlan.description || "",
        price: String(selectedPlan.price),
        billing_frequency: selectedPlan.billing_frequency || "monthly",
        penalty_percentage: String(selectedPlan.penalty_percentage || 0),
        block_after_days: selectedPlan.block_after_days ? String(selectedPlan.block_after_days) : "",
        grace_period_days: String(selectedPlan.grace_period_days || 3),
        enable_blocking: selectedPlan.block_after_days !== null,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        billing_frequency: "monthly",
        penalty_percentage: "0",
        block_after_days: "",
        grace_period_days: "3",
        enable_blocking: false,
      });
    }
  }, [selectedPlan, showDialog]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    const frequency = BILLING_FREQUENCIES.find(f => f.value === formData.billing_frequency);
    
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        duration_days: frequency?.days || 30,
        billing_frequency: formData.billing_frequency,
        penalty_percentage: parseFloat(formData.penalty_percentage) || 0,
        block_after_days: formData.enable_blocking && formData.block_after_days 
          ? parseInt(formData.block_after_days) 
          : null,
        grace_period_days: parseInt(formData.grace_period_days) || 3,
      };

      if (selectedPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(payload)
          .eq('id', selectedPlan.id);
        if (error) throw error;
        toast.success('Plano atualizado');
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert({ ...payload, company_id: profile.company_id });
        if (error) throw error;
        toast.success('Plano criado');
      }

      fetchPlans();
      setShowDialog(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Erro ao guardar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', deleteConfirm);
      if (error) throw error;
      toast.success('Plano eliminado');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao eliminar plano');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getBillingLabel = (frequency: string) => {
    return BILLING_FREQUENCIES.find(f => f.value === frequency)?.label || frequency;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure os planos de subscrição disponíveis para os alunos.
        </p>
        <Button onClick={() => { setSelectedPlan(null); setShowDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum plano criado</p>
            <Button variant="link" onClick={() => setShowDialog(true)} className="mt-2">
              Criar primeiro plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <CardContent className="p-4 pt-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">€{Number(plan.price).toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {getBillingLabel(plan.billing_frequency)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Período de carência: {plan.grace_period_days} dias</span>
                  </div>
                  {plan.penalty_percentage > 0 && (
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      <span>Multa por atraso: {plan.penalty_percentage}%</span>
                    </div>
                  )}
                  {plan.block_after_days !== null && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Bloqueia app após {plan.block_after_days} dias</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => { setSelectedPlan(plan); setShowDialog(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive" 
                    onClick={() => setDeleteConfirm(plan.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setSelectedPlan(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano Mensal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do plano..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Valor (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Frequência de Cobrança</Label>
                <Select 
                  value={formData.billing_frequency} 
                  onValueChange={(val) => setFormData({ ...formData, billing_frequency: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grace_period">Período de Carência (dias)</Label>
                <Input
                  id="grace_period"
                  type="number"
                  value={formData.grace_period_days}
                  onChange={(e) => setFormData({ ...formData, grace_period_days: e.target.value })}
                  placeholder="3"
                />
                <p className="text-xs text-muted-foreground">Dias após vencimento antes de cobrar multa</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalty">Multa por Atraso (%)</Label>
                <Input
                  id="penalty"
                  type="number"
                  step="0.1"
                  value={formData.penalty_percentage}
                  onChange={(e) => setFormData({ ...formData, penalty_percentage: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Percentual sobre o valor do plano</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Bloqueio por Falta de Pagamento</Label>
                  <p className="text-sm text-muted-foreground">Bloquear acesso do aluno ao app</p>
                </div>
                <Switch
                  checked={formData.enable_blocking}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_blocking: checked })}
                />
              </div>

              {formData.enable_blocking && (
                <div className="space-y-2">
                  <Label htmlFor="block_days">Bloquear após quantos dias?</Label>
                  <Input
                    id="block_days"
                    type="number"
                    value={formData.block_after_days}
                    onChange={(e) => setFormData({ ...formData, block_after_days: e.target.value })}
                    placeholder="7"
                  />
                  <p className="text-xs text-muted-foreground">
                    O aluno será bloqueado após este número de dias sem pagamento
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formData.name || !formData.price}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
