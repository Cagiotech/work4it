import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, CreditCard, FileText, GraduationCap, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface StaffProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  onSaved: () => void;
}

interface StaffFormData {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  role_id: string;
  hire_date: string;
  is_active: boolean;
  // Personal documents
  nif: string;
  niss: string;
  citizen_card: string;
  // Address
  address: string;
  postal_code: string;
  city: string;
  country: string;
  // Emergency contact
  emergency_contact: string;
  emergency_phone: string;
  // Payment config
  payment_type: string;
  base_salary: number;
  hourly_rate: number;
  daily_rate: number;
  per_class_rate: number;
  commission_percentage: number;
  bank_name: string;
  bank_iban: string;
}

const defaultFormData: StaffFormData = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  role_id: "",
  hire_date: new Date().toISOString().split('T')[0],
  is_active: true,
  nif: "",
  niss: "",
  citizen_card: "",
  address: "",
  postal_code: "",
  city: "",
  country: "Portugal",
  emergency_contact: "",
  emergency_phone: "",
  payment_type: "monthly",
  base_salary: 0,
  hourly_rate: 0,
  daily_rate: 0,
  per_class_rate: 0,
  commission_percentage: 0,
  bank_name: "",
  bank_iban: "",
};

export function StaffProfileDialog({ open, onOpenChange, staffId, onSaved }: StaffProfileDialogProps) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<StaffFormData>(defaultFormData);
  const [createAccount, setCreateAccount] = useState(true);

  useEffect(() => {
    if (open) {
      fetchRoles();
      if (staffId) {
        fetchStaffData();
      } else {
        setFormData(defaultFormData);
        setCreateAccount(true);
      }
    }
  }, [open, staffId]);

  const fetchRoles = async () => {
    if (!company?.id) return;
    const { data } = await supabase
      .from('roles')
      .select('id, name, color')
      .eq('company_id', company.id)
      .order('name');
    if (data) setRoles(data);
  };

  const fetchStaffData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const [staffRes, paymentRes] = await Promise.all([
        supabase.from('staff').select('*').eq('id', staffId).single(),
        supabase.from('staff_payment_config').select('*').eq('staff_id', staffId).maybeSingle()
      ]);

      if (staffRes.error) throw staffRes.error;

      const staff = staffRes.data;
      const payment = paymentRes.data;

      setFormData({
        full_name: staff.full_name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        position: staff.position || "",
        role_id: staff.role_id || "",
        hire_date: staff.hire_date || "",
        is_active: staff.is_active !== false,
        nif: payment?.nif || "",
        niss: payment?.niss || "",
        citizen_card: staff.citizen_card || "",
        address: staff.address || "",
        postal_code: staff.postal_code || "",
        city: staff.city || "",
        country: staff.country || "Portugal",
        emergency_contact: staff.emergency_contact || "",
        emergency_phone: staff.emergency_phone || "",
        payment_type: payment?.payment_type || "monthly",
        base_salary: payment?.base_salary || 0,
        hourly_rate: payment?.hourly_rate || 0,
        daily_rate: payment?.daily_rate || 0,
        per_class_rate: payment?.per_class_rate || 0,
        commission_percentage: payment?.commission_percentage || 0,
        bank_name: payment?.bank_name || "",
        bank_iban: payment?.bank_iban || "",
      });
      setCreateAccount(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Erro ao carregar dados do colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id) return;
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      let currentStaffId = staffId;

      if (staffId) {
        // Update existing staff
        const { error } = await supabase.from('staff').update({
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
        }).eq('id', staffId);
        if (error) throw error;
      } else {
        // Create new staff
        const { data: newStaff, error } = await supabase.from('staff').insert({
          company_id: company.id,
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
        }).select().single();
        if (error) throw error;
        currentStaffId = newStaff.id;

        // Create account if requested
        if (createAccount && formData.email) {
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
            toast.error('Colaborador criado, mas erro ao criar conta');
          }
        }
      }

      // Save payment configuration
      if (currentStaffId) {
        const paymentData = {
          staff_id: currentStaffId,
          nif: formData.nif || null,
          niss: formData.niss || null,
          payment_type: formData.payment_type,
          base_salary: formData.base_salary || 0,
          hourly_rate: formData.hourly_rate || 0,
          daily_rate: formData.daily_rate || 0,
          per_class_rate: formData.per_class_rate || 0,
          commission_percentage: formData.commission_percentage || 0,
          bank_name: formData.bank_name || null,
          bank_iban: formData.bank_iban || null,
        };

        const { error: paymentError } = await supabase
          .from('staff_payment_config')
          .upsert(paymentData, { onConflict: 'staff_id' });
        
        if (paymentError) throw paymentError;
      }

      toast.success(staffId ? 'Colaborador atualizado!' : 'Colaborador criado!');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving staff:', error);
      toast.error(error.message || 'Erro ao guardar colaborador');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {formData.full_name ? getInitials(formData.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">
                {staffId ? 'Editar Colaborador' : 'Novo Colaborador'}
              </DialogTitle>
              {formData.position && (
                <Badge variant="outline" className="mt-1">{formData.position}</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 justify-start">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Formações
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="personal" className="mt-4 space-y-6 pb-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+351 912 345 678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Personal Trainer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Função (Permissões)</Label>
                  <Select
                    value={formData.role_id || "__none__"}
                    onValueChange={(v) => setFormData({ ...formData, role_id: v === "__none__" ? "" : v })}
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
                  />
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-medium mb-3">Documentos de Identificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>NIF</Label>
                    <Input
                      value={formData.nif}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NISS</Label>
                    <Input
                      value={formData.niss}
                      onChange={(e) => setFormData({ ...formData, niss: e.target.value })}
                      placeholder="12345678901"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cartão de Cidadão</Label>
                    <Input
                      value={formData.citizen_card}
                      onChange={(e) => setFormData({ ...formData, citizen_card: e.target.value })}
                      placeholder="12345678 0 ZZ0"
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código Postal</Label>
                    <Input
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="1234-567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Lisboa"
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      type="tel"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Account */}
              <div className="flex flex-col gap-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="isActive" className="font-normal">Colaborador ativo</Label>
                </div>
                {!staffId && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createAccount"
                      checked={createAccount}
                      onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                    />
                    <Label htmlFor="createAccount" className="font-normal">
                      Criar conta de acesso (senha temporária: 12345678)
                    </Label>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="mt-4 space-y-6 pb-4">
              {/* Payment Type */}
              <div className="space-y-2">
                <Label>Tipo de Pagamento</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(v) => setFormData({ ...formData, payment_type: v })}
                >
                  <SelectTrigger>
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
                    />
                  </div>
                )}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={formData.bank_iban}
                      onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })}
                      placeholder="PT50 0000 0000 00000000000 00"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4 pb-4">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gestão de documentos disponível após guardar o colaborador.</p>
              </div>
            </TabsContent>

            <TabsContent value="training" className="mt-4 pb-4">
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Histórico de formações disponível após guardar o colaborador.</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-6 pt-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {staffId ? 'Guardar Alterações' : 'Criar Colaborador'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
