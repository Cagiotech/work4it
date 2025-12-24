import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Save, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

interface InventoryMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (data: {
    product_id: string;
    movement_type: string;
    quantity: number;
    reason: string;
  }) => void;
}

export function InventoryMovementDialog({ open, onOpenChange, product, onSave }: InventoryMovementDialogProps) {
  const [formData, setFormData] = useState({
    movement_type: "in",
    quantity: 1,
    reason: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        movement_type: "in",
        quantity: 1,
        reason: "",
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    onSave({
      product_id: product.id,
      movement_type: formData.movement_type,
      quantity: formData.quantity,
      reason: formData.reason,
    });
  };

  const maxOutQuantity = product?.stock_quantity || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Movimento de Stock
          </DialogTitle>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">Stock atual: {product.stock_quantity} unidades</p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Movimento *</Label>
              <Select
                value={formData.movement_type}
                onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                max={formData.movement_type === "out" ? maxOutQuantity : undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
              {formData.movement_type === "out" && (
                <p className="text-xs text-muted-foreground">Máximo disponível: {maxOutQuantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Descreva o motivo do movimento..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Registar Movimento
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
