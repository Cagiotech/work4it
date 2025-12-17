import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  description: string | null;
  performed_by: string | null;
  performed_at: string;
  next_maintenance_date: string | null;
  cost: number;
  notes: string | null;
  status: string;
}

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: MaintenanceRecord | null;
  equipmentId: string;
  equipmentName: string;
  onSuccess: () => void;
}

export function MaintenanceDialog({ 
  open, 
  onOpenChange, 
  maintenance, 
  equipmentId, 
  equipmentName,
  onSuccess 
}: MaintenanceDialogProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    maintenance_type: "preventive",
    description: "",
    performed_by: "",
    performed_at: new Date().toISOString().split("T")[0],
    next_maintenance_date: "",
    cost: "",
    notes: "",
    status: "completed",
  });

  useEffect(() => {
    if (maintenance) {
      setFormData({
        maintenance_type: maintenance.maintenance_type || "preventive",
        description: maintenance.description || "",
        performed_by: maintenance.performed_by || "",
        performed_at: maintenance.performed_at || new Date().toISOString().split("T")[0],
        next_maintenance_date: maintenance.next_maintenance_date || "",
        cost: maintenance.cost?.toString() || "",
        notes: maintenance.notes || "",
        status: maintenance.status || "completed",
      });
    } else {
      setFormData({
        maintenance_type: "preventive",
        description: "",
        performed_by: "",
        performed_at: new Date().toISOString().split("T")[0],
        next_maintenance_date: "",
        cost: "",
        notes: "",
        status: "completed",
      });
    }
  }, [maintenance, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id || !equipmentId) return;

    setLoading(true);
    try {
      const data = {
        company_id: profile.company_id,
        equipment_id: equipmentId,
        maintenance_type: formData.maintenance_type,
        description: formData.description || null,
        performed_by: formData.performed_by || null,
        performed_at: formData.performed_at,
        next_maintenance_date: formData.next_maintenance_date || null,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes || null,
        status: formData.status,
      };

      if (maintenance) {
        const { error } = await supabase
          .from("equipment_maintenance")
          .update(data)
          .eq("id", maintenance.id);
        if (error) throw error;
        toast.success("Manutenção atualizada com sucesso");
      } else {
        const { error } = await supabase.from("equipment_maintenance").insert(data);
        if (error) throw error;
        toast.success("Manutenção registada com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving maintenance:", error);
      toast.error("Erro ao guardar manutenção");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {maintenance ? "Editar Manutenção" : "Registar Manutenção"} - {equipmentName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance_type">Tipo de Manutenção *</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventiva</SelectItem>
                  <SelectItem value="corrective">Corretiva</SelectItem>
                  <SelectItem value="inspection">Inspeção</SelectItem>
                  <SelectItem value="cleaning">Limpeza</SelectItem>
                  <SelectItem value="replacement">Substituição de Peças</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="performed_at">Data da Manutenção *</Label>
              <Input
                id="performed_at"
                type="date"
                value={formData.performed_at}
                onChange={(e) => setFormData({ ...formData, performed_at: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_maintenance_date">Próxima Manutenção</Label>
              <Input
                id="next_maintenance_date"
                type="date"
                value={formData.next_maintenance_date}
                onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="performed_by">Realizada por</Label>
              <Input
                id="performed_by"
                value={formData.performed_by}
                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                placeholder="Nome do técnico ou empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Custo (€)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Descreva o trabalho realizado"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : maintenance ? "Atualizar" : "Registar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
