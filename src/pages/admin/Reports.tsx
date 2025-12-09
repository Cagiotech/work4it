import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp, TrendingDown, Download, Users, Building2, CreditCard, Activity } from "lucide-react";

const revenueData = [
  { month: "Jan", value: 18500 },
  { month: "Fev", value: 19200 },
  { month: "Mar", value: 20100 },
  { month: "Abr", value: 21800 },
  { month: "Mai", value: 23200 },
  { month: "Jun", value: 24580 },
];

const topCompanies = [
  { name: "Gym Fitness Pro", revenue: "€890", users: 156, growth: "+12%" },
  { name: "Boxing Academy", revenue: "€890", users: 92, growth: "+8%" },
  { name: "Yoga Studio Zen", revenue: "€490", users: 78, growth: "+15%" },
  { name: "CrossFit Lisboa", revenue: "€290", users: 45, growth: "+5%" },
  { name: "Pilates Center", revenue: "€490", users: 65, growth: "+10%" },
];

const kpis = [
  { title: "MRR", value: "€24,580", change: "+12%", trend: "up", description: "Monthly Recurring Revenue" },
  { title: "ARR", value: "€294,960", change: "+15%", trend: "up", description: "Annual Recurring Revenue" },
  { title: "LTV", value: "€8,640", change: "+8%", trend: "up", description: "Lifetime Value médio" },
  { title: "CAC", value: "€120", change: "-5%", trend: "down", description: "Custo de Aquisição" },
];

export default function AdminReports() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm md:text-base">Análise e métricas do sistema</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                {kpi.title}
                <Badge variant="outline" className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:flex">
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Evolução da Receita
                </CardTitle>
                <CardDescription>Receita mensal dos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-2">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                        style={{ height: `${(data.value / 25000) * 200}px` }}
                      />
                      <span className="text-xs text-muted-foreground">{data.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
                <CardDescription>Receita por tipo de plano</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Premium</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€7,120</p>
                      <p className="text-xs text-muted-foreground">29%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Intermédio</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€8,820</p>
                      <p className="text-xs text-muted-foreground">36%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span className="text-sm">Básico</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€8,640</p>
                      <p className="text-xs text-muted-foreground">35%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Top Empresas por Receita
              </CardTitle>
              <CardDescription>As empresas com maior contribuição</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.users} utilizadores</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{company.revenue}/mês</p>
                      <p className="text-xs text-green-600">{company.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Utilizadores</CardTitle>
                <CardDescription>Novos utilizadores por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Janeiro</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "60%" }} />
                      </div>
                      <span className="text-sm font-medium">+85</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fevereiro</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "70%" }} />
                      </div>
                      <span className="text-sm font-medium">+98</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Março</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "85%" }} />
                      </div>
                      <span className="text-sm font-medium">+120</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abril</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "75%" }} />
                      </div>
                      <span className="text-sm font-medium">+105</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maio</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "90%" }} />
                      </div>
                      <span className="text-sm font-medium">+124</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Utilizadores por função</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Alunos</span>
                  </div>
                  <span className="font-bold">1,041</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Personal Trainers</span>
                  </div>
                  <span className="font-bold">156</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Admins Empresa</span>
                  </div>
                  <span className="font-bold">48</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-600" />
                    <span>Super Admins</span>
                  </div>
                  <span className="font-bold">2</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
