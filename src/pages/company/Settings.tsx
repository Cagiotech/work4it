import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Lock, Building, Save, LogOut, Link, FileText, Copy, Check, Trash2, AlertTriangle, LayoutGrid, UserCheck, Phone, Mail, MapPin, Globe, FileCheck, Users, CreditCard, Smartphone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ClassesSettingsSection } from "@/components/company/settings/ClassesSettingsSection";
import { RolesSettingsSection } from "@/components/company/settings/RolesSettingsSection";
import { PlansSettingsSection } from "@/components/company/settings/PlansSettingsSection";
import { PasswordResetRequestsSection } from "@/components/company/settings/PasswordResetRequestsSection";
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

// Pre-filled templates
const DEFAULT_TERMS_TEMPLATE = `TERMOS E CONDIÇÕES DE UTILIZAÇÃO

1. ACEITAÇÃO DOS TERMOS
Ao utilizar os serviços do [NOME DO GINÁSIO], o utilizador aceita integralmente os presentes Termos e Condições.

2. INSCRIÇÃO E MATRÍCULA
2.1. A inscrição está sujeita à apresentação de documentos de identificação válidos.
2.2. O pagamento da mensalidade deve ser efetuado até ao dia 8 de cada mês.
2.3. O incumprimento dos pagamentos poderá resultar na suspensão do acesso às instalações.

3. UTILIZAÇÃO DAS INSTALAÇÕES
3.1. O acesso às instalações é pessoal e intransmissível.
3.2. É obrigatório o uso de vestuário e calçado adequado à prática desportiva.
3.3. É obrigatório o uso de toalha durante os treinos.
3.4. É proibido o consumo de alimentos nas áreas de treino.

4. CANCELAMENTO
4.1. O cancelamento da inscrição deve ser comunicado com 30 dias de antecedência.
4.2. O pedido de cancelamento deve ser feito por escrito.

5. RESPONSABILIDADE
5.1. O ginásio não se responsabiliza por objetos pessoais perdidos ou roubados.
5.2. É recomendado o uso de cadeados pessoais nos cacifos.

6. ALTERAÇÕES
O ginásio reserva-se o direito de alterar estes termos a qualquer momento, mediante comunicação prévia aos utilizadores.

Data de última atualização: [DATA]`;

const DEFAULT_REGULATIONS_TEMPLATE = `REGULAMENTO INTERNO

HORÁRIO DE FUNCIONAMENTO
• Segunda a Sexta: 07:00 - 22:00
• Sábado: 09:00 - 18:00
• Domingo e Feriados: 09:00 - 13:00

NORMAS GERAIS DE CONDUTA
1. Manter uma conduta respeitosa com todos os utilizadores e funcionários.
2. Utilizar os equipamentos de forma adequada e segura.
3. Repor os equipamentos no local apropriado após utilização.
4. Limpar os equipamentos após utilização.
5. Respeitar os limites de tempo nos equipamentos cardiovasculares em horário de pico.

VESTUÁRIO E HIGIENE
• Usar roupa desportiva limpa e apropriada.
• Usar calçado desportivo fechado e limpo.
• Usar toalha durante os treinos.
• Tomar duche antes de utilizar a piscina/sauna (se aplicável).

SEGURANÇA
• Consultar um médico antes de iniciar a prática desportiva.
• Informar os instrutores sobre qualquer condição de saúde relevante.
• Em caso de mal-estar, suspender imediatamente o treino e informar um funcionário.
• Não é permitido treinar sob efeito de álcool ou substâncias ilícitas.

PROIBIÇÕES
• Não é permitida a entrada de menores de 16 anos sem acompanhamento de adulto.
• Não é permitido fumar em nenhuma área das instalações.
• Não é permitida a utilização de telemóveis nas áreas de treino (exceto para música).
• Não é permitido dar orientações técnicas a outros utilizadores (função exclusiva dos instrutores).

SANÇÕES
O não cumprimento do presente regulamento poderá resultar em advertência, suspensão temporária ou cancelamento da inscrição, sem direito a reembolso.`;

interface ExtendedCompany {
  id: string;
  name: string | null;
  address: string | null;
  registration_code?: string;
  terms_text?: string | null;
  regulations_text?: string | null;
  anamnesis_filled_by?: string;
  require_student_approval?: boolean;
  mbway_phone?: string | null;
}

export default function Settings() {
  const { t } = useTranslation();
  const { profile, company, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [extendedCompany, setExtendedCompany] = useState<ExtendedCompany | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    rolePosition: '',
    email: '',
    phone: '',
  });
  
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    nif: '',
    mbway_phone: '',
  });

  const [regulationsData, setRegulationsData] = useState({
    termsText: '',
    regulationsText: '',
    anamnesisFilledBy: 'trainer',
    requireStudentApproval: false,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.full_name || '',
        rolePosition: profile.role_position || '',
        email: '',
        phone: '',
      });
      fetchUserEmail();
    }
    if (company) {
      setCompanyData({
        name: company.name || '',
        address: company.address || '',
        phone: '',
        email: '',
        website: '',
        nif: '',
        mbway_phone: '',
      });
      fetchExtendedCompanyData(company.id);
    }
  }, [profile, company]);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setProfileData(prev => ({ ...prev, email: user.email || '' }));
    }
  };

  const fetchExtendedCompanyData = async (companyId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, address, registration_code, terms_text, regulations_text, anamnesis_filled_by, require_student_approval, mbway_phone')
      .eq('id', companyId)
      .single();

    if (data) {
      setExtendedCompany(data);
      setCompanyData(prev => ({
        ...prev,
        mbway_phone: data.mbway_phone || '',
      }));
      setRegulationsData({
        termsText: data.terms_text || '',
        regulationsText: data.regulations_text || '',
        anamnesisFilledBy: data.anamnesis_filled_by || 'trainer',
        requireStudentApproval: data.require_student_approval || false,
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRegistrationLink = () => {
    if (!extendedCompany?.registration_code) return '';
    return `${window.location.origin}/registro?code=${extendedCompany.registration_code}`;
  };

  const handleCopyLink = async () => {
    const link = getRegistrationLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName.trim(),
          role_position: profileData.rolePosition.trim(),
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name.trim(),
          address: companyData.address.trim() || null,
          mbway_phone: companyData.mbway_phone.trim() || null,
        })
        .eq('id', company.id);

      if (error) throw error;
      await refreshProfile();
      toast.success('Dados da empresa atualizados!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegulations = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          terms_text: regulationsData.termsText.trim() || null,
          regulations_text: regulationsData.regulationsText.trim() || null,
          anamnesis_filled_by: regulationsData.anamnesisFilledBy,
          require_student_approval: regulationsData.requireStudentApproval,
        })
        .eq('id', company.id);

      if (error) throw error;
      toast.success('Configurações atualizadas!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      setPasswordData({ newPassword: '', confirmPassword: '' });
      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!company || !profile) return;
    
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('delete-company-account', {
        body: {
          companyId: company.id,
          userId: profile.user_id,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('Conta excluída com sucesso');
      await signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Erro ao excluir conta');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleLoadTermsTemplate = () => {
    const customized = DEFAULT_TERMS_TEMPLATE
      .replace('[NOME DO GINÁSIO]', companyData.name || 'NOME DO GINÁSIO')
      .replace('[DATA]', new Date().toLocaleDateString('pt-PT'));
    setRegulationsData(prev => ({ ...prev, termsText: customized }));
    toast.success('Modelo de termos carregado! Personalize conforme necessário.');
  };

  const handleLoadRegulationsTemplate = () => {
    setRegulationsData(prev => ({ ...prev, regulationsText: DEFAULT_REGULATIONS_TEMPLATE }));
    toast.success('Modelo de regulamento carregado! Personalize conforme necessário.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie as configurações da sua empresa</p>
        </div>
        <Button variant="outline" onClick={handleLogout} size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <User className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <Building className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="hr" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <Users className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">RH</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <LayoutGrid className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Aulas</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <CreditCard className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Planos</span>
          </TabsTrigger>
          <TabsTrigger value="registration" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <Link className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Registo</span>
          </TabsTrigger>
          <TabsTrigger value="regulations" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Regulamento</span>
          </TabsTrigger>
          <TabsTrigger value="password-reset" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <KeyRound className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Senhas</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm data-[state=active]:bg-background">
            <Lock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              <CardDescription>Gerencie seus dados pessoais e de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(profileData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate">{profileData.fullName || 'Sem nome'}</p>
                  <p className="text-muted-foreground text-sm">{profileData.rolePosition || 'Sem cargo'}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{profileData.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      placeholder="Seu nome completo"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rolePosition" className="text-sm font-medium">Cargo</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rolePosition"
                      value={profileData.rolePosition}
                      onChange={(e) => setProfileData({ ...profileData, rolePosition: e.target.value })}
                      placeholder="Seu cargo na empresa"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+351 912 345 678"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} disabled={loading} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Dados da Empresa</CardTitle>
              <CardDescription>Informações do seu ginásio/academia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">Nome da Empresa</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Nome do ginásio/academia"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nif" className="text-sm font-medium">NIF</Label>
                  <Input
                    id="nif"
                    value={companyData.nif}
                    onChange={(e) => setCompanyData({ ...companyData, nif: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                      placeholder="Endereço completo"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone" className="text-sm font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyPhone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="+351 21 123 4567"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyEmail"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      placeholder="geral@ginasio.pt"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      placeholder="https://www.ginasio.pt"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Configurações de Pagamento</h3>
                </div>
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="mbway_phone" className="text-sm font-medium">Número MB Way</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="mbway_phone"
                      value={companyData.mbway_phone}
                      onChange={(e) => setCompanyData({ ...companyData, mbway_phone: e.target.value })}
                      placeholder="912345678"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este número será exibido aos alunos para pagamento via MB Way.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveCompany} disabled={loading} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Cargos e Permissões</CardTitle>
              <CardDescription>Configure os cargos e permissões dos colaboradores</CardDescription>
            </CardHeader>
            <CardContent>
              <RolesSettingsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Aulas e Serviços</CardTitle>
              <CardDescription>Configure os tipos de aula e salas disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <ClassesSettingsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Planos de Subscrição</CardTitle>
              <CardDescription>Configure os planos de subscrição e regras de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <PlansSettingsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Link de Registo para Alunos</CardTitle>
              <CardDescription>Partilhe este link para os alunos se registarem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <Label htmlFor="requireApproval" className="font-medium text-sm">
                      Requer Aprovação
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alunos ficam pendentes de aprovação antes de aceder
                  </p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={regulationsData.requireStudentApproval}
                  onCheckedChange={(checked) => setRegulationsData({ ...regulationsData, requireStudentApproval: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Link de Registo</Label>
                <div className="flex gap-2">
                  <Input
                    value={getRegistrationLink()}
                    readOnly
                    className="bg-muted text-xs sm:text-sm"
                  />
                  <Button onClick={handleCopyLink} variant="outline" size="icon" className="shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {regulationsData.requireStudentApproval 
                    ? 'Alunos ficarão pendentes até aprovação manual.'
                    : 'Alunos terão acesso imediato após registo.'}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm font-medium">Quem preenche a Anamnese?</Label>
                <Select 
                  value={regulationsData.anamnesisFilledBy} 
                  onValueChange={(value) => setRegulationsData({ ...regulationsData, anamnesisFilledBy: value })}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trainer">Personal Trainer responsável</SelectItem>
                    <SelectItem value="student">O próprio aluno</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define quem preenche a avaliação de saúde do aluno
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveRegulations} disabled={loading} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulations" className="mt-0">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <CardTitle className="text-lg">Termos e Condições</CardTitle>
                    <CardDescription>Termos que os alunos devem aceitar</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoadTermsTemplate} className="w-fit">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Carregar Modelo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={regulationsData.termsText}
                  onChange={(e) => setRegulationsData({ ...regulationsData, termsText: e.target.value })}
                  placeholder="Escreva aqui os termos e condições..."
                  className="min-h-[200px] sm:min-h-[250px] font-mono text-xs sm:text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div>
                    <CardTitle className="text-lg">Regulamento Interno</CardTitle>
                    <CardDescription>Regulamento que os alunos devem aceitar</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoadRegulationsTemplate} className="w-fit">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Carregar Modelo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={regulationsData.regulationsText}
                  onChange={(e) => setRegulationsData({ ...regulationsData, regulationsText: e.target.value })}
                  placeholder="Escreva aqui o regulamento interno..."
                  className="min-h-[200px] sm:min-h-[250px] font-mono text-xs sm:text-sm"
                />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveRegulations} disabled={loading} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Regulamentos'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta segura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium mb-1">Requisitos:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Mínimo de 6 caracteres</li>
                    <li>• Use letras, números e caracteres especiais</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={loading} size="sm">
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>Ações irreversíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                  <div className="space-y-1">
                    <p className="font-medium text-destructive text-sm">Excluir Conta</p>
                    <p className="text-xs text-muted-foreground">
                      Remove permanentemente todos os dados
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteDialogOpen(true)}
                    size="sm"
                    className="w-fit"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="password-reset" className="mt-0">
          <PasswordResetRequestsSection />
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Conta Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Esta ação é <strong>irreversível</strong>. Ao excluir sua conta, todos os seguintes dados serão permanentemente removidos:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Todos os alunos e suas informações</li>
                <li>Todos os membros da equipe (staff)</li>
                <li>Planos de subscrição</li>
                <li>Documentos e notas</li>
                <li>Anamneses e planos nutricionais</li>
                <li>Funções e permissões</li>
                <li>Dados da empresa</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="confirmDelete">
                  Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
                </Label>
                <Input
                  id="confirmDelete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "EXCLUIR" || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
