import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Lock, Building, Save, LogOut, Link, FileText, Copy, Check, Trash2, AlertTriangle, LayoutGrid, UserCheck, Phone, Mail, MapPin, Globe, FileCheck } from "lucide-react";
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
      .select('id, name, address, registration_code, terms_text, regulations_text, anamnesis_filled_by, require_student_approval')
      .eq('id', companyId)
      .single();

    if (data) {
      setExtendedCompany(data);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="classes">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Aulas
          </TabsTrigger>
          <TabsTrigger value="registration">
            <Link className="h-4 w-4 mr-2" />
            Registo
          </TabsTrigger>
          <TabsTrigger value="regulations">
            <FileText className="h-4 w-4 mr-2" />
            Regulamento
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Gerencie seus dados pessoais e de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(profileData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-xl">{profileData.fullName || 'Sem nome'}</p>
                  <p className="text-muted-foreground">{profileData.rolePosition || 'Sem cargo'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{profileData.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
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
                  <Label htmlFor="rolePosition">Cargo</Label>
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
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Telefone</Label>
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

              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Informações do seu ginásio/academia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
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
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    value={companyData.nif}
                    onChange={(e) => setCompanyData({ ...companyData, nif: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
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
                  <Label htmlFor="companyPhone">Telefone</Label>
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
                  <Label htmlFor="companyEmail">Email</Label>
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
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

              <Button onClick={handleSaveCompany} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Aulas e Serviços</CardTitle>
              <CardDescription>
                Configure os tipos de aula e salas disponíveis na sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassesSettingsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration">
          <Card>
            <CardHeader>
              <CardTitle>Link de Registo para Alunos</CardTitle>
              <CardDescription>
                Partilhe este link para os alunos se registarem na sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Approval Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <Label htmlFor="requireApproval" className="font-medium">
                      Requer Aprovação de Novos Alunos
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quando ativo, alunos que se registarem pelo link ficarão pendentes de aprovação antes de poderem aceder à plataforma.
                  </p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={regulationsData.requireStudentApproval}
                  onCheckedChange={(checked) => setRegulationsData({ ...regulationsData, requireStudentApproval: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Link de Registo</Label>
                <div className="flex gap-2">
                  <Input
                    value={getRegistrationLink()}
                    readOnly
                    className="bg-muted"
                  />
                  <Button onClick={handleCopyLink} variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {regulationsData.requireStudentApproval 
                    ? 'Os alunos que se registarem por este link ficarão pendentes até serem aprovados manualmente.'
                    : 'Os alunos que se registarem por este link terão acesso imediato após completar o registo.'}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Quem preenche a Anamnese?</Label>
                <Select 
                  value={regulationsData.anamnesisFilledBy} 
                  onValueChange={(value) => setRegulationsData({ ...regulationsData, anamnesisFilledBy: value })}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trainer">Personal Trainer responsável</SelectItem>
                    <SelectItem value="student">O próprio aluno</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define quem é responsável por preencher a avaliação de saúde (anamnese) do aluno.
                </p>
              </div>

              <Button onClick={handleSaveRegulations} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Termos e Condições</CardTitle>
                    <CardDescription>
                      Defina os termos e condições que os alunos devem aceitar.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoadTermsTemplate}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Carregar Modelo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={regulationsData.termsText}
                  onChange={(e) => setRegulationsData({ ...regulationsData, termsText: e.target.value })}
                  placeholder="Escreva aqui os termos e condições da sua empresa ou carregue o modelo pré-definido..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Regulamento Interno</CardTitle>
                    <CardDescription>
                      Defina o regulamento interno que os alunos devem aceitar.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoadRegulationsTemplate}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Carregar Modelo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={regulationsData.regulationsText}
                  onChange={(e) => setRegulationsData({ ...regulationsData, regulationsText: e.target.value })}
                  placeholder="Escreva aqui o regulamento interno da sua empresa ou carregue o modelo pré-definido..."
                  className="min-h-[300px] font-mono text-sm"
                />
                
                <Button onClick={handleSaveRegulations} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Regulamentos'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
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
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
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

                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">Requisitos de senha:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Mínimo de 6 caracteres</li>
                    <li>• Recomendamos usar letras maiúsculas e minúsculas</li>
                    <li>• Recomendamos usar números e caracteres especiais</li>
                  </ul>
                </div>

                <Button onClick={handleChangePassword} disabled={loading}>
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Ações irreversíveis. Tenha cuidado ao usar estas opções.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                  <div>
                    <p className="font-medium text-destructive">Excluir Conta</p>
                    <p className="text-sm text-muted-foreground">
                      Remove permanentemente a empresa e todos os dados associados (alunos, staff, planos, etc.)
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
