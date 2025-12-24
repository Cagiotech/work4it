import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, Save, X, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category?: { name: string; color: string } | null;
}

interface Student {
  id: string;
  full_name: string;
}

interface SaleItem {
  product_id: string;
  product: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total_price: number;
}

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  students: Student[];
  onSave: (data: {
    student_id: string | null;
    items: SaleItem[];
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    notes: string;
  }) => void;
}

export function SaleDialog({ open, onOpenChange, products, students, onSave }: SaleDialogProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [studentId, setStudentId] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!open) {
      setItems([]);
      setStudentId("");
      setDiscountAmount(0);
      setPaymentMethod("cash");
      setNotes("");
      setSearchTerm("");
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.stock_quantity > 0 && 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      if (existing.quantity < product.stock_quantity) {
        updateQuantity(product.id, existing.quantity + 1);
      }
    } else {
      setItems([...items, {
        product_id: product.id,
        product,
        quantity: 1,
        unit_price: product.price,
        discount_percent: 0,
        total_price: product.price,
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(items.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, Math.min(quantity, item.product.stock_quantity));
        const discount = item.unit_price * (item.discount_percent / 100);
        return {
          ...item,
          quantity: newQty,
          total_price: (item.unit_price - discount) * newQty,
        };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product_id !== productId));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    onSave({
      student_id: studentId || null,
      items,
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Nova Venda
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Products List */}
            <div className="flex flex-col overflow-hidden border rounded-lg">
              <div className="p-3 border-b bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addItem(product)}
                      className="p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold">€{product.price.toFixed(2)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {product.stock_quantity}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Cart */}
            <div className="flex flex-col overflow-hidden">
              <div className="space-y-3 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cliente (opcional)</Label>
                    <Select value={studentId} onValueChange={setStudentId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Método de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="mbway">MB WAY</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Carrinho vazio</p>
                    <p className="text-xs">Clique nos produtos para adicionar</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((item) => (
                      <div key={item.product_id} className="p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">€{item.unit_price.toFixed(2)}/un</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-sm w-16 text-right">€{item.total_price.toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Totals */}
              <div className="mt-3 p-3 border rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Desconto:</Label>
                  <CurrencyInput
                    value={discountAmount}
                    onChange={(v) => setDiscountAmount(v || 0)}
                    className="w-24 h-8 text-right"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">€{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3">
                <Textarea
                  placeholder="Notas (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={items.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Finalizar Venda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
