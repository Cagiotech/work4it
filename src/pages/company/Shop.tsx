import { ShoppingBag, Plus, Search, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

const mockProducts = [
  { id: 1, name: "Proteína Whey 1kg", price: 35, stock: 24, category: "Suplementos" },
  { id: 2, name: "T-Shirt Fitness", price: 25, stock: 45, category: "Vestuário" },
  { id: 3, name: "Shaker Bottle", price: 12, stock: 60, category: "Acessórios" },
  { id: 4, name: "Luvas de Treino", price: 18, stock: 30, category: "Acessórios" },
];

export default function Shop() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Produtos" value={48} icon={Package} />
        <StatCard title="Vendas do Mês" value="€2,340" icon={TrendingUp} trend="up" trendValue="+15%" />
        <StatCard title="Stock Baixo" value={5} icon={ShoppingBag} className="border-l-4 border-l-warning" />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar produtos..." className="pl-10" /></div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Adicionar Produto</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockProducts.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center mb-3"><Package className="h-12 w-12 text-muted-foreground/30" /></div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h3 className="font-semibold">{product.name}</h3>
              <div className="flex items-center justify-between mt-2"><span className="text-lg font-bold text-primary">€{product.price}</span><span className="text-sm text-muted-foreground">Stock: {product.stock}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
