import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Users, UserCheck, UserX, MoreVertical, Trash2, Edit, Loader2, Mail, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { AddStaffDialog } from "@/components/company/hr/AddStaffDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  description: string | null;
}

export default function HumanResources() {
  const { t } = useTranslation();
  const { company } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingStaff, setAddingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    roleId: "",
    isActive: true,
  });

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
          .select('id, name, description')
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
    if (!roleId) return "Sem função";
    const role = roles.find(r => r.id === roleId);
    return role?.name || "Sem função";
  };

  const handleAddStaff = async (data: { 
    fullName: string; 
    email: string; 
    phone: string; 
    position: string;
    roleId: string | null;
    hireDate: string;
    createAccount: boolean;
  }) => {
    if (!company?.id) return;
    
    setAddingStaff(true);
    try {
      // First create the staff record
      const { data: newStaff, error } = await supabase
        .from('staff')
        .insert([{
          company_id: company.id,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone || null,
          position: data.position || null,
          role_id: data.roleId || null,
          hire_date: data.hireDate || null,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      
      // If createAccount is true and email exists, create the auth user
      if (data.createAccount && data.email) {
        const { data: accountData, error: accountError } = await supabase.functions.invoke('create-student-account', {
          body: {
            email: data.email,
            fullName: data.fullName,
            recordId: newStaff.id,
            recordType: 'staff',
          }
        });

        if (accountError) {
          console.error('Error creating account:', accountError);
          toast.error('Colaborador criado, mas erro ao criar conta: ' + accountError.message);
        } else if (accountData?.error) {
          toast.error('Colaborador criado, mas erro ao criar conta: ' + accountData.error);
        } else {
          toast.success('Colaborador adicionado com conta criada! Senha temporária: 12345678');
          setAddDialogOpen(false);
          setStaff([...staff, newStaff]);
          return;
        }
      }
      
      setStaff([...staff, newStaff]);
      setAddDialogOpen(false);
      toast.success('Colaborador adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast.error(error.message || 'Erro ao adicionar colaborador');
    } finally {
      setAddingStaff(false);
    }
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

  const openEditDialog = (member: Staff) => {
    setStaffToEdit(member);
    setEditFormData({
      fullName: member.full_name,
      email: member.email,
      phone: member.phone || "",
      position: member.position || "",
      roleId: member.role_id || "",
      isActive: member.is_active !== false,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!staffToEdit) return;
    
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          full_name: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone || null,
          position: editFormData.position || null,
          role_id: editFormData.roleId || null,
          is_active: editFormData.isActive,
        })
        .eq('id', staffToEdit.id);

      if (error) throw error;
      
      setStaff(staff.map(s => 
        s.id === staffToEdit.id 
          ? { ...s, ...editFormData, full_name: editFormData.fullName, role_id: editFormData.roleId || null, is_active: editFormData.isActive }
          : s
      ));
      toast.success('Colaborador atualizado com sucesso!');
      setEditDialogOpen(false);
      setStaffToEdit(null);
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast.error(error.message || 'Erro ao atualizar colaborador');
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
        {canCreate('hr') && (
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar Colaborador
          </Button>
        )}
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
              {filteredStaff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="hidden sm:inline-flex">
                      {getRoleName(member.role_id)}
                    </Badge>
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
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Email
                        </DropdownMenuItem>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AddStaffDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onAdd={handleAddStaff}
        isLoading={addingStaff}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Nome Completo</Label>
              <Input
                id="editFullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Telefone</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPosition">Cargo</Label>
              <Input
                id="editPosition"
                value={editFormData.position}
                onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Função (Permissões)</Label>
              <Select 
                value={editFormData.roleId || "__none__"} 
                onValueChange={(value) => setEditFormData({ ...editFormData, roleId: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma função</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select 
                value={editFormData.isActive ? "active" : "inactive"} 
                onValueChange={(value) => setEditFormData({ ...editFormData, isActive: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStaff}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{staffToDelete?.full_name}"? 
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
