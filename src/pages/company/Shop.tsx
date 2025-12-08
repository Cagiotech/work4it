import { useTranslation } from "react-i18next";
import { ShoppingBag, Plus, Search, Package, TrendingUp } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

const mockProducts = [
  { id: 1, name: "Proteína Whey 1kg", price: 35, stock: 24, category: "Suplementos", image: "" },
  { id: 2, name: "T-Shirt Fitness", price: 25, stock: 45, category: "Vestuário", image: "" },
  { id: 3, name: "Shaker Bottle", price: 12, stock: 60, category: "Acessórios", image: "" },
  { id: 4, name: "Luvas de Treino", price: 18, stock: 30, category: "Acessórios", image: "" },
  { id: 5, name: "BCAA 500g", price: 28, stock: 15, category: "Suplementos", image: "" },
  { id: 6, name: "Corda de Saltar", price: 15, stock: 8, category: "Acessórios", image: "" },
];

export default function Shop() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.shop")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total de Produtos"
            value={48}
            icon={Package}
          />
          <StatCard
            title="Vendas do Mês"
            value="€2,340"
            icon={TrendingUp}
            trend="up"
            trendValue="+15%"
          />
          <StatCard
            title="Stock Baixo"
            value={5}
            icon={ShoppingBag}
            className="border-l-4 border-l-warning"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar produtos..." className="pl-10" />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-40 bg-muted/30 flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
              </div>
              <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                <h3 className="font-semibold text-foreground">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-primary">€{product.price}</span>
                  <Badge 
                    variant="outline"
                    className={product.stock < 10 ? "border-warning text-warning" : "border-success text-success"}
                  >
                    Stock: {product.stock}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
