import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Users, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats = [
  { title: "Rendimento Mensal", value: "€2.450", icon: DollarSign, change: "+8.2%", trend: "up" },
  { title: "Aulas Este Mês", value: "48", icon: Calendar, change: "+12", trend: "up" },
  { title: "Alunos Ativos", value: "24", icon: Users, change: "+2", trend: "up" },
  { title: "Média por Aula", value: "€51", icon: TrendingUp, change: "+€3", trend: "up" },
];

const earnings = [
  { month: "Janeiro", classes: 42, students: 22, total: "€2.100", bonus: "€150" },
  { month: "Fevereiro", classes: 45, students: 23, total: "€2.250", bonus: "€200" },
  { month: "Março", classes: 48, students: 24, total: "€2.450", bonus: "€250" },
];

const recentPayments = [
  { id: 1, student: "Maria Santos", type: "Mensalidade", date: "01 Mar 2024", value: "€150", status: "Pago" },
  { id: 2, student: "Pedro Costa", type: "Pack 10 aulas", date: "28 Fev 2024", value: "€400", status: "Pago" },
  { id: 3, student: "Ana Ferreira", type: "Mensalidade", date: "01 Mar 2024", value: "€180", status: "Pago" },
  { id: 4, student: "João Oliveira", type: "Mensalidade", date: "01 Mar 2024", value: "€120", status: "Pendente" },
  { id: 5, student: "Sofia Rodrigues", type: "Avulso", date: "05 Mar 2024", value: "€60", status: "Pago" },
];

const pendingPayments = [
  { id: 1, student: "João Oliveira", type: "Mensalidade", dueDate: "01 Mar 2024", value: "€120", daysLate: 5 },
  { id: 2, student: "Miguel Almeida", type: "Mensalidade", dueDate: "01 Mar 2024", value: "€150", daysLate: 5 },
];

export default function PersonalFinancial() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Acompanhar os seus rendimentos e pagamentos
          </p>
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center gap-1 ${
                stat.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:flex">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Rendimentos</CardTitle>
              <CardDescription>Os seus rendimentos nos últimos meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-center">Aulas</TableHead>
                      <TableHead className="text-center">Alunos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Bónus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((earning) => (
                      <TableRow key={earning.month}>
                        <TableCell className="font-medium">{earning.month}</TableCell>
                        <TableCell className="text-center">{earning.classes}</TableCell>
                        <TableCell className="text-center">{earning.students}</TableCell>
                        <TableCell className="text-right font-medium">{earning.total}</TableCell>
                        <TableCell className="text-right text-green-600">{earning.bonus}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Chart placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>Gráfico de rendimentos ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Gráfico de evolução (em desenvolvimento)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
              <CardDescription>Histórico dos últimos pagamentos recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.student}</TableCell>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="text-right font-medium">{payment.value}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={payment.status === "Pago" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Pagamentos Pendentes
              </CardTitle>
              <CardDescription>Pagamentos que aguardam regularização</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length > 0 ? (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-orange-500/5 border-orange-500/20"
                    >
                      <div className="space-y-1 mb-3 md:mb-0">
                        <p className="font-medium">{payment.student}</p>
                        <p className="text-sm text-muted-foreground">{payment.type}</p>
                        <p className="text-xs text-orange-600">
                          Vencido há {payment.daysLate} dias (desde {payment.dueDate})
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">{payment.value}</span>
                        <Button variant="outline" size="sm">
                          Enviar Lembrete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Não existem pagamentos pendentes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
