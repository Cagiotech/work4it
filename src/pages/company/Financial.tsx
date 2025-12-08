import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, Download } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockTransactions = [
  { id: 1, description: "Mensalidade - Maria Santos", amount: 45, type: "income", date: "08/12/2024", status: "paid" },
  { id: 2, description: "Mensalidade - Pedro Costa", amount: 35, type: "income", date: "07/12/2024", status: "paid" },
  { id: 3, description: "Salário - João Silva", amount: 1200, type: "expense", date: "05/12/2024", status: "paid" },
  { id: 4, description: "Mensalidade - Ana Rodrigues", amount: 45, type: "income", date: "03/12/2024", status: "pending" },
  { id: 5, description: "Material desportivo", amount: 350, type: "expense", date: "01/12/2024", status: "paid" },
];

export default function Financial() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.financial")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Receita do Mês"
            value="€12,450"
            icon={TrendingUp}
            trend="up"
            trendValue="+8%"
            className="border-l-4 border-l-success"
          />
          <StatCard
            title="Despesas do Mês"
            value="€4,320"
            icon={TrendingDown}
            trend="down"
            trendValue="-3%"
            className="border-l-4 border-l-destructive"
          />
          <StatCard
            title="Lucro Líquido"
            value="€8,130"
            icon={DollarSign}
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Pagamentos Pendentes"
            value="€675"
            icon={CreditCard}
            className="border-l-4 border-l-warning"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="invoices">Faturas</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Últimas Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Descrição</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipo</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Valor</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{tx.description}</td>
                          <td className="py-3 px-4 text-muted-foreground">{tx.date}</td>
                          <td className="py-3 px-4">
                            <Badge variant={tx.type === "income" ? "default" : "secondary"}>
                              {tx.type === "income" ? "Receita" : "Despesa"}
                            </Badge>
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                            {tx.type === "income" ? "+" : "-"}€{tx.amount}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline"
                              className={tx.status === "paid" ? "border-success text-success" : "border-warning text-warning"}
                            >
                              {tx.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Gestão de faturas em desenvolvimento...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Relatórios financeiros em desenvolvimento...
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
