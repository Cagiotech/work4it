import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Users, UserCheck, UserX, MoreVertical, Trash2, Edit, Loader2, Key, Clock, Calendar, Calculator, FileText, Palmtree, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { StaffProfileDialog } from "@/components/company/hr/StaffProfileDialog";
import { TimeTrackingSection } from "@/components/company/hr/TimeTrackingSection";
import { VacationManagementSection } from "@/components/company/hr/VacationManagementSection";
import { WorkScheduleSection } from "@/components/company/hr/WorkScheduleSection";
import { PayrollCalculationSection } from "@/components/company/hr/PayrollCalculationSection";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportStaffReport } from "@/lib/pdfExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  role_id: string | null;
  hire_date: string | null;
  is_active: boolean | null;
  user_id: string | null;
  company_id: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  color: string | null;
}

export default function HumanResources() {
  const { t } = useTranslation();
  const { company } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const fetchData = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const [staffResult, rolesResult] = await Promise.all([
        supabase
          .from('staff')
          .select('*')
          .eq('company_id', company.id)
          .order('full_name'),
        supabase
          .from('roles')
          .select('id, name, color')
          .eq('company_id', company.id)
          .order('name')
      ]);

      if (staffResult.error) throw staffResult.error;
      if (rolesResult.error) throw rolesResult.error;
      
      setStaff(staffResult.data || []);
      setRoles(rolesResult.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
  }, [staff, searchTerm]);

  const stats = useMemo(() => ({
    total: staff.length,
    active: staff.filter(s => s.is_active !== false).length,
    inactive: staff.filter(s => s.is_active === false).length,
  }), [staff]);

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return null;
    return roles.find(r => r.id === roleId);
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffToDelete.id);

      if (error) throw error;
      
      setStaff(staff.filter((s) => s.id !== staffToDelete.id));
      toast.success('Colaborador removido com sucesso!');
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || 'Erro ao remover colaborador');
    }
  };

  const openProfileDialog = (staffId: string | null) => {
    setSelectedStaffId(staffId);
    setProfileDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleExportPDF = async () => {
    await exportStaffReport(staff, stats);
    toast.success('PDF exportado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Colaboradores" value={stats.total} icon={Users} />
        <StatCard title="Ativos" value={stats.active} icon={UserCheck} />
        <StatCard title="Inativos" value={stats.inactive} icon={UserX} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-2">
            <Clock className="h-4 w-4" />
            Ponto
          </TabsTrigger>
          <TabsTrigger value="vacations" className="gap-2">
            <Palmtree className="h-4 w-4" />
            Férias/Ausências
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Calculator className="h-4 w-4" />
            Folha de Pagamento
          </TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar colaboradores..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
                <FileText className="h-4 w-4" />
                Exportar PDF
              </Button>
              {canCreate('hr') && (
                <Button className="gap-2" onClick={() => openProfileDialog(null)}>
                  <Plus className="h-4 w-4" />
                  Adicionar Colaborador
                </Button>
              )}
            </div>
          </div>

          {/* Staff List */}
          <Card>
            <CardHeader>
              <CardTitle>Equipa</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStaff.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {staff.length === 0 
                    ? "Nenhum colaborador cadastrado. Clique em 'Adicionar Colaborador' para começar."
                    : "Nenhum colaborador encontrado com a pesquisa."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStaff.map((member) => {
                    const role = getRoleName(member.role_id);
                    return (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => openProfileDialog(member.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{member.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.position || member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          {role && (
                            <Badge 
                              variant="outline" 
                              className="hidden sm:inline-flex"
                              style={{ borderColor: role.color || undefined, color: role.color || undefined }}
                            >
                              {role.name}
                            </Badge>
                          )}
                          <Badge variant={member.is_active !== false ? "default" : "secondary"}>
                            {member.is_active !== false ? "Ativo" : "Inativo"}
                          </Badge>
                          {member.user_id && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                              <Key className="h-3 w-3 mr-1" />
                              Conta
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit('hr') && (
                                <DropdownMenuItem onClick={() => openProfileDialog(member.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete('hr') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setStaffToDelete(member);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Schedules Tab */}
        <TabsContent value="schedules">
          <WorkScheduleSection />
        </TabsContent>

        {/* Time Tracking Tab */}
        <TabsContent value="time">
          <TimeTrackingSection />
        </TabsContent>

        {/* Vacations/Absences Tab */}
        <TabsContent value="vacations">
          <VacationManagementSection />
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll">
          <PayrollCalculationSection />
        </TabsContent>
      </Tabs>

      {/* Staff Profile Dialog */}
      <StaffProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        staffId={selectedStaffId}
        onSaved={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o colaborador "{staffToDelete?.full_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStaff} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
