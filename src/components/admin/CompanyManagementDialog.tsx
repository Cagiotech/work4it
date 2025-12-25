import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Building2,
  Lock,
  Unlock,
  Key,
  History,
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  FileText,
  Settings,
  Ban,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";

interface CompanyManagementDialogProps {
  company: any;
  companyDetails: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function CompanyManagementDialog({
  company,
  companyDetails,
  open,
  onOpenChange,
  onRefresh,
}: CompanyManagementDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");
  const [isBlocking, setIsBlocking] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLogs, setActionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchActionLogs = async () => {
    if (!company?.id) return;
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('admin_company_logs')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActionLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const logAction = async (actionType: string, details: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('admin_company_logs').insert({
        company_id: company.id,
        action_type: actionType,
        action_details: details,
        performed_by: user.id,
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleBlockCompany = async () => {
    if (!blockReason.trim()) {
      toast.error("Por favor, insira um motivo para o bloqueio");
      return;
    }

    setIsBlocking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('companies')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: blockReason,
          blocked_by: user?.id,
        })
        .eq('id', company.id);

      if (error) throw error;

      await logAction('block', { reason: blockReason });
      
      toast.success("Empresa bloqueada com sucesso");
      setShowBlockDialog(false);
      setBlockReason("");
      onRefresh();
    } catch (error: any) {
      toast.error("Erro ao bloquear empresa: " + error.message);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockCompany = async () => {
    setIsBlocking(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_reason: null,
          blocked_by: null,
        })
        .eq('id', company.id);

      if (error) throw error;

      await logAction('unblock', {});
      
      toast.success("Empresa desbloqueada com sucesso");
      setShowUnblockDialog(false);
      onRefresh();
    } catch (error: any) {
      toast.error("Erro ao desbloquear empresa: " + error.message);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsResettingPassword(true);
    try {
      // Get the owner's user_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('company_id', company.id)
        .maybeSingle();

      if (profileError || !profile?.user_id) {
        throw new Error("Não foi possível encontrar o proprietário da empresa");
      }

      // Call edge function to reset password
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: profile.user_id, newPassword },
      });

      if (error) throw error;

      await logAction('password_reset', { user_id: profile.user_id });
      
      toast.success("Senha alterada com sucesso");
      setShowResetPasswordDialog(false);
      setNewPassword("");
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      // Get the owner's user_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('company_id', company.id)
        .maybeSingle();

      // Call edge function to delete company
      const { data, error } = await supabase.functions.invoke('delete-company-account', {
        body: { 
          companyId: company.id,
          userId: profile?.user_id,
        },
      });

      if (error) throw error;

      toast.success("Empresa eliminada com sucesso");
      setShowDeleteDialog(false);
      onOpenChange(false);
      onRefresh();
    } catch (error: any) {
      toast.error("Erro ao eliminar empresa: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCompanyData = async () => {
    try {
      const [
        { data: studentsData },
        { data: staffData },
        { data: transactionsData },
        { data: classesData },
      ] = await Promise.all([
        supabase.from('students').select('*').eq('company_id', company.id),
        supabase.from('staff').select('*').eq('company_id', company.id),
        supabase.from('financial_transactions').select('*').eq('company_id', company.id),
        supabase.from('classes').select('*').eq('company_id', company.id),
      ]);

      const exportData = {
        company,
        students: studentsData,
        staff: staffData,
        transactions: transactionsData,
        classes: classesData,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `company-${company.id}-export.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logAction('data_export', {});
      toast.success("Dados exportados com sucesso");
    } catch (error: any) {
      toast.error("Erro ao exportar dados: " + error.message);
    }
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      block: "Bloqueio",
      unblock: "Desbloqueio",
      password_reset: "Reset de Senha",
      data_export: "Exportação de Dados",
      subscription_change: "Alteração de Plano",
    };
    return labels[type] || type;
  };

  const getActionTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      block: <Ban className="h-4 w-4 text-red-500" />,
      unblock: <Unlock className="h-4 w-4 text-green-500" />,
      password_reset: <Key className="h-4 w-4 text-blue-500" />,
      data_export: <Download className="h-4 w-4 text-purple-500" />,
      subscription_change: <RefreshCw className="h-4 w-4 text-orange-500" />,
    };
    return icons[type] || <FileText className="h-4 w-4" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${company?.is_blocked ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                {company?.is_blocked ? (
                  <Lock className="h-8 w-8 text-red-500" />
                ) : (
                  <Building2 className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl">{company?.name || "Empresa"}</DialogTitle>
                  {company?.is_blocked && (
                    <Badge variant="destructive" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Bloqueada
                    </Badge>
                  )}
                </div>
                <DialogDescription>
                  Gestão administrativa da empresa
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            if (v === 'logs') fetchActionLogs();
          }}>
            <div className="px-6">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="info" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Informações
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Ações
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-2">
                  <History className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="p-6">
                <TabsContent value="info" className="mt-0 space-y-6">
                  {/* Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dados da Empresa</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{company?.address || "Sem endereço"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{company?.mbway_phone || "Sem telefone"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Registada em {company && new Date(company.created_at).toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{company?.registration_code}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Proprietário</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{companyDetails?.ownerName || "Desconhecido"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{companyDetails?.ownerEmail || "Email não disponível"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Subscription Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Subscrição</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {companyDetails?.subscription ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Plano</p>
                            <p className="font-semibold">{companyDetails.subscription.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Preço</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(companyDetails.subscription.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Estado</p>
                            <Badge variant={companyDetails.subscription.status === 'active' ? 'default' : 'secondary'}>
                              {companyDetails.subscription.status === 'active' ? 'Ativo' : companyDetails.subscription.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Início</p>
                            <p className="font-semibold">
                              {new Date(companyDetails.subscription.started_at).toLocaleDateString("pt-PT")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Sem plano ativo</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold">{companyDetails?.activeStudents || 0}</p>
                        <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold">{companyDetails?.activeStaff || 0}</p>
                        <p className="text-sm text-muted-foreground">Staff Ativo</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold">{companyDetails?.activeClasses || 0}</p>
                        <p className="text-sm text-muted-foreground">Aulas Ativas</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(companyDetails?.totalRevenue || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Receita Total</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Block Info */}
                  {company?.is_blocked && (
                    <Card className="border-red-500/50 bg-red-500/5">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-500 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Empresa Bloqueada
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p><strong>Motivo:</strong> {company.blocked_reason}</p>
                        <p><strong>Data:</strong> {company.blocked_at && new Date(company.blocked_at).toLocaleString("pt-PT")}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-0 space-y-4">
                  {/* Block/Unblock */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Controlo de Acesso
                      </CardTitle>
                      <CardDescription>
                        Bloquear ou desbloquear o acesso da empresa ao sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {company?.is_blocked ? (
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => setShowUnblockDialog(true)}
                        >
                          <Unlock className="h-4 w-4" />
                          Desbloquear Empresa
                        </Button>
                      ) : (
                        <Button 
                          variant="destructive" 
                          className="gap-2"
                          onClick={() => setShowBlockDialog(true)}
                        >
                          <Lock className="h-4 w-4" />
                          Bloquear Empresa
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Password Reset */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Reset de Senha
                      </CardTitle>
                      <CardDescription>
                        Alterar a senha de acesso do proprietário da empresa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => setShowResetPasswordDialog(true)}
                      >
                        <Key className="h-4 w-4" />
                        Alterar Senha
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Data Export */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Exportar Dados
                      </CardTitle>
                      <CardDescription>
                        Exportar todos os dados da empresa em formato JSON
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={exportCompanyData}
                      >
                        <Download className="h-4 w-4" />
                        Exportar Dados
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Delete Company */}
                  <Card className="border-red-500/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-500">
                        <Trash2 className="h-5 w-5" />
                        Zona Perigosa
                      </CardTitle>
                      <CardDescription>
                        Eliminar permanentemente a empresa e todos os seus dados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="destructive" 
                        className="gap-2"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar Empresa
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico de Ações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingLogs ? (
                        <p className="text-muted-foreground">A carregar...</p>
                      ) : actionLogs.length === 0 ? (
                        <p className="text-muted-foreground">Nenhuma ação registada</p>
                      ) : (
                        <div className="space-y-3">
                          {actionLogs.map((log) => (
                            <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                              {getActionTypeIcon(log.action_type)}
                              <div className="flex-1">
                                <p className="font-medium">{getActionTypeLabel(log.action_type)}</p>
                                {log.action_details?.reason && (
                                  <p className="text-sm text-muted-foreground">
                                    Motivo: {log.action_details.reason}
                                  </p>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(log.created_at).toLocaleString("pt-PT")}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Bloquear Empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá impedir que todos os utilizadores desta empresa acedam ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo do bloqueio *</Label>
              <Textarea
                id="blockReason"
                placeholder="Descreva o motivo do bloqueio..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleBlockCompany}
              disabled={isBlocking}
            >
              {isBlocking ? "A bloquear..." : "Bloquear"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-500" />
              Desbloquear Empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja desbloquear esta empresa? Os utilizadores poderão voltar a aceder ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              onClick={handleUnblockCompany}
              disabled={isBlocking}
            >
              {isBlocking ? "A desbloquear..." : "Desbloquear"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Alterar Senha do Proprietário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Insira a nova senha para o proprietário da empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              onClick={handleResetPassword}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? "A alterar..." : "Alterar Senha"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Eliminar Empresa Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-bold text-red-500">ATENÇÃO:</span> Esta ação é irreversível! 
              Todos os dados da empresa serão permanentemente eliminados, incluindo:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os alunos e seus dados</li>
                <li>Todo o staff e seus dados</li>
                <li>Todas as transações financeiras</li>
                <li>Todas as aulas e agendamentos</li>
                <li>O proprietário da empresa</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={isDeleting}
            >
              {isDeleting ? "A eliminar..." : "Eliminar Permanentemente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
