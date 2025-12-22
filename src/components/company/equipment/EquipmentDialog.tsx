import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

interface EquipmentCategory {
  id: string;
  name: string;
  color: string;
}

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  status: string;
  purchase_date: string | null;
  purchase_value: number;
  current_value: number;
  warranty_expiry: string | null;
  location: string | null;
  notes: string | null;
  category_id: string | null;
}

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  categories: EquipmentCategory[];
  onSuccess: () => void;
}

export function EquipmentDialog({ open, onOpenChange, equipment, categories, onSuccess }: EquipmentDialogProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Date states
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [warrantyExpiry, setWarrantyExpiry] = useState<Date | undefined>();
  const [purchaseDateOpen, setPurchaseDateOpen] = useState(false);
  const [warrantyExpiryOpen, setWarrantyExpiryOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "",
    model: "",
    serial_number: "",
    status: "operational",
    purchase_value: 0,
    current_value: 0,
    location: "",
    notes: "",
    category_id: "",
  });

  const parseDate = (dateStr: string | null | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateISO = (date: Date | undefined): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || "",
        description: equipment.description || "",
        brand: equipment.brand || "",
        model: equipment.model || "",
        serial_number: equipment.serial_number || "",
        status: equipment.status || "operational",
        purchase_value: equipment.purchase_value || 0,
        current_value: equipment.current_value || 0,
        location: equipment.location || "",
        notes: equipment.notes || "",
        category_id: equipment.category_id || "",
      });
      setPurchaseDate(parseDate(equipment.purchase_date));
      setWarrantyExpiry(parseDate(equipment.warranty_expiry));
    } else {
      setFormData({
        name: "",
        description: "",
        brand: "",
        model: "",
        serial_number: "",
        status: "operational",
        purchase_value: 0,
        current_value: 0,
        location: "",
        notes: "",
        category_id: "",
      });
      setPurchaseDate(undefined);
      setWarrantyExpiry(undefined);
    }
  }, [equipment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      const data = {
        company_id: profile.company_id,
        name: formData.name,
        description: formData.description || null,
        brand: formData.brand || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        status: formData.status,
        purchase_date: formatDateISO(purchaseDate),
        purchase_value: formData.purchase_value,
        current_value: formData.current_value,
        warranty_expiry: formatDateISO(warrantyExpiry),
        location: formData.location || null,
        notes: formData.notes || null,
        category_id: formData.category_id || null,
      };

      if (equipment) {
        const { error } = await supabase
          .from("equipment")
          .update(data)
          .eq("id", equipment.id);
        if (error) throw error;
        toast.success("Equipamento atualizado com sucesso");
      } else {
        const { error } = await supabase.from("equipment").insert(data);
        if (error) throw error;
        toast.success("Equipamento adicionado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast.error("Erro ao guardar equipamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipment ? "Editar Equipamento" : "Adicionar Equipamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Número de Série</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
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
                  <SelectItem value="operational">Operacional</SelectItem>
                  <SelectItem value="maintenance">Em Manutenção</SelectItem>
                  <SelectItem value="broken">Avariado</SelectItem>
                  <SelectItem value="retired">Aposentado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Compra</Label>
              <Popover open={purchaseDateOpen} onOpenChange={setPurchaseDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn("w-full justify-start text-left font-normal", !purchaseDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={(date) => {
                      setPurchaseDate(date);
                      setPurchaseDateOpen(false);
                    }}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_value">Valor de Compra (€)</Label>
              <CurrencyInput
                id="purchase_value"
                value={formData.purchase_value}
                onChange={(val) => setFormData({ ...formData, purchase_value: val })}
                placeholder="0,00"
                allowEmpty
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_value">Valor Atual (€)</Label>
              <CurrencyInput
                id="current_value"
                value={formData.current_value}
                onChange={(val) => setFormData({ ...formData, current_value: val })}
                placeholder="0,00"
                allowEmpty
              />
            </div>
            <div className="space-y-2">
              <Label>Garantia até</Label>
              <Popover open={warrantyExpiryOpen} onOpenChange={setWarrantyExpiryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn("w-full justify-start text-left font-normal", !warrantyExpiry && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {warrantyExpiry ? format(warrantyExpiry, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={warrantyExpiry}
                    onSelect={(date) => {
                      setWarrantyExpiry(date);
                      setWarrantyExpiryOpen(false);
                    }}
                    locale={pt}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Sala de Musculação, Zona Cardio"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
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
              {loading ? "A guardar..." : equipment ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
