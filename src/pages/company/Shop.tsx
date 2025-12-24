import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, Plus, Search, Package, TrendingUp, Tag, ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductDialog } from "@/components/company/shop/ProductDialog";
import { CategoryDialog } from "@/components/company/shop/CategoryDialog";
import { SaleDialog } from "@/components/company/shop/SaleDialog";
import { InventoryMovementDialog } from "@/components/company/shop/InventoryMovementDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
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
  category?: Category | null;
}

interface Student {
  id: string;
  full_name: string;
}

export default function Shop() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: "product" | "category"; id: string } | null>(null);

  useEffect(() => {
    if (company?.id) fetchData();
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [productsRes, categoriesRes, studentsRes] = await Promise.all([
        supabase.from("products").select("*, category:product_categories(*)").eq("company_id", company.id).order("name"),
        supabase.from("product_categories").select("*").eq("company_id", company.id).order("name"),
        supabase.from("students").select("id, full_name").eq("company_id", company.id).eq("status", "active"),
      ]);

      if (productsRes.data) setProducts(productsRes.data as Product[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
      if (studentsRes.data) setStudents(studentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
    return { totalProducts, lowStock, totalValue };
  }, [products]);

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (!company?.id || !data.name) return;
    try {
      if (selectedProduct) {
        const { error } = await supabase.from("products").update(data).eq("id", selectedProduct.id);
        if (error) throw error;
        toast.success("Produto atualizado");
      } else {
        const { error } = await supabase.from("products").insert([{ 
          name: data.name,
          description: data.description,
          sku: data.sku,
          barcode: data.barcode,
          price: data.price ?? 0,
          cost_price: data.cost_price,
          stock_quantity: data.stock_quantity ?? 0,
          min_stock_level: data.min_stock_level,
          image_url: data.image_url,
          is_active: data.is_active ?? true,
          category_id: data.category_id,
          company_id: company.id 
        }]);
        if (error) throw error;
        toast.success("Produto criado");
      }
      setProductDialogOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    if (!company?.id || !data.name) return;
    try {
      if (selectedCategory) {
        const { error } = await supabase.from("product_categories").update(data).eq("id", selectedCategory.id);
        if (error) throw error;
        toast.success("Categoria atualizada");
      } else {
        const { error } = await supabase.from("product_categories").insert([{ 
          name: data.name,
          description: data.description,
          color: data.color ?? '#aeca12',
          is_active: data.is_active ?? true,
          company_id: company.id 
        }]);
        if (error) throw error;
        toast.success("Categoria criada");
      }
      setCategoryDialogOpen(false);
      setSelectedCategory(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveSale = async (data: any) => {
    if (!company?.id) return;
    try {
      // Create financial transaction first
      const { data: transaction, error: txError } = await supabase.from("financial_transactions").insert({
        company_id: company.id,
        type: "income",
        description: `Venda na loja`,
        amount: data.total_amount,
        status: "paid",
        payment_method: data.payment_method,
        student_id: data.student_id,
        paid_at: new Date().toISOString(),
      }).select().single();

      if (txError) throw txError;

      // Create sale
      const { data: sale, error: saleError } = await supabase.from("sales").insert({
        company_id: company.id,
        student_id: data.student_id,
        subtotal: data.subtotal,
        discount_amount: data.discount_amount,
        total_amount: data.total_amount,
        payment_method: data.payment_method,
        notes: data.notes,
        transaction_id: transaction.id,
      }).select().single();

      if (saleError) throw saleError;

      // Create sale items and update stock
      for (const item of data.items) {
        await supabase.from("sale_items").insert({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          total_price: item.total_price,
        });

        // Update product stock
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const newQty = product.stock_quantity - item.quantity;
          await supabase.from("products").update({ stock_quantity: newQty }).eq("id", item.product_id);
          
          // Create inventory movement
          await supabase.from("inventory_movements").insert({
            company_id: company.id,
            product_id: item.product_id,
            movement_type: "sale",
            quantity: item.quantity,
            previous_quantity: product.stock_quantity,
            new_quantity: newQty,
            unit_price: item.unit_price,
            total_amount: item.total_price,
            reference_id: sale.id,
          });
        }
      }

      toast.success("Venda registada com sucesso");
      setSaleDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveInventoryMovement = async (data: any) => {
    if (!company?.id) return;
    try {
      const product = products.find(p => p.id === data.product_id);
      if (!product) return;

      let newQty = product.stock_quantity;
      if (data.movement_type === "in" || data.movement_type === "return") {
        newQty += data.quantity;
      } else if (data.movement_type === "out") {
        newQty -= data.quantity;
      } else {
        newQty = data.quantity; // adjustment
      }

      await supabase.from("products").update({ stock_quantity: newQty }).eq("id", data.product_id);
      await supabase.from("inventory_movements").insert({
        company_id: company.id,
        product_id: data.product_id,
        movement_type: data.movement_type,
        quantity: data.quantity,
        previous_quantity: product.stock_quantity,
        new_quantity: newQty,
        reason: data.reason,
      });

      toast.success("Movimento registado");
      setInventoryDialogOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const table = itemToDelete.type === "product" ? "products" : "product_categories";
      const { error } = await supabase.from(table).delete().eq("id", itemToDelete.id);
      if (error) throw error;
      toast.success(itemToDelete.type === "product" ? "Produto eliminado" : "Categoria eliminada");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total de Produtos" value={stats.totalProducts} icon={Package} />
        <StatCard title="Valor em Stock" value={`€${stats.totalValue.toFixed(2)}`} icon={TrendingUp} />
        <StatCard title="Stock Baixo" value={stats.lowStock} icon={ShoppingBag} className={stats.lowStock > 0 ? "border-l-4 border-l-warning" : ""} />
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="products" className="gap-2"><Package className="h-4 w-4" />Produtos</TabsTrigger>
            <TabsTrigger value="categories" className="gap-2"><Tag className="h-4 w-4" />Categorias</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={() => setSaleDialogOpen(true)} className="gap-2">
              <ShoppingBag className="h-4 w-4" />Nova Venda
            </Button>
          </div>
        </div>

        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar produtos..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button onClick={() => { setSelectedProduct(null); setProductDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />Adicionar Produto
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge variant="secondary" style={{ backgroundColor: product.category.color + "20", color: product.category.color }}>
                          {product.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">€{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock_quantity <= (product.min_stock_level || 5) ? "text-destructive font-bold" : ""}>
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedProduct(product); setProductDialogOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedProduct(product); setInventoryDialogOpen(true); }}>
                            <ArrowUpDown className="h-4 w-4 mr-2" />Movimento Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setItemToDelete({ type: "product", id: product.id }); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4 mr-2" />Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />Adicionar Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedCategory(category); setCategoryDialogOpen(true); }}>
                          <Edit className="h-4 w-4 mr-2" />Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setItemToDelete({ type: "category", id: category.id }); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 mr-2" />Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.description || "Sem descrição"}</p>
                  <Badge variant={category.is_active ? "default" : "secondary"} className="mt-2">
                    {category.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">Nenhuma categoria encontrada</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ProductDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} product={selectedProduct} categories={categories} onSave={handleSaveProduct} />
      <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} category={selectedCategory} onSave={handleSaveCategory} />
      <SaleDialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen} products={products.filter(p => p.is_active)} students={students} onSave={handleSaveSale} />
      <InventoryMovementDialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen} product={selectedProduct} onSave={handleSaveInventoryMovement} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Tem a certeza que deseja eliminar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
