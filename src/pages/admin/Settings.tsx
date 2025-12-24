import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Globe, Mail, Shield, Bell, Save, Key, CreditCard, Loader2, Phone, Building, Receipt, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordResetRequestsSection } from "@/components/admin/PasswordResetRequestsSection";

interface AdminSettings {
  id: string;
  platform_name: string | null;
  platform_url: string | null;
  platform_description: string | null;
  default_language: string | null;
  timezone: string | null;
  mbway_phone: string | null;
  iban: string | null;
  bank_name: string | null;
  nif: string | null;
  billing_name: string | null;
  billing_address: string | null;
  billing_email: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  from_email: string | null;
  from_name: string | null;
  require_2fa: boolean | null;
  lockout_enabled: boolean | null;
  lockout_attempts: number | null;
  session_expiry: string | null;
  maintenance_mode: boolean | null;
  allow_registration: boolean | null;
  api_enabled: boolean | null;
  rate_limit: number | null;
  notify_new_companies: boolean | null;
  notify_pending_payments: boolean | null;
  notify_system_errors: boolean | null;
  notify_new_suggestions: boolean | null;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AdminSettings>) => {
    if (!settings?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;
      
      setSettings({ ...settings, ...updates });
      toast.success('Configurações guardadas com sucesso');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao guardar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchChange = (field: keyof AdminSettings, value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleInputChange = (field: keyof AdminSettings, value: string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Definições do Sistema</h1>
        <p className="text-muted-foreground text-sm md:text-base">Configurações globais da plataforma</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:grid-cols-7 md:flex">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Faturação</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden md:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="password-reset" className="gap-2">
            <KeyRound className="h-4 w-4" />
            <span className="hidden md:inline">Senhas</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">API</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Definições básicas da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome da Plataforma</Label>
                  <Input 
                    id="siteName" 
                    value={settings?.platform_name || ''} 
                    onChange={(e) => handleInputChange('platform_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL da Plataforma</Label>
                  <Input 
                    id="siteUrl" 
                    value={settings?.platform_url || ''} 
                    onChange={(e) => handleInputChange('platform_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={settings?.platform_description || ''}
                  onChange={(e) => handleInputChange('platform_description', e.target.value)}
                  placeholder="Plataforma de gestão para ginásios e personal trainers"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Idioma Padrão</Label>
                  <Select 
                    value={settings?.default_language || 'pt'} 
                    onValueChange={(value) => handleInputChange('default_language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select 
                    value={settings?.timezone || 'Europe/Lisbon'} 
                    onValueChange={(value) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Lisbon">Europe/Lisbon</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear acesso de utilizadores durante manutenção
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.maintenance_mode || false}
                    onCheckedChange={(value) => handleSwitchChange('maintenance_mode', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Registo</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir novas empresas se registarem
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.allow_registration ?? true}
                    onCheckedChange={(value) => handleSwitchChange('allow_registration', value)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateSettings({
                  platform_name: settings?.platform_name,
                  platform_url: settings?.platform_url,
                  platform_description: settings?.platform_description,
                  default_language: settings?.default_language,
                  timezone: settings?.timezone,
                  maintenance_mode: settings?.maintenance_mode,
                  allow_registration: settings?.allow_registration,
                })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Dados de Faturação e Pagamentos
              </CardTitle>
              <CardDescription>Configure os dados para recebimento de pagamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mbway" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Número MB WAY
                  </Label>
                  <Input 
                    id="mbway" 
                    placeholder="+351 912 345 678"
                    value={settings?.mbway_phone || ''} 
                    onChange={(e) => handleInputChange('mbway_phone', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Número para receber pagamentos via MB WAY</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nif" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    NIF
                  </Label>
                  <Input 
                    id="nif" 
                    placeholder="123456789"
                    value={settings?.nif || ''} 
                    onChange={(e) => handleInputChange('nif', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Dados Bancários
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Nome do Banco</Label>
                    <Input 
                      id="bankName" 
                      placeholder="Banco Exemplo"
                      value={settings?.bank_name || ''} 
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input 
                      id="iban" 
                      placeholder="PT50 0000 0000 0000 0000 0000 0"
                      value={settings?.iban || ''} 
                      onChange={(e) => handleInputChange('iban', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Dados de Faturação</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingName">Nome para Faturação</Label>
                    <Input 
                      id="billingName" 
                      placeholder="Cagiotech, Lda"
                      value={settings?.billing_name || ''} 
                      onChange={(e) => handleInputChange('billing_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Email de Faturação</Label>
                    <Input 
                      id="billingEmail" 
                      type="email"
                      placeholder="faturacao@empresa.com"
                      value={settings?.billing_email || ''} 
                      onChange={(e) => handleInputChange('billing_email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Morada de Faturação</Label>
                  <Textarea 
                    id="billingAddress" 
                    placeholder="Rua Exemplo, 123&#10;1000-000 Lisboa&#10;Portugal"
                    value={settings?.billing_address || ''} 
                    onChange={(e) => handleInputChange('billing_address', e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateSettings({
                  mbway_phone: settings?.mbway_phone,
                  nif: settings?.nif,
                  bank_name: settings?.bank_name,
                  iban: settings?.iban,
                  billing_name: settings?.billing_name,
                  billing_email: settings?.billing_email,
                  billing_address: settings?.billing_address,
                })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Dados de Faturação
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>Definir servidor SMTP e templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input 
                    id="smtpHost" 
                    placeholder="smtp.example.com"
                    value={settings?.smtp_host || ''} 
                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta</Label>
                  <Input 
                    id="smtpPort" 
                    type="number"
                    placeholder="587"
                    value={settings?.smtp_port || ''} 
                    onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value) || 587)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Utilizador</Label>
                  <Input 
                    id="smtpUser" 
                    placeholder="user@example.com"
                    value={settings?.smtp_user || ''} 
                    onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Palavra-passe</Label>
                  <Input 
                    id="smtpPassword" 
                    type="password"
                    value={settings?.smtp_password || ''} 
                    onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Remetente</Label>
                  <Input 
                    id="fromEmail" 
                    placeholder="noreply@cagiotech.com"
                    value={settings?.from_email || ''} 
                    onChange={(e) => handleInputChange('from_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome Remetente</Label>
                  <Input 
                    id="fromName" 
                    placeholder="Cagiotech"
                    value={settings?.from_name || ''} 
                    onChange={(e) => handleInputChange('from_name', e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateSettings({
                  smtp_host: settings?.smtp_host,
                  smtp_port: settings?.smtp_port,
                  smtp_user: settings?.smtp_user,
                  smtp_password: settings?.smtp_password,
                  from_email: settings?.from_email,
                  from_name: settings?.from_name,
                })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Definir políticas de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação 2FA Obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para todos os utilizadores admin
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.require_2fa ?? true}
                    onCheckedChange={(value) => handleSwitchChange('require_2fa', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bloqueio após Tentativas</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear conta após {settings?.lockout_attempts || 5} tentativas falhadas
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.lockout_enabled ?? true}
                    onCheckedChange={(value) => handleSwitchChange('lockout_enabled', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Expiração de Sessão</Label>
                    <p className="text-sm text-muted-foreground">
                      Terminar sessão após inatividade
                    </p>
                  </div>
                  <Select 
                    value={settings?.session_expiry || '24h'}
                    onValueChange={(value) => handleInputChange('session_expiry', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="8h">8 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={() => updateSettings({
                  require_2fa: settings?.require_2fa,
                  lockout_enabled: settings?.lockout_enabled,
                  session_expiry: settings?.session_expiry,
                })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>Definir alertas e notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novas Empresas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando uma nova empresa se regista
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.notify_new_companies ?? true}
                    onCheckedChange={(value) => handleSwitchChange('notify_new_companies', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagamentos Pendentes</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertar sobre pagamentos em atraso
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.notify_pending_payments ?? true}
                    onCheckedChange={(value) => handleSwitchChange('notify_pending_payments', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Erros do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas de erros críticos
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.notify_system_errors ?? true}
                    onCheckedChange={(value) => handleSwitchChange('notify_system_errors', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novas Sugestões</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre novas sugestões no roadmap
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.notify_new_suggestions ?? true}
                    onCheckedChange={(value) => handleSwitchChange('notify_new_suggestions', value)}
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateSettings({
                  notify_new_companies: settings?.notify_new_companies,
                  notify_pending_payments: settings?.notify_pending_payments,
                  notify_system_errors: settings?.notify_system_errors,
                  notify_new_suggestions: settings?.notify_new_suggestions,
                })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
              <CardDescription>Gerir chaves e acessos de API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chave de API Principal</p>
                    <p className="text-sm text-muted-foreground">Gerada automaticamente</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">sk_live_•••••••••••</code>
                    <Button variant="outline" size="sm">Revelar</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativar API Pública</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir acesso via API para integrações
                    </p>
                  </div>
                  <Switch 
                    checked={settings?.api_enabled ?? true}
                    onCheckedChange={(value) => handleSwitchChange('api_enabled', value)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limitar pedidos por minuto
                    </p>
                  </div>
                  <Select 
                    value={String(settings?.rate_limit || 1000)}
                    onValueChange={(value) => handleInputChange('rate_limit', parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100/min</SelectItem>
                      <SelectItem value="500">500/min</SelectItem>
                      <SelectItem value="1000">1000/min</SelectItem>
                      <SelectItem value="0">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={() => updateSettings({
                  api_enabled: settings?.api_enabled,
                  rate_limit: settings?.rate_limit,
                })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Reset Requests */}
        <TabsContent value="password-reset" className="space-y-4">
          <PasswordResetRequestsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}