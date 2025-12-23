import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EquipmentCategory {
  id: string;
  name: string;
  color: string;
}

interface BulkEquipmentItem {
  id: string;
  name: string;
  quantity: number;
  category_id: string;
  location: string;
}

interface BulkEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: EquipmentCategory[];
  onSave: (items: BulkEquipmentItem[]) => Promise<void>;
}

export function BulkEquipmentDialog({
  open,
  onOpenChange,
  categories,
  onSave,
}: BulkEquipmentDialogProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<BulkEquipmentItem[]>([
    { id: crypto.randomUUID(), name: "", quantity: 1, category_id: "", location: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), name: "", quantity: 1, category_id: "", location: "" },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof BulkEquipmentItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    const validItems = items.filter((item) => item.name.trim() !== "");
    if (validItems.length === 0) return;

    setLoading(true);
    try {
      await onSave(validItems);
      setItems([{ id: crypto.randomUUID(), name: "", quantity: 1, category_id: "", location: "" }]);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Adicionar Vários Equipamentos
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30"
              >
                <div className="col-span-4">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    placeholder="Nome do equipamento"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Quantidade</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={item.category_id}
                    onValueChange={(value) => updateItem(item.id, "category_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
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
                <div className="col-span-2">
                  <Label className="text-xs">Localização</Label>
                  <Input
                    placeholder="Local"
                    value={item.location}
                    onChange={(e) => updateItem(item.id, "location", e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Linha
        </Button>

        <DialogFooter className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total: {totalItems} equipamento(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "A guardar..." : "Guardar Todos"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
