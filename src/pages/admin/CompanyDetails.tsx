import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  ArrowLeft, Building2, Users, Calendar, CreditCard, 
  MapPin, Phone, Mail, Hash, Clock, TrendingUp, UserCheck, 
  GraduationCap, Dumbbell, Receipt, AlertCircle, CheckCircle2,
  Lock, Unlock, Key, Download, Trash2, Shield, History,
  Ban, RefreshCw, FileText, Settings, Eye, BarChart3,
  Plus, Minus, CalendarX, CalendarCheck, Timer
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string | null;
  address: string | null;
  mbway_phone: string | null;
  registration_code: string | null;
  created_at: string;
  require_student_approval: boolean | null;
  is_blocked: boolean | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  has_active_subscription: boolean | null;
}

interface CompanyStats {
  activeStudents: number;
  inactiveStudents: number;
  totalStudents: number;
  activeStaff: number;
  totalStaff: number;
  totalClasses: number;
  activeClasses: number;
  totalEvents: number;
  totalRevenue: number;
  pendingPayments: number;
  recentTransactions: any[];
  staffList: any[];
  studentsList: any[];
  subscription: any;
  ownerName: string | null;
  ownerEmail: string | null;
}

interface ActionLog {
  id: string;
  action_type: string;
  action_details: any;
  created_at: string;
  performed_by: string;
}

export default function CompanyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Action dialogs
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [trialAction, setTrialAction] = useState<'extend' | 'reduce' | 'cancel' | 'activate' | 'set'>('extend');
  
  // Form states
  const [blockReason, setBlockReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [trialDays, setTrialDays] = useState("7");
  const [trialEndDate, setTrialEndDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompanyData();
      fetchActionLogs();
    }
  }, [id]);

  const fetchCompanyData = async () => {
    if (!id) return;
    setLoading(true);
    
    try {
      // Fetch company basic info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch all related data in parallel
      const [
        studentsRes,
        staffRes,
        classesRes,
        transactionsRes,
        eventsRes,
        subscriptionRes,
        profileRes
      ] = await Promise.all([
        supabase
          .from('students')
          .select('id, status, full_name, email, created_at, phone')
          .eq('company_id', id),
        supabase
          .from('staff')
          .select('id, full_name, email, position, is_active, created_at, phone')
          .eq('company_id', id),
        supabase
          .from('classes')
          .select('id, name, is_active, capacity')
          .eq('company_id', id),
        supabase
          .from('financial_transactions')
          .select('id, type, amount, status, description, created_at, payment_method')
          .eq('company_id', id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('events')
          .select('id, title, event_date')
          .eq('company_id', id),
        supabase
          .from('company_subscriptions')
          .select('*, admin_plans(*)')
          .eq('company_id', id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('full_name, user_id')
          .eq('company_id', id)
          .limit(1)
          .maybeSingle()
      ]);

      const students = studentsRes.data || [];
      const staff = staffRes.data || [];
      const transactions = transactionsRes.data || [];

      setStats({
        activeStudents: students.filter(s => s.status === 'active').length,
        inactiveStudents: students.filter(s => s.status !== 'active').length,
        totalStudents: students.length,
        studentsList: students,
        staffList: staff,
        activeStaff: staff.filter(s => s.is_active).length,
        totalStaff: staff.length,
        totalClasses: classesRes.data?.length || 0,
        activeClasses: classesRes.data?.filter(c => c.is_active).length || 0,
        totalEvents: eventsRes.data?.length || 0,
        recentTransactions: transactions,
        totalRevenue: transactions
          .filter(t => t.type === 'income' && t.status === 'paid')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        pendingPayments: transactions
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        subscription: subscriptionRes.data ? {
          name: subscriptionRes.data.admin_plans?.name,
          price: subscriptionRes.data.admin_plans?.price,
          status: subscriptionRes.data.status,
          started_at: subscriptionRes.data.started_at,
          expires_at: subscriptionRes.data.expires_at,
          billing_cycle: subscriptionRes.data.admin_plans?.billing_cycle
        } : null,
        ownerName: profileRes.data?.full_name || null,
        ownerEmail: null
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const fetchActionLogs = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('admin_company_logs')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setActionLogs(data);
    }
  };

  const logAction = async (actionType: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    await supabase.from('admin_company_logs').insert({
      company_id: id,
      action_type: actionType,
      action_details: details,
      performed_by: user.id
    });

    fetchActionLogs();
  };

  const handleBlockCompany = async () => {
    if (!id || !blockReason.trim()) {
      toast.error('Por favor, indique o motivo do bloqueio');
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_reason: blockReason
        })
        .eq('id', id);

      if (error) throw error;

      await logAction('block', { reason: blockReason });
      toast.success('Empresa bloqueada com sucesso');
      setShowBlockDialog(false);
      setBlockReason("");
      fetchCompanyData();
    } catch (error) {
      console.error('Error blocking company:', error);
      toast.error('Erro ao bloquear empresa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockCompany = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          is_blocked: false,
          blocked_at: null,
          blocked_reason: null
        })
        .eq('id', id);

      if (error) throw error;

      await logAction('unblock', {});
      toast.success('Empresa desbloqueada com sucesso');
      setShowUnblockDialog(false);
      fetchCompanyData();
    } catch (error) {
      console.error('Error unblocking company:', error);
      toast.error('Erro ao desbloquear empresa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id || !newPassword.trim()) {
      toast.error('Por favor, defina uma nova senha');
      return;
    }
    
    setActionLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('company_id', id)
        .single();

      if (!profile?.user_id) {
        throw new Error('Utilizador não encontrado');
      }

      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: profile.user_id, newPassword }
      });

      if (error) throw error;

      await logAction('password_reset', {});
      toast.success('Senha alterada com sucesso');
      setShowResetPasswordDialog(false);
      setNewPassword("");
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-company-account', {
        body: { companyId: id }
      });

      if (error) throw error;

      toast.success('Empresa eliminada com sucesso');
      navigate('/admin/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Erro ao eliminar empresa');
    } finally {
      setActionLoading(false);
    }
  };

  const exportCompanyData = async () => {
    if (!company || !stats) return;
    
    const exportData = {
      company,
      stats: {
        totalStudents: stats.totalStudents,
        totalStaff: stats.totalStaff,
        totalClasses: stats.totalClasses,
        totalRevenue: stats.totalRevenue
      },
      students: stats.studentsList,
      staff: stats.staffList,
      transactions: stats.recentTransactions,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empresa-${company.name || id}-export.json`;
    a.click();
    URL.revokeObjectURL(url);

    await logAction('data_export', {});
    toast.success('Dados exportados com sucesso');
  };

  // Trial management functions
  const handleTrialAction = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      let newTrialEndsAt: string | null = null;
      let newTrialStartedAt: string | null = company?.trial_started_at || null;
      
      const currentEnd = company?.trial_ends_at ? new Date(company.trial_ends_at) : new Date();
      const days = parseInt(trialDays) || 7;
      
      switch (trialAction) {
        case 'extend':
          newTrialEndsAt = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'reduce':
          newTrialEndsAt = new Date(currentEnd.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'cancel':
          newTrialEndsAt = new Date().toISOString(); // Set to now (expired)
          break;
        case 'activate':
          newTrialStartedAt = new Date().toISOString();
          newTrialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'set':
          if (trialEndDate) {
            newTrialEndsAt = new Date(trialEndDate).toISOString();
          }
          break;
      }
      
      const { error } = await supabase
        .from('companies')
        .update({
          trial_started_at: newTrialStartedAt,
          trial_ends_at: newTrialEndsAt
        })
        .eq('id', id);

      if (error) throw error;

      await logAction('trial_update', { 
        action: trialAction, 
        days: trialAction === 'extend' || trialAction === 'reduce' ? days : undefined,
        new_end_date: newTrialEndsAt
      });
      
      const messages: Record<string, string> = {
        extend: `Trial estendido em ${days} dias`,
        reduce: `Trial reduzido em ${days} dias`,
        cancel: 'Trial cancelado',
        activate: 'Trial de 14 dias ativado',
        set: 'Data do trial definida'
      };
      
      toast.success(messages[trialAction]);
      setShowTrialDialog(false);
      setTrialDays("7");
      setTrialEndDate("");
      fetchCompanyData();
    } catch (error) {
      console.error('Error updating trial:', error);
      toast.error('Erro ao atualizar trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          has_active_subscription: !company?.has_active_subscription
        })
        .eq('id', id);

      if (error) throw error;

      await logAction('subscription_toggle', { 
        activated: !company?.has_active_subscription 
      });
      
      toast.success(company?.has_active_subscription 
        ? 'Subscrição desativada' 
        : 'Subscrição ativada');
      fetchCompanyData();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Erro ao alterar subscrição');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      block: 'Bloqueio',
      unblock: 'Desbloqueio',
      password_reset: 'Reset de Senha',
      data_export: 'Exportação de Dados',
      delete: 'Eliminação',
      trial_update: 'Alteração de Trial',
      subscription_toggle: 'Alteração de Subscrição'
    };
    return labels[type] || type;
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'block': return <Ban className="h-4 w-4 text-red-500" />;
      case 'unblock': return <Unlock className="h-4 w-4 text-green-500" />;
      case 'password_reset': return <Key className="h-4 w-4 text-blue-500" />;
      case 'data_export': return <Download className="h-4 w-4 text-purple-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'trial_update': return <Timer className="h-4 w-4 text-orange-500" />;
      case 'subscription_toggle': return <CreditCard className="h-4 w-4 text-green-500" />;
      default: return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
        <Button onClick={() => navigate('/admin/companies')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar às Empresas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/companies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className={`p-3 rounded-xl ${company.is_blocked ? 'bg-red-500/10' : 'bg-primary/10'}`}>
            {company.is_blocked ? (
              <Lock className="h-8 w-8 text-red-500" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">{company.name || "Sem nome"}</h1>
              {company.is_blocked && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Bloqueada
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Registada em {new Date(company.created_at).toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCompanyData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          {company.is_blocked ? (
            <Button variant="outline" onClick={() => setShowUnblockDialog(true)}>
              <Unlock className="h-4 w-4 mr-2" />
              Desbloquear
            </Button>
          ) : (
            <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50" onClick={() => setShowBlockDialog(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Bloquear
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowResetPasswordDialog(true)}>
            <Key className="h-4 w-4 mr-2" />
            Reset Senha
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Block warning */}
      {company.is_blocked && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">Esta empresa está bloqueada</p>
                <p className="text-sm text-red-600 mt-1">
                  <strong>Motivo:</strong> {company.blocked_reason}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Bloqueada em {company.blocked_at && new Date(company.blocked_at).toLocaleString("pt-PT")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalStaff || 0}</p>
                <p className="text-xs text-muted-foreground">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Dumbbell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalClasses || 0}</p>
                <p className="text-xs text-muted-foreground">Aulas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground">Receita</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.pendingPayments || 0)}</p>
                <p className="text-xs text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
                <p className="text-xs text-muted-foreground">Eventos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Subscrição
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Alunos ({stats?.totalStudents || 0})
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" />
            Equipa ({stats?.totalStaff || 0})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Receipt className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Morada</p>
                      <p className="font-medium">{company.address || "Não definida"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">MB WAY</p>
                      <p className="font-medium">{company.mbway_phone || "Não definido"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Código de Registo</p>
                      <p className="font-mono text-sm">{company.registration_code}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Settings className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Aprovação de Alunos</p>
                      <p className="font-medium">
                        {company.require_student_approval ? "Obrigatória" : "Automática"}
                      </p>
                    </div>
                  </div>
                </div>

                {stats?.ownerName && (
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Proprietário</p>
                        <p className="font-medium">{stats.ownerName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Período de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.trial_ends_at ? (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm text-muted-foreground">Início</p>
                        <p className="font-medium">
                          {company.trial_started_at 
                            ? new Date(company.trial_started_at).toLocaleDateString("pt-PT")
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Fim</p>
                        <p className="font-medium">
                          {new Date(company.trial_ends_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    
                    {new Date(company.trial_ends_at) < new Date() ? (
                      <Badge variant="destructive" className="w-full justify-center py-2">
                        Período de Teste Expirado
                      </Badge>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="outline" className="w-full justify-center py-2 bg-green-500/10 text-green-600 border-green-500/20">
                          Período de Teste Ativo - {Math.ceil((new Date(company.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias restantes
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-3">Sem período de teste configurado</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTrialAction('activate');
                        setShowTrialDialog(true);
                      }}
                    >
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Ativar Trial de 14 dias
                    </Button>
                  </div>
                )}

                {/* Trial Action Buttons */}
                {company.trial_ends_at && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-green-600 border-green-600/50 hover:bg-green-50"
                      onClick={() => {
                        setTrialAction('extend');
                        setShowTrialDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Estender
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-orange-600 border-orange-600/50 hover:bg-orange-50"
                      onClick={() => {
                        setTrialAction('reduce');
                        setShowTrialDialog(true);
                      }}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Reduzir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTrialAction('set');
                        setShowTrialDialog(true);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Definir Data
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 border-red-600/50 hover:bg-red-50"
                      onClick={() => {
                        setTrialAction('cancel');
                        setShowTrialDialog(true);
                      }}
                    >
                      <CalendarX className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Subscription Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Subscrição Ativa</span>
                    <p className="text-xs text-muted-foreground">
                      {company.has_active_subscription 
                        ? "A empresa tem acesso completo" 
                        : "Empresa limitada ao período de teste"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.has_active_subscription ? (
                      <Badge className="bg-green-500">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleToggleSubscription}
                      disabled={actionLoading}
                    >
                      {company.has_active_subscription ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo Rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-green-600">{stats?.activeStudents || 0}</p>
                  <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-blue-600">{stats?.activeStaff || 0}</p>
                  <p className="text-sm text-muted-foreground">Staff Ativo</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-orange-600">{stats?.activeClasses || 0}</p>
                  <p className="text-sm text-muted-foreground">Aulas Ativas</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-purple-600">{stats?.totalEvents || 0}</p>
                  <p className="text-sm text-muted-foreground">Eventos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Detalhes da Subscrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.subscription ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.subscription.name}</p>
                        <p className="text-muted-foreground">
                          {stats.subscription.billing_cycle === 'monthly' ? 'Faturação Mensal' : 'Faturação Anual'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(stats.subscription.price)}
                      </p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        {stats.subscription.status === 'active' ? 'Ativo' : stats.subscription.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Iniciado em</p>
                        <p className="font-medium">
                          {new Date(stats.subscription.started_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    {stats.subscription.expires_at && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Expira em</p>
                          <p className="font-medium">
                            {new Date(stats.subscription.expires_at).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-medium">Sem Plano Ativo</p>
                  <p className="text-muted-foreground mt-2">
                    Esta empresa não tem nenhum plano de subscrição ativo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Alunos Registados
              </CardTitle>
              <CardDescription>
                {stats?.activeStudents || 0} ativos, {stats?.inactiveStudents || 0} inativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.studentsList && stats.studentsList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.studentsList.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? 'Ativo' : student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(student.created_at).toLocaleDateString("pt-PT")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum aluno registado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipa
              </CardTitle>
              <CardDescription>
                {stats?.activeStaff || 0} ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.staffList && stats.staffList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Desde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.staffList.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.full_name}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>{staff.position || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={staff.is_active ? 'default' : 'secondary'}>
                            {staff.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(staff.created_at).toLocaleDateString("pt-PT")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum colaborador registado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Últimas Transações
              </CardTitle>
              <CardDescription>As 20 transações mais recentes</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>
                            {tx.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell>{tx.payment_method || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              tx.status === 'paid' 
                                ? 'bg-green-500/10 text-green-600' 
                                : tx.status === 'pending'
                                ? 'bg-orange-500/10 text-orange-600'
                                : 'bg-gray-500/10 text-gray-600'
                            }
                          >
                            {tx.status === 'paid' ? 'Pago' : tx.status === 'pending' ? 'Pendente' : tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(tx.created_at).toLocaleDateString("pt-PT")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma transação registada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Ações Administrativas
              </CardTitle>
              <CardDescription>Registo de todas as ações realizadas nesta empresa</CardDescription>
            </CardHeader>
            <CardContent>
              {actionLogs.length > 0 ? (
                <div className="space-y-3">
                  {actionLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="p-2 rounded-lg bg-background">
                        {getActionIcon(log.action_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{getActionLabel(log.action_type)}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("pt-PT")}
                          </span>
                        </div>
                        {log.action_details && Object.keys(log.action_details).length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.action_details.reason && `Motivo: ${log.action_details.reason}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ação registada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-500" />
              Bloquear Empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá impedir que a empresa e todos os seus utilizadores acedam ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Motivo do bloqueio *</label>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Descreva o motivo do bloqueio..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBlockCompany}
              disabled={actionLoading || !blockReason.trim()}
            >
              {actionLoading ? "A bloquear..." : "Confirmar Bloqueio"}
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
              Esta ação irá restaurar o acesso da empresa e todos os seus utilizadores ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <Button onClick={handleUnblockCompany} disabled={actionLoading}>
              {actionLoading ? "A desbloquear..." : "Confirmar Desbloqueio"}
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
              Redefinir Senha do Proprietário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Define uma nova senha para o proprietário da empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Nova Senha *</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleResetPassword}
              disabled={actionLoading || !newPassword.trim()}
            >
              {actionLoading ? "A alterar..." : "Alterar Senha"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Empresa Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-red-600">ATENÇÃO: Esta ação é irreversível!</strong>
              <br /><br />
              Todos os dados serão permanentemente eliminados:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Dados da empresa</li>
                <li>Todos os alunos e staff</li>
                <li>Aulas e agendamentos</li>
                <li>Transações financeiras</li>
                <li>Mensagens e notificações</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={actionLoading}
            >
              {actionLoading ? "A eliminar..." : "Eliminar Permanentemente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trial Management Dialog */}
      <AlertDialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-500" />
              {trialAction === 'extend' && 'Estender Período de Teste'}
              {trialAction === 'reduce' && 'Reduzir Período de Teste'}
              {trialAction === 'cancel' && 'Cancelar Período de Teste'}
              {trialAction === 'activate' && 'Ativar Período de Teste'}
              {trialAction === 'set' && 'Definir Data do Trial'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {trialAction === 'extend' && 'Adicione dias ao período de teste atual.'}
              {trialAction === 'reduce' && 'Reduza dias do período de teste atual.'}
              {trialAction === 'cancel' && 'Isto irá expirar imediatamente o período de teste da empresa.'}
              {trialAction === 'activate' && 'Isto irá ativar um novo período de teste de 14 dias.'}
              {trialAction === 'set' && 'Defina uma data específica para o fim do trial.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {(trialAction === 'extend' || trialAction === 'reduce') && (
            <div className="py-4">
              <label className="text-sm font-medium">Número de dias</label>
              <Input
                type="number"
                min="1"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="7"
                className="mt-2"
              />
            </div>
          )}
          
          {trialAction === 'set' && (
            <div className="py-4">
              <label className="text-sm font-medium">Data de término</label>
              <Input
                type="date"
                value={trialEndDate}
                onChange={(e) => setTrialEndDate(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <Button
              variant={trialAction === 'cancel' ? 'destructive' : 'default'}
              onClick={handleTrialAction}
              disabled={actionLoading || (trialAction === 'set' && !trialEndDate)}
            >
              {actionLoading ? "A processar..." : "Confirmar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
