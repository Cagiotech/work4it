import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Lock, Building, Save, LogOut, Link, FileText, Copy, Check, Trash2, AlertTriangle, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ExtendedCompany {
  id: string;
  name: string | null;
  address: string | null;
  registration_code?: string;
  terms_text?: string | null;
  regulations_text?: string | null;
  anamnesis_filled_by?: string;
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
  });
  
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
  });

  const [regulationsData, setRegulationsData] = useState({
    termsText: '',
    regulationsText: '',
    anamnesisFilledBy: 'trainer',
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
      });
    }
    if (company) {
      setCompanyData({
        name: company.name || '',
        address: company.address || '',
      });
      fetchExtendedCompanyData(company.id);
    }
  }, [profile, company]);

  const fetchExtendedCompanyData = async (companyId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, address, registration_code, terms_text, regulations_text, anamnesis_filled_by')
      .eq('id', companyId)
      .single();

    if (data) {
      setExtendedCompany(data);
      setRegulationsData({
        termsText: data.terms_text || '',
        regulationsText: data.regulations_text || '',
        anamnesisFilledBy: data.anamnesis_filled_by || 'trainer',
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
        })
        .eq('id', company.id);

      if (error) throw error;
      toast.success('Regulamentos atualizados!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar regulamentos');
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(profileData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{profileData.fullName || 'Sem nome'}</p>
                  <p className="text-muted-foreground">{profileData.rolePosition || 'Sem cargo'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rolePosition">Cargo</Label>
                  <Input
                    id="rolePosition"
                    value={profileData.rolePosition}
                    onChange={(e) => setProfileData({ ...profileData, rolePosition: e.target.value })}
                    placeholder="Seu cargo na empresa"
                  />
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    placeholder="Nome do ginásio/academia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="Endereço completo"
                  />
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
            <CardContent className="space-y-4">
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
                  Os alunos que se registarem por este link irão preencher os seus dados e aceitar os termos automaticamente.
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
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Termos e Condições</CardTitle>
                <CardDescription>
                  Defina os termos e condições que os alunos devem aceitar.
                  Deixe em branco para usar os termos padrão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={regulationsData.termsText}
                  onChange={(e) => setRegulationsData({ ...regulationsData, termsText: e.target.value })}
                  placeholder="Escreva aqui os termos e condições da sua empresa..."
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regulamento Interno</CardTitle>
                <CardDescription>
                  Defina o regulamento interno que os alunos devem aceitar.
                  Deixe em branco para usar o regulamento padrão.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={regulationsData.regulationsText}
                  onChange={(e) => setRegulationsData({ ...regulationsData, regulationsText: e.target.value })}
                  placeholder="Escreva aqui o regulamento interno da sua empresa..."
                  className="min-h-[200px]"
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
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
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
