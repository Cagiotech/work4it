import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  color: string | null;
  is_admin: boolean | null;
  is_default: boolean | null;
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
    color: "#aeca12",
    is_admin: false,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      const [rolesRes, modulesRes, permissionsRes] = await Promise.all([
        supabase.from('roles').select('id, name, description, color, is_admin, is_default, company_id').eq('company_id', profile.company_id).order('name'),
        supabase.from('modules').select('*').order('sort_order'),
        supabase.from('role_permissions').select('*')
      ]);
      
      if (rolesRes.error) throw rolesRes.error;
      if (modulesRes.error) throw modulesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;
      
      setRoles((rolesRes.data || []) as Role[]);
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

  const openRoleDialog = (role: Role | null) => {
    setSelectedRole(role);
    
    if (role) {
      setRoleFormData({
        name: role.name,
        description: role.description || "",
        color: role.color || "#aeca12",
        is_admin: role.is_admin,
      });
      
      // Load existing permissions for this role
      const rolePerms = permissions.filter(p => p.role_id === role.id);
      const permMap: Record<string, string[]> = {};
      rolePerms.forEach(p => {
        if (!permMap[p.module_key]) {
          permMap[p.module_key] = [];
        }
        permMap[p.module_key].push(p.action);
      });
      setSelectedPermissions(permMap);
    } else {
      setRoleFormData({ name: "", description: "", color: "#aeca12", is_admin: false });
      setSelectedPermissions({});
    }
    
    setShowRoleDialog(true);
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

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    if (!roleFormData.name.trim()) {
      toast.error('Nome do cargo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      let roleId = selectedRole?.id;

      if (selectedRole) {
        // Update existing role
        const { error } = await supabase.from('roles').update({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null,
          color: roleFormData.color,
          is_admin: roleFormData.is_admin,
        }).eq('id', selectedRole.id);
        if (error) throw error;
      } else {
        // Create new role
        const { data, error } = await supabase.from('roles').insert({
          company_id: profile.company_id,
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null,
          color: roleFormData.color,
          is_admin: roleFormData.is_admin,
        }).select().single();
        if (error) throw error;
        roleId = data.id;
      }

      // Save permissions
      if (roleId) {
        // Delete existing permissions
        await supabase.from('role_permissions').delete().eq('role_id', roleId);
        
        // Insert new permissions
        type PermissionAction = "view" | "create" | "edit" | "delete" | "export" | "import";
        const newPermissions: { role_id: string; module_key: string; action: PermissionAction }[] = [];
        Object.entries(selectedPermissions).forEach(([moduleKey, acts]) => {
          acts.forEach(action => {
            newPermissions.push({
              role_id: roleId!,
              module_key: moduleKey,
              action: action as PermissionAction,
            });
          });
        });
        
        if (newPermissions.length > 0) {
          const { error } = await supabase.from('role_permissions').insert(newPermissions);
          if (error) throw error;
        }
      }

      toast.success(selectedRole ? 'Cargo atualizado' : 'Cargo criado');
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
        <Button onClick={() => openRoleDialog(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cargo criado</p>
            <Button variant="link" onClick={() => openRoleDialog(null)} className="mt-2">
              Criar primeiro cargo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-all group relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{ backgroundColor: role.color || '#aeca12' }} 
              />
              <CardContent className="p-4 pt-5">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${role.color || '#aeca12'}20` }}
                  >
                    <Shield className="h-5 w-5" style={{ color: role.color || '#aeca12' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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
                    onClick={() => openRoleDialog(role)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
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

      {/* Role Dialog with Color and Permissions */}
      <Dialog open={showRoleDialog} onOpenChange={(open) => { setShowRoleDialog(open); if (!open) setSelectedRole(null); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedRole ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
            <DialogDescription>
              {selectedRole ? 'Atualize os dados e permissões do cargo.' : 'Crie um novo cargo com nome, cor e permissões.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 max-h-[60vh] pr-4">
              <div className="space-y-6 pb-4 pr-2">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleName">Nome do Cargo *</Label>
                    <Input
                      id="roleName"
                      value={roleFormData.name}
                      onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                      placeholder="Ex: Rececionista, Instrutor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={roleFormData.color}
                        onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent"
                      />
                      <Input
                        value={roleFormData.color}
                        onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        placeholder="#aeca12"
                        className="w-28 font-mono text-sm"
                      />
                      <div
                        className="w-10 h-10 rounded-md border border-border"
                        style={{ backgroundColor: roleFormData.color }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Descrição</Label>
                  <Textarea
                    id="roleDescription"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    placeholder="Descrição das responsabilidades do cargo"
                    rows={2}
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

                {/* Permissions */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Permissões por Módulo</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione as ações permitidas para cada módulo do sistema.
                  </p>
                  
                  {modules.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum módulo configurado no sistema.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {modules.map((module) => (
                        <div key={module.key} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{module.name}</h4>
                              {module.description && (
                                <p className="text-xs text-muted-foreground">{module.description}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => toggleAllModulePermissions(module.key)}
                            >
                              {(selectedPermissions[module.key]?.length || 0) === actions.length ? 'Desmarcar' : 'Marcar Todos'}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {actions.map((action) => (
                              <label key={action.key} className="flex items-center gap-1.5 cursor-pointer">
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
                  )}
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : selectedRole ? 'Salvar Alterações' : 'Criar Cargo'}
              </Button>
            </DialogFooter>
          </form>
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
