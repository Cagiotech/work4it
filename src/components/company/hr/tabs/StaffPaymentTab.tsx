import { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StaffSaveTriggerContext } from "../StaffProfileDialog";

interface PaymentConfig {
  id: string;
  staff_id: string;
  payment_type: string;
  base_salary: number | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  per_class_rate: number | null;
  commission_percentage: number | null;
  bank_name: string | null;
  bank_iban: string | null;
  nif: string | null;
  niss: string | null;
}

interface StaffPaymentTabProps {
  staffId: string;
  canEdit: boolean;
}

interface FormData {
  payment_type: string;
  base_salary: number;
  hourly_rate: number;
  daily_rate: number;
  per_class_rate: number;
  commission_percentage: number;
  bank_name: string;
  bank_iban: string;
  nif: string;
  niss: string;
}

const defaultFormData: FormData = {
  payment_type: "monthly",
  base_salary: 0,
  hourly_rate: 0,
  daily_rate: 0,
  per_class_rate: 0,
  commission_percentage: 0,
  bank_name: "",
  bank_iban: "",
  nif: "",
  niss: "",
};

export function StaffPaymentTab({ staffId, canEdit }: StaffPaymentTabProps) {
  const { registerSave, unregisterSave } = useContext(StaffSaveTriggerContext);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    fetchPaymentConfig();
  }, [staffId]);

  const fetchPaymentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_payment_config')
        .select('*')
        .eq('staff_id', staffId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          payment_type: data.payment_type || "monthly",
          base_salary: data.base_salary || 0,
          hourly_rate: data.hourly_rate || 0,
          daily_rate: data.daily_rate || 0,
          per_class_rate: data.per_class_rate || 0,
          commission_percentage: data.commission_percentage || 0,
          bank_name: data.bank_name || "",
          bank_iban: data.bank_iban || "",
          nif: data.nif || "",
          niss: data.niss || "",
        });
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleSave = async () => {
      if (!canEdit) return;
      setConfirmSaveOpen(true);
    };

    registerSave("payment", handleSave);
    return () => unregisterSave("payment");
  }, [canEdit, formData, registerSave, unregisterSave]);

  const performSave = async () => {
    setSaving(true);
    setConfirmSaveOpen(false);

    try {
      const paymentData = {
        staff_id: staffId,
        payment_type: formData.payment_type,
        base_salary: formData.base_salary || 0,
        hourly_rate: formData.hourly_rate || 0,
        daily_rate: formData.daily_rate || 0,
        per_class_rate: formData.per_class_rate || 0,
        commission_percentage: formData.commission_percentage || 0,
        bank_name: formData.bank_name || null,
        bank_iban: formData.bank_iban || null,
        nif: formData.nif || null,
        niss: formData.niss || null,
      };

      const { error } = await supabase
        .from('staff_payment_config')
        .upsert(paymentData, { onConflict: 'staff_id' });

      if (error) throw error;
      toast.success('Configuração de pagamento atualizada!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fiscal Documents */}
      <div>
        <h4 className="font-medium mb-3">Dados Fiscais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>NIF</Label>
            <Input
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              placeholder="123456789"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>NISS</Label>
            <Input
              value={formData.niss}
              onChange={(e) => setFormData({ ...formData, niss: e.target.value })}
              placeholder="12345678901"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Payment Type */}
      <div>
        <h4 className="font-medium mb-3">Tipo de Pagamento</h4>
        <Select
          value={formData.payment_type}
          onValueChange={(v) => setFormData({ ...formData, payment_type: v })}
          disabled={!canEdit}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Salário Mensal</SelectItem>
            <SelectItem value="hourly">Por Hora</SelectItem>
            <SelectItem value="daily">Diário</SelectItem>
            <SelectItem value="per_class">Por Aula</SelectItem>
            <SelectItem value="commission">Comissão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Values */}
      <div>
        <h4 className="font-medium mb-3">Valores</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.payment_type === "monthly" && (
            <div className="space-y-2">
              <Label>Salário Base (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={!canEdit}
              />
            </div>
          )}
          {formData.payment_type === "hourly" && (
            <div className="space-y-2">
              <Label>Valor por Hora (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={!canEdit}
              />
            </div>
          )}
          {formData.payment_type === "daily" && (
            <div className="space-y-2">
              <Label>Valor Diário (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={!canEdit}
              />
            </div>
          )}
          {formData.payment_type === "per_class" && (
            <div className="space-y-2">
              <Label>Valor por Aula (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.per_class_rate}
                onChange={(e) => setFormData({ ...formData, per_class_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                disabled={!canEdit}
              />
            </div>
          )}
          {formData.payment_type === "commission" && (
            <div className="space-y-2">
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.commission_percentage}
                onChange={(e) => setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                disabled={!canEdit}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <div>
        <h4 className="font-medium mb-3">Dados Bancários</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Banco</Label>
            <Input
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Nome do banco"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>IBAN</Label>
            <Input
              value={formData.bank_iban}
              onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
              placeholder="PT50 0000 0000 00000000000 00"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Confirm Save Dialog */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guardar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja guardar as alterações na configuração de pagamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performSave}>Guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
