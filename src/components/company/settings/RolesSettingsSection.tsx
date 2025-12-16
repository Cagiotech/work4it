import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_admin: boolean;
  is_default: boolean;
  company_id: string;
}

interface Module {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
}

interface RolePermission {
  id: string;
  role_id: string;
  module_key: string;
  action: string;
}

const colorOptions = [
  "#aeca12", "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

const actions = [
  { key: "view", label: "Ver" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Eliminar" },
  { key: "export", label: "Exportar" },
  { key: "import", label: "Importar" },
];

export function RolesSettingsSection() {
  const { profile } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    is_admin: false,
  });
  
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [editingRolePermissions, setEditingRolePermissions] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      const [rolesRes, modulesRes, permissionsRes] = await Promise.all([
        supabase.from('roles').select('*').eq('company_id', profile.company_id).order('name'),
        supabase.from('modules').select('*').order('sort_order'),
        supabase.from('role_permissions').select('*')
      ]);
      
      if (rolesRes.error) throw rolesRes.error;
      if (modulesRes.error) throw modulesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;
      
      setRoles(rolesRes.data || []);
      setModules(modulesRes.data || []);
      setPermissions(permissionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  useEffect(() => {
    if (selectedRole) {
      setRoleFormData({
        name: selectedRole.name,
        description: selectedRole.description || "",
        is_admin: selectedRole.is_admin,
      });
    } else {
      setRoleFormData({ name: "", description: "", is_admin: false });
    }
  }, [selectedRole, showRoleDialog]);

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    if (!roleFormData.name.trim()) {
      toast.error('Nome do cargo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (selectedRole) {
        const { error } = await supabase.from('roles').update({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null,
          is_admin: roleFormData.is_admin,
        }).eq('id', selectedRole.id);
        if (error) throw error;
        toast.success('Cargo atualizado');
      } else {
        const { error } = await supabase.from('roles').insert({
          company_id: profile.company_id,
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null,
          is_admin: roleFormData.is_admin,
        });
        if (error) throw error;
        toast.success('Cargo criado');
      }

      fetchData();
      setShowRoleDialog(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Erro ao guardar cargo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase.from('roles').delete().eq('id', deleteConfirm);
      if (error) throw error;
      toast.success('Cargo eliminado');
      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Erro ao eliminar cargo');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openPermissionsDialog = (role: Role) => {
    setEditingRolePermissions(role);
    
    // Build current permissions for this role
    const rolePerms = permissions.filter(p => p.role_id === role.id);
    const permMap: Record<string, string[]> = {};
    
    rolePerms.forEach(p => {
      if (!permMap[p.module_key]) {
        permMap[p.module_key] = [];
      }
      permMap[p.module_key].push(p.action);
    });
    
    setSelectedPermissions(permMap);
    setShowPermissionsDialog(true);
  };

  const togglePermission = (moduleKey: string, action: string) => {
    setSelectedPermissions(prev => {
      const current = prev[moduleKey] || [];
      if (current.includes(action)) {
        return { ...prev, [moduleKey]: current.filter(a => a !== action) };
      } else {
        return { ...prev, [moduleKey]: [...current, action] };
      }
    });
  };

  const toggleAllModulePermissions = (moduleKey: string) => {
    setSelectedPermissions(prev => {
      const current = prev[moduleKey] || [];
      if (current.length === actions.length) {
        return { ...prev, [moduleKey]: [] };
      } else {
        return { ...prev, [moduleKey]: actions.map(a => a.key) };
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!editingRolePermissions) return;

    setSaving(true);
    try {
      // Delete existing permissions for this role
      await supabase.from('role_permissions').delete().eq('role_id', editingRolePermissions.id);
      
      // Insert new permissions
      type PermissionAction = "view" | "create" | "edit" | "delete" | "export" | "import";
      const newPermissions: { role_id: string; module_key: string; action: PermissionAction }[] = [];
      Object.entries(selectedPermissions).forEach(([moduleKey, acts]) => {
        acts.forEach(action => {
          newPermissions.push({
            role_id: editingRolePermissions.id,
            module_key: moduleKey,
            action: action as PermissionAction,
          });
        });
      });
      
      if (newPermissions.length > 0) {
        const { error } = await supabase.from('role_permissions').insert(newPermissions);
        if (error) throw error;
      }
      
      toast.success('Permissões atualizadas');
      fetchData();
      setShowPermissionsDialog(false);
      setEditingRolePermissions(null);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao guardar permissões');
    } finally {
      setSaving(false);
    }
  };

  const getRolePermissionCount = (roleId: string) => {
    return permissions.filter(p => p.role_id === roleId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure os cargos e permissões dos colaboradores da sua empresa.
        </p>
        <Button onClick={() => { setSelectedRole(null); setShowRoleDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cargo criado</p>
            <Button variant="link" onClick={() => setShowRoleDialog(true)} className="mt-2">
              Criar primeiro cargo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-all group relative">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{role.name}</h3>
                      {role.is_admin && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                      {role.is_default && (
                        <Badge variant="outline" className="text-xs">Padrão</Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{role.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {getRolePermissionCount(role.id)} permissões
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => openPermissionsDialog(role)}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Permissões
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => { setSelectedRole(role); setShowRoleDialog(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteConfirm(role.id)}
                    disabled={role.is_default}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={(open) => { setShowRoleDialog(open); if (!open) setSelectedRole(null); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{selectedRole ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
            <DialogDescription>
              {selectedRole ? 'Atualize os dados do cargo.' : 'Crie um novo cargo para os colaboradores.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nome do Cargo *</Label>
              <Input
                id="roleName"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="Ex: Rececionista, Instrutor, Gerente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Descrição</Label>
              <Textarea
                id="roleDescription"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                placeholder="Descrição das responsabilidades do cargo"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={roleFormData.is_admin}
                onCheckedChange={(checked) => setRoleFormData({ ...roleFormData, is_admin: checked as boolean })}
              />
              <Label htmlFor="isAdmin" className="text-sm font-normal">
                Este cargo tem acesso total (Administrador)
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : selectedRole ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={(open) => { setShowPermissionsDialog(open); if (!open) setEditingRolePermissions(null); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões - {editingRolePermissions?.name}</DialogTitle>
            <DialogDescription>
              Configure as permissões deste cargo por módulo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{module.name}</h4>
                    {module.description && (
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllModulePermissions(module.key)}
                  >
                    {(selectedPermissions[module.key]?.length || 0) === actions.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {actions.map((action) => (
                    <label key={action.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedPermissions[module.key]?.includes(action.key) || false}
                        onCheckedChange={() => togglePermission(module.key, action.key)}
                      />
                      <span className="text-sm">{action.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar este cargo? Esta ação não pode ser desfeita. 
              Colaboradores com este cargo perderão todas as permissões associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
