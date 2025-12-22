import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [performedAtDate, setPerformedAtDate] = useState<Date | undefined>(new Date());
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date | undefined>();
  const [performedAtOpen, setPerformedAtOpen] = useState(false);
  const [nextMaintenanceOpen, setNextMaintenanceOpen] = useState(false);
  const [formData, setFormData] = useState({
    maintenance_type: "preventive",
    description: "",
    performed_by: "",
    cost: 0,
    notes: "",
    status: "completed",
  });

  const parseDate = (dateStr: string | null | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateISO = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (maintenance) {
      setFormData({
        maintenance_type: maintenance.maintenance_type || "preventive",
        description: maintenance.description || "",
        performed_by: maintenance.performed_by || "",
        cost: maintenance.cost || 0,
        notes: maintenance.notes || "",
        status: maintenance.status || "completed",
      });
      setPerformedAtDate(parseDate(maintenance.performed_at) || new Date());
      setNextMaintenanceDate(parseDate(maintenance.next_maintenance_date));
    } else {
      setFormData({
        maintenance_type: "preventive",
        description: "",
        performed_by: "",
        cost: 0,
        notes: "",
        status: "completed",
      });
      setPerformedAtDate(new Date());
      setNextMaintenanceDate(undefined);
    }
  }, [maintenance, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id || !equipmentId || !performedAtDate) return;

    setLoading(true);
    try {
      const data = {
        company_id: profile.company_id,
        equipment_id: equipmentId,
        maintenance_type: formData.maintenance_type,
        description: formData.description || null,
        performed_by: formData.performed_by || null,
        performed_at: formatDateISO(performedAtDate),
        next_maintenance_date: formatDateISO(nextMaintenanceDate) || null,
        cost: formData.cost,
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
              <Label>Data da Manutenção *</Label>
              <Popover open={performedAtOpen} onOpenChange={setPerformedAtOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !performedAtDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {performedAtDate ? format(performedAtDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={performedAtDate}
                    onSelect={(date) => {
                      setPerformedAtDate(date);
                      setPerformedAtOpen(false);
                    }}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Próxima Manutenção</Label>
              <Popover open={nextMaintenanceOpen} onOpenChange={setNextMaintenanceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !nextMaintenanceDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextMaintenanceDate ? format(nextMaintenanceDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextMaintenanceDate}
                    onSelect={(date) => {
                      setNextMaintenanceDate(date);
                      setNextMaintenanceOpen(false);
                    }}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
              <CurrencyInput
                id="cost"
                value={formData.cost}
                onChange={(val) => setFormData({ ...formData, cost: val })}
                placeholder="0,00"
                allowEmpty
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
