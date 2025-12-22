import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Palette, Save, Loader2, CreditCard, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

interface StaffData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  citizen_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  hire_date: string | null;
  contract_type: string | null;
  weekly_hours: number | null;
  password_changed: boolean | null;
  company_id: string;
  role_id: string | null;
  companies?: {
    id: string;
    name: string | null;
    address: string | null;
  };
  roles?: {
    id: string;
    name: string;
    color: string | null;
  };
}

interface PaymentConfig {
  id: string;
  staff_id: string;
  payment_type: string;
  base_salary: number | null;
  hourly_rate: number | null;
  per_class_rate: number | null;
  daily_rate: number | null;
  commission_percentage: number | null;
  bank_name: string | null;
  bank_iban: string | null;
  nif: string | null;
  niss: string | null;
}

export default function PersonalSettings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Portugal",
    emergency_contact: "",
    emergency_phone: "",
  });

  // Password states
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user?.id) return;

      try {
        // Fetch staff data with company and role
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("*, companies(id, name, address), roles(id, name, color)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (staffError) throw staffError;

        if (staffData) {
          setStaff(staffData as StaffData);
          setFormData({
            full_name: staffData.full_name || "",
            email: staffData.email || "",
            phone: staffData.phone || "",
            address: staffData.address || "",
            city: staffData.city || "",
            postal_code: staffData.postal_code || "",
            country: staffData.country || "Portugal",
            emergency_contact: staffData.emergency_contact || "",
            emergency_phone: staffData.emergency_phone || "",
          });

          // Fetch payment config
          const { data: paymentData } = await supabase
            .from("staff_payment_config")
            .select("*")
            .eq("staff_id", staffData.id)
            .maybeSingle();

          if (paymentData) {
            setPaymentConfig(paymentData as PaymentConfig);
          }
        }
      } catch (error) {
        console.error("Error fetching staff data:", error);
        toast.error("Erro ao carregar dados do perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!staff?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("staff")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
        })
        .eq("id", staff.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("As palavras-passe não coincidem");
      return;
    }

    if (passwords.new.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      // Mark password as changed
      if (staff?.id) {
        await supabase
          .from("staff")
          .update({ password_changed: true })
          .eq("id", staff.id);
      }

      toast.success("Palavra-passe alterada com sucesso!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erro ao alterar palavra-passe");
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPaymentType = (type: string) => {
    const types: Record<string, string> = {
      monthly: "Mensal",
      hourly: "Por Hora",
      per_class: "Por Aula",
      daily: "Diário",
      commission: "Comissão",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Definições</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Gerir o seu perfil e preferências
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:grid-cols-5 md:flex">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Trabalho</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Pagamento</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Os seus dados pessoais e de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {staff?.full_name ? getInitials(staff.full_name) : "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                  <p className="font-medium">{staff?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{staff?.position || "Colaborador"}</p>
                  {staff?.roles && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1"
                      style={{ backgroundColor: `${staff.roles.color}20`, color: staff.roles.color }}
                    >
                      {staff.roles.name}
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Morada</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  />
                </div>

                <Separator className="md:col-span-2" />

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contacto de Emergência</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    placeholder="Nome do contacto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    placeholder="Número de telefone"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full md:w-auto">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Tab */}
        <TabsContent value="work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Trabalho</CardTitle>
              <CardDescription>Dados relacionados com o seu contrato e empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input value={staff?.companies?.name || "-"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={staff?.position || "-"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Contratação</Label>
                  <Input
                    value={staff?.hire_date ? new Date(staff.hire_date).toLocaleDateString("pt-PT") : "-"}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <Input
                    value={
                      staff?.contract_type === "full_time"
                        ? "Tempo Integral"
                        : staff?.contract_type === "part_time"
                        ? "Tempo Parcial"
                        : staff?.contract_type || "-"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas Semanais</Label>
                  <Input value={staff?.weekly_hours?.toString() || "-"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Input value={staff?.roles?.name || "-"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Cartão de Cidadão</Label>
                  <Input value={staff?.citizen_card || "-"} disabled className="bg-muted" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                * Estas informações são geridas pela administração da empresa
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Pagamento</CardTitle>
              <CardDescription>Dados fiscais e bancários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentConfig ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Pagamento</Label>
                    <Input
                      value={formatPaymentType(paymentConfig.payment_type)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  {paymentConfig.payment_type === "monthly" && paymentConfig.base_salary && (
                    <div className="space-y-2">
                      <Label>Salário Base</Label>
                      <Input
                        value={`€ ${paymentConfig.base_salary.toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                  {paymentConfig.payment_type === "hourly" && paymentConfig.hourly_rate && (
                    <div className="space-y-2">
                      <Label>Taxa por Hora</Label>
                      <Input
                        value={`€ ${paymentConfig.hourly_rate.toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                  {paymentConfig.payment_type === "per_class" && paymentConfig.per_class_rate && (
                    <div className="space-y-2">
                      <Label>Taxa por Aula</Label>
                      <Input
                        value={`€ ${paymentConfig.per_class_rate.toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>NIF</Label>
                    <Input value={paymentConfig.nif || "-"} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>NISS</Label>
                    <Input value={paymentConfig.niss || "-"} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input value={paymentConfig.bank_name || "-"} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input value={paymentConfig.bank_iban || "-"} disabled className="bg-muted" />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Não há configuração de pagamento definida.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                * Estas informações são geridas pela administração da empresa
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerir a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {staff?.password_changed === false && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                  <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                    ⚠️ Por favor, altere a sua palavra-passe temporária
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Palavra-passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Alterar Palavra-passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalizar a interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={i18n.language} onValueChange={(lang) => i18n.changeLanguage(lang)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
