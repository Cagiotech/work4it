import { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { StaffSaveTriggerContext } from "../StaffProfileDialog";

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  role_id: string | null;
  hire_date: string | null;
  is_active: boolean;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  citizen_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  user_id: string | null;
  company_id: string;
}

interface StaffProfileTabProps {
  staff: Staff | null;
  roles: Role[];
  canEdit: boolean;
  isNewStaff: boolean;
  onSaved: () => void;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  role_id: string;
  hire_date: string;
  is_active: boolean;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  citizen_card: string;
  emergency_contact: string;
  emergency_phone: string;
  createAccount: boolean;
}

const defaultFormData: FormData = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  role_id: "",
  hire_date: new Date().toISOString().split('T')[0],
  is_active: true,
  address: "",
  postal_code: "",
  city: "",
  country: "Portugal",
  citizen_card: "",
  emergency_contact: "",
  emergency_phone: "",
  createAccount: true,
};

export function StaffProfileTab({ staff, roles, canEdit, isNewStaff, onSaved }: StaffProfileTabProps) {
  const { company } = useAuth();
  const { registerSave, unregisterSave } = useContext(StaffSaveTriggerContext);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        position: staff.position || "",
        role_id: staff.role_id || "",
        hire_date: staff.hire_date || "",
        is_active: staff.is_active !== false,
        address: staff.address || "",
        postal_code: staff.postal_code || "",
        city: staff.city || "",
        country: staff.country || "Portugal",
        citizen_card: staff.citizen_card || "",
        emergency_contact: staff.emergency_contact || "",
        emergency_phone: staff.emergency_phone || "",
        createAccount: false,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [staff]);

  useEffect(() => {
    const handleSave = async () => {
      if (!canEdit) return;
      setConfirmSaveOpen(true);
    };

    registerSave("profile", handleSave);
    return () => unregisterSave("profile");
  }, [canEdit, formData, registerSave, unregisterSave]);

  const performSave = async () => {
    if (!company?.id) return;
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    setSaving(true);
    setConfirmSaveOpen(false);

    try {
      const staffData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone || null,
        position: formData.position || null,
        role_id: formData.role_id || null,
        hire_date: formData.hire_date || null,
        is_active: formData.is_active,
        address: formData.address || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        country: formData.country || null,
        citizen_card: formData.citizen_card || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
      };

      if (staff) {
        // Update existing
        const { error } = await supabase
          .from('staff')
          .update(staffData)
          .eq('id', staff.id);
        if (error) throw error;
        toast.success('Colaborador atualizado!');
      } else {
        // Create new
        const { data: newStaff, error } = await supabase
          .from('staff')
          .insert({
            ...staffData,
            company_id: company.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Create account if requested
        if (formData.createAccount && formData.email) {
          const { error: accountError } = await supabase.functions.invoke('create-student-account', {
            body: {
              email: formData.email,
              fullName: formData.full_name,
              recordId: newStaff.id,
              recordType: 'staff',
            }
          });
          if (accountError) {
            console.error('Error creating account:', accountError);
            toast.error('Colaborador criado, mas erro ao criar conta de acesso');
          }
        }
        toast.success('Colaborador criado!');
      }

      onSaved();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h4 className="font-medium mb-3">Informação Básica</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nome completo"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+351 912 345 678"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Personal Trainer"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Função (Permissões)</Label>
            <Select
              value={formData.role_id || "__none__"}
              onValueChange={(v) => setFormData({ ...formData, role_id: v === "__none__" ? "" : v })}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Contratação</Label>
            <Input
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h4 className="font-medium mb-3">Documentos de Identificação</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cartão de Cidadão</Label>
            <Input
              value={formData.citizen_card}
              onChange={(e) => setFormData({ ...formData, citizen_card: e.target.value })}
              placeholder="12345678 0 ZZ0"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h4 className="font-medium mb-3">Morada</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, andar"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Código Postal</Label>
            <Input
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="1234-567"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Lisboa"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h4 className="font-medium mb-3">Contacto de Emergência</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="Nome do contacto"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              type="tel"
              value={formData.emergency_phone}
              onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
              placeholder="+351 912 345 678"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Status and Account */}
      {canEdit && (
        <div className="flex flex-col gap-3 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
            />
            <Label htmlFor="isActive" className="font-normal">Colaborador ativo</Label>
          </div>
          {isNewStaff && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createAccount"
                checked={formData.createAccount}
                onCheckedChange={(checked) => setFormData({ ...formData, createAccount: checked as boolean })}
              />
              <Label htmlFor="createAccount" className="font-normal">
                Criar conta de acesso (senha temporária: 12345678)
              </Label>
            </div>
          )}
        </div>
      )}

      {/* Save Button for new staff */}
      {isNewStaff && canEdit && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={performSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Criar Colaborador
          </Button>
        </div>
      )}

      {/* Confirm Save Dialog */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guardar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja guardar as alterações feitas ao perfil?
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
