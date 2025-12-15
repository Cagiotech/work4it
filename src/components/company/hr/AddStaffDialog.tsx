import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (staff: { 
    fullName: string; 
    email: string; 
    phone: string; 
    position: string;
    roleId: string | null;
    hireDate: string;
    createAccount: boolean;
  }) => void;
  isLoading?: boolean;
}

export function AddStaffDialog({ open, onOpenChange, onAdd, isLoading }: AddStaffDialogProps) {
  const { t } = useTranslation();
  const { company } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    roleId: "",
    hireDate: new Date().toISOString().split('T')[0],
  });
  const [createAccount, setCreateAccount] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!company?.id) return;
      
      const { data } = await supabase
        .from('roles')
        .select('id, name, description')
        .eq('company_id', company.id)
        .order('name');
      
      if (data) setRoles(data);
    };
    
    if (open) fetchRoles();
  }, [open, company?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ 
      ...formData, 
      roleId: formData.roleId || null,
      createAccount 
    });
    setFormData({ 
      fullName: "", 
      email: "", 
      phone: "", 
      position: "",
      roleId: "",
      hireDate: new Date().toISOString().split('T')[0],
    });
    setCreateAccount(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Colaborador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nome completo"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+351 912 345 678"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Data de Contratação</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Personal Trainer, Recepcionista"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Função (Permissões)</Label>
            <Select 
              value={formData.roleId || "__none__"} 
              onValueChange={(value) => setFormData({ ...formData, roleId: value === "__none__" ? "" : value })}
              disabled={isLoading}
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
            <p className="text-xs text-muted-foreground">
              A função define as permissões de acesso do colaborador
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="createAccount" 
              checked={createAccount}
              onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
              disabled={isLoading}
            />
            <Label 
              htmlFor="createAccount" 
              className="text-sm font-normal cursor-pointer"
            >
              Criar conta de acesso (senha temporária: 12345678)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A criar...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
