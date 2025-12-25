import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Users, Building2, Settings, Calendar, CreditCard, 
  MapPin, Phone, Mail, Hash, Clock, TrendingUp, UserCheck, 
  GraduationCap, Dumbbell, Receipt, AlertCircle, CheckCircle2,
  X, ExternalLink, Lock, MoreVertical
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminCompanies, useAdminPlans } from "@/hooks/useAdminData";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { CompanyManagementDialog } from "@/components/admin/CompanyManagementDialog";

interface CompanyDetails {
  id: string;
  name: string | null;
  address: string | null;
  mbway_phone: string | null;
  registration_code: string | null;
  created_at: string;
  require_student_approval: boolean | null;
  studentCount: number;
  staffCount: number;
  subscription?: {
    name: string;
    price: number;
    status: string;
    started_at: string;
    expires_at: string | null;
  } | null;
  // Additional detailed info
  activeStudents?: number;
  inactiveStudents?: number;
  totalClasses?: number;
  totalRevenue?: number;
  pendingPayments?: number;
  totalEvents?: number;
  recentTransactions?: any[];
  staffList?: any[];
  ownerEmail?: string;
}

export default function AdminCompanies() {
  const { data: companies, isLoading, refetch } = useAdminCompanies();
  const { data: plans } = useAdminPlans();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [showManagementDialog, setShowManagementDialog] = useState(false);

  const filteredCompanies = companies?.filter((company) => {
    const matchesSearch = (company.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "all" || company.subscription?.name === filterPlan;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "blocked" && company.is_blocked) ||
      (filterStatus === "active" && !company.is_blocked);
    return matchesSearch && matchesPlan && matchesStatus;
  }) || [];

  // Calculate stats
  const totalCompanies = companies?.length || 0;
  const companiesWithPlan = companies?.filter(c => c.subscription).length || 0;
  const totalRevenue = companies?.reduce((sum, c) => sum + (c.subscription?.price || 0), 0) || 0;
  const totalStudents = companies?.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 0;

  const handleCompanyClick = async (company: any) => {
    setSelectedCompany(company);
    setLoadingDetails(true);
    
    try {
      // Fetch additional details
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
          .select('id, status, full_name, email, created_at')
          .eq('company_id', company.id),
        supabase
          .from('staff')
          .select('id, full_name, email, position, is_active, created_at')
          .eq('company_id', company.id),
        supabase
          .from('classes')
          .select('id, name, is_active')
          .eq('company_id', company.id),
        supabase
          .from('financial_transactions')
          .select('id, type, amount, status, description, created_at')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('events')
          .select('id')
          .eq('company_id', company.id),
        supabase
          .from('company_subscriptions')
          .select('*, admin_plans(*)')
          .eq('company_id', company.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('full_name, user_id')
          .eq('company_id', company.id)
          .limit(1)
          .maybeSingle()
      ]);

      const students = studentsRes.data || [];
      const staff = staffRes.data || [];
      const transactions = transactionsRes.data || [];

      // Get owner email
      let ownerEmail = null;
      if (profileRes.data?.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(profileRes.data.user_id).catch(() => ({ data: null }));
        ownerEmail = userData?.user?.email || null;
      }

      setCompanyDetails({
        activeStudents: students.filter(s => s.status === 'active').length,
        inactiveStudents: students.filter(s => s.status !== 'active').length,
        studentsList: students,
        staffList: staff,
        activeStaff: staff.filter(s => s.is_active).length,
        totalClasses: classesRes.data?.length || 0,
        activeClasses: classesRes.data?.filter(c => c.is_active).length || 0,
        totalEvents: eventsRes.data?.length || 0,
        recentTransactions: transactions,
        totalRevenue: transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((sum, t) => sum + Number(t.amount), 0),
        pendingPayments: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0),
        subscription: subscriptionRes.data ? {
          name: subscriptionRes.data.admin_plans?.name,
          price: subscriptionRes.data.admin_plans?.price,
          status: subscriptionRes.data.status,
          started_at: subscriptionRes.data.started_at,
          expires_at: subscriptionRes.data.expires_at,
          billing_cycle: subscriptionRes.data.admin_plans?.billing_cycle
        } : null,
        ownerName: profileRes.data?.full_name,
        ownerEmail
      });
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir as empresas registadas no sistema</p>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir as empresas registadas no sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Plano Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{companiesWithPlan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar empresas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="blocked">Bloqueadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterPlan !== "all" ? "Nenhuma empresa encontrada" : "Nenhuma empresa registada"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || filterPlan !== "all" ? "Tente ajustar os filtros" : "As empresas aparecerão aqui quando se registarem"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card 
              key={company.id} 
              className={`hover:shadow-md transition-all cursor-pointer hover:border-primary/50 ${company.is_blocked ? 'border-red-500/50 bg-red-500/5' : ''}`}
              onClick={() => handleCompanyClick(company)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${company.is_blocked ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                      {company.is_blocked ? (
                        <Lock className="h-5 w-5 text-red-500" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{company.name || "Sem nome"}</CardTitle>
                      <CardDescription>
                        Desde {new Date(company.created_at).toLocaleDateString("pt-PT")}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleCompanyClick(company);
                        setShowManagementDialog(true);
                      }}>
                        <Settings className="h-4 w-4 mr-2" />
                        Gerir Empresa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {company.is_blocked && (
                    <Badge variant="destructive" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Bloqueada
                    </Badge>
                  )}
                  {company.subscription ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {company.subscription.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sem Plano</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.studentCount} alunos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.staffCount} staff</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Mensalidade</span>
                  <span className="font-bold text-green-600">
                    {company.subscription ? formatCurrency(company.subscription.price) : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Details Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{selectedCompany?.name || "Empresa"}</DialogTitle>
                <p className="text-muted-foreground mt-1">
                  Registada em {selectedCompany && new Date(selectedCompany.created_at).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>
          </DialogHeader>

          {loadingDetails ? (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
              <Skeleton className="h-40" />
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{companyDetails?.activeStudents || 0}</p>
                          <p className="text-xs text-muted-foreground">Alunos Ativos</p>
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
                          <p className="text-2xl font-bold">{companyDetails?.activeStaff || 0}</p>
                          <p className="text-xs text-muted-foreground">Staff Ativo</p>
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
                          <p className="text-2xl font-bold">{formatCurrency(companyDetails?.totalRevenue || 0)}</p>
                          <p className="text-xs text-muted-foreground">Receita Total</p>
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
                          <p className="text-2xl font-bold">{companyDetails?.activeClasses || 0}</p>
                          <p className="text-xs text-muted-foreground">Aulas Ativas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="subscription">Subscrição</TabsTrigger>
                    <TabsTrigger value="staff">Equipa ({companyDetails?.staffList?.length || 0})</TabsTrigger>
                    <TabsTrigger value="transactions">Transações</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-4 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Dados da Empresa</CardTitle>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Morada</p>
                              <p className="font-medium">{selectedCompany?.address || "Não definida"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">MB WAY</p>
                              <p className="font-medium">{selectedCompany?.mbway_phone || "Não definido"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Código de Registo</p>
                              <p className="font-mono text-sm">{selectedCompany?.registration_code}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Proprietário</p>
                              <p className="font-medium">{companyDetails?.ownerName || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Registada em</p>
                              <p className="font-medium">
                                {selectedCompany && new Date(selectedCompany.created_at).toLocaleDateString("pt-PT")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Aprovação de Alunos</p>
                              <p className="font-medium">
                                {selectedCompany?.require_student_approval ? "Obrigatória" : "Automática"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Alunos</p>
                              <p className="text-2xl font-bold">{selectedCompany?.studentCount || 0}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-600">{companyDetails?.activeStudents || 0} ativos</p>
                              <p className="text-xs text-muted-foreground">{companyDetails?.inactiveStudents || 0} inativos</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Aulas</p>
                              <p className="text-2xl font-bold">{companyDetails?.totalClasses || 0}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-600">{companyDetails?.activeClasses || 0} ativas</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Eventos</p>
                              <p className="text-2xl font-bold">{companyDetails?.totalEvents || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="subscription" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Detalhes da Subscrição
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {companyDetails?.subscription ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg">{companyDetails.subscription.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {companyDetails.subscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
                                  {formatCurrency(companyDetails.subscription.price)}
                                </p>
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  {companyDetails.subscription.status === 'active' ? 'Ativo' : companyDetails.subscription.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Iniciado em</p>
                                  <p className="font-medium">
                                    {new Date(companyDetails.subscription.started_at).toLocaleDateString("pt-PT")}
                                  </p>
                                </div>
                              </div>
                              {companyDetails.subscription.expires_at && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Expira em</p>
                                    <p className="font-medium">
                                      {new Date(companyDetails.subscription.expires_at).toLocaleDateString("pt-PT")}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="font-medium">Sem Plano Ativo</p>
                            <p className="text-sm text-muted-foreground">Esta empresa não tem nenhum plano de subscrição ativo.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {companyDetails?.pendingPayments > 0 && (
                      <Card className="mt-4 border-orange-500/50 bg-orange-500/5">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="font-medium text-orange-700">Pagamentos Pendentes</p>
                              <p className="text-sm text-orange-600">
                                Esta empresa tem {formatCurrency(companyDetails.pendingPayments)} em pagamentos pendentes.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="staff" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Equipa</CardTitle>
                        <CardDescription>Colaboradores registados nesta empresa</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {companyDetails?.staffList?.length > 0 ? (
                          <div className="space-y-2">
                            {companyDetails.staffList.map((staff: any) => (
                              <div 
                                key={staff.id} 
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="font-medium text-primary">
                                      {staff.full_name?.charAt(0) || "?"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{staff.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{staff.email}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline">{staff.position || "Staff"}</Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {staff.is_active ? "Ativo" : "Inativo"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhum colaborador registado
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="transactions" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          Últimas Transações
                        </CardTitle>
                        <CardDescription>As 10 transações mais recentes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {companyDetails?.recentTransactions?.length > 0 ? (
                          <div className="space-y-2">
                            {companyDetails.recentTransactions.map((tx: any) => (
                              <div 
                                key={tx.id} 
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    {tx.type === 'income' ? (
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{tx.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(tx.created_at).toLocaleDateString("pt-PT")}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                  </p>
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
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            Nenhuma transação registada
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Company Management Dialog */}
      <CompanyManagementDialog
        company={selectedCompany}
        companyDetails={companyDetails}
        open={showManagementDialog}
        onOpenChange={setShowManagementDialog}
        onRefresh={() => {
          refetch();
          if (selectedCompany) handleCompanyClick(selectedCompany);
        }}
      />
    </div>
  );
}