import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreVertical, Users, Calendar, CreditCard, Building2, Settings, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const companies = [
  { id: 1, name: "Gym Fitness Pro", plan: "Premium", users: 156, trainers: 12, status: "Ativo", revenue: "€890/mês", joined: "Jan 2024" },
  { id: 2, name: "CrossFit Lisboa", plan: "Básico", users: 45, trainers: 4, status: "Ativo", revenue: "€290/mês", joined: "Mar 2024" },
  { id: 3, name: "Yoga Studio Zen", plan: "Intermédio", users: 78, trainers: 6, status: "Pendente", revenue: "€490/mês", joined: "Fev 2024" },
  { id: 4, name: "Boxing Academy", plan: "Premium", users: 92, trainers: 8, status: "Ativo", revenue: "€890/mês", joined: "Dez 2023" },
  { id: 5, name: "Pilates Center", plan: "Intermédio", users: 65, trainers: 5, status: "Ativo", revenue: "€490/mês", joined: "Nov 2023" },
  { id: 6, name: "Martial Arts Dojo", plan: "Básico", users: 34, trainers: 3, status: "Suspenso", revenue: "€0/mês", joined: "Out 2023" },
];

const planColors: Record<string, string> = {
  "Premium": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  "Intermédio": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Básico": "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export default function AdminCompanies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "all" || company.plan === filterPlan;
    const matchesStatus = filterStatus === "all" || company.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir as empresas registadas no sistema</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Empresa</DialogTitle>
              <DialogDescription>Preencha os dados para registar uma nova empresa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input id="companyName" placeholder="Ex: Gym Fitness" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="empresa@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico - €290/mês</SelectItem>
                    <SelectItem value="intermediate">Intermédio - €490/mês</SelectItem>
                    <SelectItem value="premium">Premium - €890/mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="+351 912 345 678" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Empresa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {companies.filter(c => c.status === "Ativo").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planos Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {companies.filter(c => c.plan === "Premium").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€3,940/mês</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar empresas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Intermédio">Intermédio</SelectItem>
                <SelectItem value="Básico">Básico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{company.name}</CardTitle>
                    <CardDescription>Desde {company.joined}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Alterar Plano
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Suspender
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={planColors[company.plan]}>
                  {company.plan}
                </Badge>
                <Badge variant={company.status === "Ativo" ? "default" : company.status === "Pendente" ? "secondary" : "destructive"}>
                  {company.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{company.users} alunos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{company.trainers} trainers</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Receita</span>
                <span className="font-bold text-green-600">{company.revenue}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
