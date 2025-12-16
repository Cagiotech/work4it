import { useState, useEffect, createContext, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, CreditCard, FileText, GraduationCap, Pencil, Trash2, X, Save, ClipboardCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

import { StaffProfileTab } from "./tabs/StaffProfileTab";
import { StaffPaymentTab } from "./tabs/StaffPaymentTab";
import { StaffDocumentsTab } from "./tabs/StaffDocumentsTab";
import { StaffTrainingsTab } from "./tabs/StaffTrainingsTab";
import { StaffEvaluationsTab } from "./tabs/StaffEvaluationsTab";

// Context for save trigger
export const StaffSaveTriggerContext = createContext<{
  registerSave: (tabId: string, saveFn: () => Promise<void>) => void;
  unregisterSave: (tabId: string) => void;
}>({
  registerSave: () => {},
  unregisterSave: () => {},
});

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  role_id: string | null;
  hire_date: string | null;
  is_active: boolean;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  citizen_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  user_id: string | null;
  company_id: string;
}

interface StaffProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string | null;
  onSaved: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function StaffProfileDialog({ 
  open, 
  onOpenChange, 
  staffId, 
  onSaved,
  onDelete,
  canEdit = true,
  canDelete = true,
}: StaffProfileDialogProps) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const saveFunctionsRef = useRef<Map<string, () => Promise<void>>>(new Map());

  const registerSave = (tabId: string, saveFn: () => Promise<void>) => {
    saveFunctionsRef.current.set(tabId, saveFn);
  };

  const unregisterSave = (tabId: string) => {
    saveFunctionsRef.current.delete(tabId);
  };

  const handleSave = async () => {
    const saveFn = saveFunctionsRef.current.get(activeTab);
    if (saveFn) {
      setIsSaving(true);
      try {
        await saveFn();
      } finally {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    if (open) {
      setActiveTab("profile");
      setIsEditing(!staffId); // Auto-edit mode for new staff
      fetchRoles();
      if (staffId) {
        fetchStaffData();
      } else {
        setStaff(null);
      }
    }
  }, [open, staffId]);

  const fetchRoles = async () => {
    if (!company?.id) return;
    const { data } = await supabase
      .from('roles')
      .select('id, name, color')
      .eq('company_id', company.id)
      .order('name');
    if (data) setRoles(data);
  };

  const fetchStaffData = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single();

      if (error) throw error;
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Erro ao carregar dados do colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!staffId) return;
    
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);
      
      if (error) throw error;
      
      toast.success('Colaborador eliminado!');
      onDelete?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Erro ao eliminar colaborador');
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>
      : <Badge variant="outline" className="border-gray-500 text-gray-600">Inativo</Badge>;
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return null;
    return roles.find(r => r.id === roleId)?.name;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For new staff, show simplified creation form
  if (!staffId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  ?
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-xl">Novo Colaborador</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Preencha os dados para criar um novo colaborador
                </p>
              </div>
            </div>
          </DialogHeader>

          <StaffSaveTriggerContext.Provider value={{ registerSave, unregisterSave }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="px-6 pt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    Dados Pessoais
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamento
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[calc(90vh-200px)] px-6 py-4">
                <TabsContent value="profile" className="mt-0">
                  <StaffProfileTab
                    staff={null}
                    roles={roles}
                    canEdit={true}
                    isNewStaff={true}
                    onSaved={() => {
                      onSaved();
                      onOpenChange(false);
                    }}
                  />
                </TabsContent>

                <TabsContent value="payment" className="mt-0">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure o pagamento após criar o colaborador.</p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </StaffSaveTriggerContext.Provider>
        </DialogContent>
      </Dialog>
    );
  }

  if (!staff) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(staff.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-xl">{staff.full_name}</DialogTitle>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {getStatusBadge(staff.is_active)}
                  {staff.position && (
                    <Badge variant="secondary">{staff.position}</Badge>
                  )}
                  {getRoleName(staff.role_id) && (
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: roles.find(r => r.id === staff.role_id)?.color || undefined,
                        color: roles.find(r => r.id === staff.role_id)?.color || undefined,
                      }}
                    >
                      {getRoleName(staff.role_id)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {/* Save button for tabs that use SaveTriggerContext */}
                {canEdit && isEditing && (activeTab === "profile" || activeTab === "payment") && (
                  <Button 
                    variant="default"
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                    title="Guardar alterações"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
                {canEdit && (
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditing(!isEditing)}
                    title={isEditing ? "Cancelar edição" : "Modo de edição"}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                )}
                {canDelete && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    title="Eliminar colaborador"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <StaffSaveTriggerContext.Provider value={{ registerSave, unregisterSave }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="px-6 pt-2">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Perfil</span>
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="gap-1 text-xs sm:text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Pagamento</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Docs</span>
                  </TabsTrigger>
                  <TabsTrigger value="trainings" className="gap-1 text-xs sm:text-sm">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Formações</span>
                  </TabsTrigger>
                  <TabsTrigger value="evaluations" className="gap-1 text-xs sm:text-sm">
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Avaliações</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[calc(90vh-200px)] px-6 py-4">
                <TabsContent value="profile" className="mt-0">
                  <StaffProfileTab
                    staff={staff}
                    roles={roles}
                    canEdit={canEdit && isEditing}
                    isNewStaff={false}
                    onSaved={() => {
                      fetchStaffData();
                      onSaved();
                    }}
                  />
                </TabsContent>

                <TabsContent value="payment" className="mt-0">
                  <StaffPaymentTab
                    staffId={staff.id}
                    canEdit={canEdit && isEditing}
                  />
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <StaffDocumentsTab
                    staffId={staff.id}
                    canEdit={canEdit && isEditing}
                  />
                </TabsContent>

                <TabsContent value="trainings" className="mt-0">
                  <StaffTrainingsTab
                    staffId={staff.id}
                    canEdit={canEdit && isEditing}
                  />
                </TabsContent>

                <TabsContent value="evaluations" className="mt-0">
                  <StaffEvaluationsTab
                    staffId={staff.id}
                    canEdit={canEdit && isEditing}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </StaffSaveTriggerContext.Provider>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{staff?.full_name}"? Esta ação não pode ser desfeita e irá remover todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
