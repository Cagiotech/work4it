import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, LayoutGrid, List, ArrowUpAZ, ArrowDownAZ, Download, Trash2, Loader2, User, Calendar, CreditCard, Clock, Upload, Users, Filter, CheckCircle, Clock as ClockIcon, X, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddStudentDialog } from "@/components/company/students/AddStudentDialog";

import { ImportStudentsDialog } from "@/components/company/students/ImportStudentsDialog";
import { StudentGroupsDialog } from "@/components/company/students/StudentGroupsDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportStudentsReport } from "@/lib/pdfExport";
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

interface Subscription {
  id: string;
  status: string | null;
  payment_status: string | null;
  start_date: string;
  end_date: string;
  plan: {
    id: string;
    name: string;
  } | null;
}

interface Trainer {
  id: string;
  full_name: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  nationality: string | null;
  nif: string | null;
  niss: string | null;
  citizen_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  health_notes: string | null;
  enrollment_date: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  company_id: string;
  personal_trainer_id: string | null;
  profile_photo_url: string | null;
  user_id: string | null;
  // Joined data
  trainer?: Trainer | null;
  activeSubscription?: Subscription | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
}

export default function Students() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { company } = useAuth();
  const { canCreate, canEdit, canDelete, canExport } = usePermissions();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingStudent, setAddingStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTrainer, setFilterTrainer] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

  const fetchStudents = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      // Fetch students with trainer info
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          trainer:staff!students_personal_trainer_id_fkey(id, full_name)
        `)
        .eq('company_id', company.id)
        .order('full_name', { ascending: sortOrder === 'asc' });

      if (studentsError) throw studentsError;

      // Fetch active subscriptions for all students
      const studentIds = studentsData?.map(s => s.id) || [];
      
      let subscriptionsMap: Record<string, Subscription> = {};
      
      if (studentIds.length > 0) {
        const { data: subscriptionsData, error: subsError } = await supabase
          .from('student_subscriptions')
          .select(`
            id,
            student_id,
            status,
            payment_status,
            start_date,
            end_date,
            plan:subscription_plans(id, name)
          `)
          .in('student_id', studentIds)
          .eq('status', 'active');

        if (subsError) {
          console.error('Error fetching subscriptions:', subsError);
        } else if (subscriptionsData) {
          subscriptionsData.forEach(sub => {
            subscriptionsMap[sub.student_id] = {
              id: sub.id,
              status: sub.status,
              payment_status: sub.payment_status,
              start_date: sub.start_date,
              end_date: sub.end_date,
              plan: sub.plan
            };
          });
        }
      }

      // Combine students with their subscriptions
      const enrichedStudents = studentsData?.map(student => ({
        ...student,
        trainer: student.trainer,
        activeSubscription: subscriptionsMap[student.id] || null
      })) || [];

      setStudents(enrichedStudents);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    if (!company?.id) return;

    try {
      // Fetch trainers (staff who can be personal trainers)
      const { data: trainersData } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('company_id', company.id)
        .eq('is_active', true);

      setTrainers(trainersData || []);

      // Fetch subscription plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .eq('company_id', company.id)
        .eq('is_active', true);

      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching filters data:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchFiltersData();
  }, [company?.id]);

  // Separate active and pending students
  const activeStudents = useMemo(() => {
    return students.filter(s => s.status !== 'pending_approval' && s.status !== 'pending');
  }, [students]);

  const pendingStudents = useMemo(() => {
    return students.filter(s => s.status === 'pending_approval' || s.status === 'pending');
  }, [students]);

  const filteredStudents = useMemo(() => {
    const baseStudents = activeTab === 'pending' ? pendingStudents : activeStudents;
    
    return baseStudents
      .filter((student) => {
        const matchesSearch = 
          student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = filterStatus === "all" || student.status === filterStatus;
        const matchesTrainer = filterTrainer === "all" || student.personal_trainer_id === filterTrainer;
        const matchesPayment = filterPaymentStatus === "all" || student.activeSubscription?.payment_status === filterPaymentStatus;
        const matchesPlan = filterPlan === "all" || student.activeSubscription?.plan?.id === filterPlan;
        
        return matchesSearch && matchesStatus && matchesTrainer && matchesPayment && matchesPlan;
      })
      .sort((a, b) => {
        const comparison = a.full_name.localeCompare(b.full_name);
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [students, searchTerm, sortOrder, filterStatus, filterTrainer, filterPaymentStatus, filterPlan, activeTab, activeStudents, pendingStudents]);

  const handleAddStudent = async (data: { name: string; email: string; phone: string; birthDate: string; createAccount: boolean }) => {
    if (!company?.id) return;
    
    setAddingStudent(true);
    try {
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([{
          company_id: company.id,
          full_name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birthDate || null,
          status: 'active',
          password_changed: !data.createAccount,
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (data.createAccount && data.email) {
        const { data: accountData, error: accountError } = await supabase.functions.invoke('create-student-account', {
          body: {
            email: data.email,
            fullName: data.name,
            recordId: newStudent.id,
            recordType: 'student',
          }
        });

        if (accountError) {
          console.error('Error creating account:', accountError);
          toast.error('Aluno criado, mas erro ao criar conta: ' + accountError.message);
        } else if (accountData?.error) {
          toast.error('Aluno criado, mas erro ao criar conta: ' + accountData.error);
        } else {
          toast.success('Aluno adicionado com conta criada! Senha temporária: 12345678');
          setAddDialogOpen(false);
          fetchStudents();
          return;
        }
      }
      
      setAddDialogOpen(false);
      fetchStudents();
      toast.success('Aluno adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Erro ao adicionar aluno');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: updatedStudent.full_name,
          email: updatedStudent.email,
          phone: updatedStudent.phone,
          birth_date: updatedStudent.birth_date,
          gender: updatedStudent.gender,
          address: updatedStudent.address,
          emergency_contact: updatedStudent.emergency_contact,
          emergency_phone: updatedStudent.emergency_phone,
          health_notes: updatedStudent.health_notes,
          status: updatedStudent.status,
        })
        .eq('id', updatedStudent.id);

      if (error) throw error;
      
      fetchStudents();
      toast.success('Aluno atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Erro ao atualizar aluno');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);

      if (error) throw error;
      
      setStudents(students.filter((s) => s.id !== studentToDelete.id));
      toast.success('Aluno excluído com sucesso!');
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.message || 'Erro ao excluir aluno');
    }
  };

  const handleExportPDF = async () => {
    const stats = {
      total: students.length,
      active: activeStudents.length,
      inactive: students.filter(s => s.status === 'inactive' || s.status === 'suspended').length,
      pending: pendingStudents.length,
    };
    await exportStudentsReport(filteredStudents, stats);
    toast.success('PDF exportado com sucesso!');
  };

  const handleStudentClick = (student: Student) => {
    navigate(`/company/students/${student.id}`);
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleApproveStudent = async (student: Student) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'active' })
        .eq('id', student.id);

      if (error) throw error;
      
      toast.success(`${student.full_name} foi aprovado!`);
      fetchStudents();
    } catch (error: any) {
      console.error('Error approving student:', error);
      toast.error('Erro ao aprovar aluno');
    }
  };

  const handleRejectStudent = async (student: Student) => {
    try {
      // Delete the student record and associated auth user could be done here
      // For now, just delete the student record
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;
      
      toast.success(`Registo de ${student.full_name} foi rejeitado.`);
      fetchStudents();
    } catch (error: any) {
      console.error('Error rejecting student:', error);
      toast.error('Erro ao rejeitar aluno');
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-600">Suspenso</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string | null | undefined) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Em dia</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">Sem plano</Badge>;
    }
  };

  const getDaysUntilExpiry = (endDate: string | undefined) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (endDate: string | undefined) => {
    const days = getDaysUntilExpiry(endDate);
    if (days === null) return null;
    
    if (days < 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{days}d restantes</Badge>;
    } else if (days <= 30) {
      return <Badge variant="secondary">{days}d restantes</Badge>;
    }
    return null;
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterTrainer("all");
    setFilterPaymentStatus("all");
    setFilterPlan("all");
    setSearchTerm("");
  };

  const hasActiveFilters = filterStatus !== "all" || filterTrainer !== "all" || filterPaymentStatus !== "all" || filterPlan !== "all" || searchTerm !== "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.students")}</h1>
          <p className="text-muted-foreground text-sm">{activeStudents.length} ativos • {pendingStudents.length} pendentes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setGroupsDialogOpen(true)}>
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Grupos</span>
          </Button>
          {canExport('students') && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPDF}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          )}
          {canCreate('students') && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("students.addStudent")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs for Active/Pending */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'pending')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="h-9">
            <TabsTrigger value="active" className="gap-1.5 px-3">
              <CheckCircle className="h-3.5 w-3.5" />
              Ativos
              {activeStudents.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5">{activeStudents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5 px-3">
              <ClockIcon className="h-3.5 w-3.5" />
              Pendentes
              {pendingStudents.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5">{pendingStudents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search and Controls */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && <Badge variant="secondary" className="text-xs px-1">!</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="end">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Pagamento</label>
                    <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">Em dia</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Personal</label>
                    <Select value={filterTrainer} onValueChange={setFilterTrainer}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {trainers.map(trainer => (
                          <SelectItem key={trainer.id} value={trainer.id}>{trainer.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Plano</label>
                    <Select value={filterPlan} onValueChange={setFilterPlan}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="active" className="mt-0" />
        <TabsContent value="pending" className="mt-0" />
      </Tabs>

      {/* Students Display */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {students.length === 0 
                ? "Nenhum aluno cadastrado ainda. Clique em 'Adicionar Aluno' para começar."
                : "Nenhum aluno encontrado com os filtros aplicados."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${activeTab === 'pending' ? 'border-amber-500/50' : ''}`}
              onClick={() => activeTab !== 'pending' && handleStudentClick(student)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    {student.profile_photo_url && (
                      <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(student.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{student.full_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{student.email || 'Sem email'}</p>
                  </div>
                </div>

                {activeTab === 'pending' ? (
                  <>
                    {/* Pending Status Info */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        {student.status === 'pending_approval' ? 'Aguarda Aprovação' : 'A completar perfil'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Registado em: {new Date(student.created_at).toLocaleDateString('pt-BR')}</p>
                      {student.phone && <p>Telefone: {student.phone}</p>}
                    </div>

                    {/* Action Buttons */}
                    {student.status === 'pending_approval' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveStudent(student);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectStudent(student);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Status and Payment Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(student.status)}
                      {getPaymentStatusBadge(student.activeSubscription?.payment_status)}
                      {getExpiryBadge(student.activeSubscription?.end_date)}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {/* Trainer */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate">{student.trainer?.full_name || 'Sem PT'}</span>
                      </div>

                      {/* Plan */}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="truncate">{student.activeSubscription?.plan?.name || 'Sem plano'}</span>
                      </div>

                      {/* Last Activity */}
                      <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="truncate">
                          Atualizado: {new Date(student.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Personal Trainer</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Expira</TableHead>
                {canDelete('students') && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => handleStudentClick(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        {student.profile_photo_url && (
                          <AvatarImage src={student.profile_photo_url} alt={student.full_name} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(student.activeSubscription?.payment_status)}</TableCell>
                  <TableCell>{student.trainer?.full_name || '-'}</TableCell>
                  <TableCell>{student.activeSubscription?.plan?.name || '-'}</TableCell>
                  <TableCell>
                    {student.activeSubscription?.end_date 
                      ? new Date(student.activeSubscription.end_date).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  {canDelete('students') && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(student);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialogs */}
      <AddStudentDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onAdd={handleAddStudent}
        isLoading={addingStudent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno "{studentToDelete?.full_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Students Dialog */}
      {company?.id && (
        <ImportStudentsDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          companyId={company.id}
          onSuccess={fetchStudents}
        />
      )}

      {/* Student Groups Dialog */}
      {company?.id && (
        <StudentGroupsDialog
          open={groupsDialogOpen}
          onOpenChange={setGroupsDialogOpen}
          companyId={company.id}
          students={students.map(s => ({ id: s.id, full_name: s.full_name, email: s.email }))}
        />
      )}
    </div>
  );
}
