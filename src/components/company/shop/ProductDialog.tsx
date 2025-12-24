import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Package, Save, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  min_stock_level: number | null;
  image_url: string | null;
  is_active: boolean;
  category_id: string | null;
  category?: Category;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSave: (data: Partial<Product>) => void;
}

export function ProductDialog({ open, onOpenChange, product, categories, onSave }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    category_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        price: product.price || 0,
        cost_price: product.cost_price || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock_level: product.min_stock_level || 5,
        category_id: product.category_id || "",
        is_active: product.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        category_id: "",
        is_active: true,
      });
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      category_id: formData.category_id || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome do Produto *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
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
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Código SKU"
              />
            </div>

            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Código de barras"
              />
            </div>

            <div className="space-y-2">
              <Label>Preço de Venda *</Label>
              <CurrencyInput
                value={formData.price}
                onChange={(value) => setFormData({ ...formData, price: value || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Preço de Custo</Label>
              <CurrencyInput
                value={formData.cost_price}
                onChange={(value) => setFormData({ ...formData, cost_price: value || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Quantidade em Stock *</Label>
              <Input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Stock Mínimo (Alerta)</Label>
              <Input
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Produto Ativo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
