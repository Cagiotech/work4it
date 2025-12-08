import { useTranslation } from "react-i18next";
import { CreditCard, Receipt, Download, CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const currentPlan = {
  name: "Plano Premium",
  price: 45,
  nextPayment: "01 Janeiro 2025",
  status: "active",
  features: ["Acesso ilimitado ao ginásio", "Personal Trainer incluído", "Aulas de grupo", "Plano nutricional", "App exclusiva"]
};

const paymentHistory = [
  { id: 1, description: "Mensalidade Dezembro", amount: 45, date: "01/12/2024", status: "paid", method: "Multibanco" },
  { id: 2, description: "Mensalidade Novembro", amount: 45, date: "01/11/2024", status: "paid", method: "Cartão" },
  { id: 3, description: "Mensalidade Outubro", amount: 45, date: "01/10/2024", status: "paid", method: "Cartão" },
  { id: 4, description: "Mensalidade Setembro", amount: 45, date: "01/09/2024", status: "paid", method: "Multibanco" },
  { id: 5, description: "Suplemento - Proteína", amount: 35, date: "15/11/2024", status: "paid", method: "Cartão" },
];

const invoices = [
  { id: "FT-2024/0089", date: "01/12/2024", amount: 45, status: "emitida" },
  { id: "FT-2024/0076", date: "01/11/2024", amount: 45, status: "emitida" },
  { id: "FT-2024/0065", date: "01/10/2024", amount: 45, status: "emitida" },
];

export default function Payments() {
  const { t } = useTranslation();

  return (
    <>
      <StudentHeader title={t("student.payments")} />
      
      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Current Plan Card */}
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                      {currentPlan.name}
                    </h2>
                    <Badge className="bg-success text-success-foreground">Ativo</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Próximo pagamento: {currentPlan.nextPayment}
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-3xl font-bold text-primary">€{currentPlan.price}</div>
                <p className="text-sm text-muted-foreground">/mês</p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Incluído no teu plano:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex">
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          {/* Payment History */}
          <TabsContent value="history" className="mt-4 md:mt-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                {/* Mobile View */}
                <div className="md:hidden space-y-3 p-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground text-sm">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          className="border-success text-success text-xs"
                        >
                          Pago
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{payment.method}</span>
                        <span className="font-semibold text-foreground">€{payment.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Descrição</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Método</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Valor</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{payment.description}</td>
                          <td className="py-3 px-4 text-muted-foreground">{payment.date}</td>
                          <td className="py-3 px-4 text-muted-foreground">{payment.method}</td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">€{payment.amount}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline"
                              className="border-success text-success"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pago
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

          {/* Invoices */}
          <TabsContent value="invoices" className="mt-4 md:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                  Faturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-xl border border-border gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{invoice.id}</p>
                          <p className="text-sm text-muted-foreground">{invoice.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:gap-4">
                        <span className="font-semibold text-foreground">€{invoice.amount}</span>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Descarregar</span>
                          <span className="sm:hidden">PDF</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Métodos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 p-4 border border-primary rounded-xl bg-primary/5">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">•••• •••• •••• 4532</p>
                    <p className="text-sm text-muted-foreground">Expira 12/26</p>
                  </div>
                </div>
                <Badge className="mt-3">Predefinido</Badge>
              </div>
              <Button variant="outline" className="sm:self-start">
                Adicionar Método
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
