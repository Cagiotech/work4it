import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Users, Building2, Lock, Eye
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCompanies, useAdminPlans } from "@/hooks/useAdminData";
import { formatCurrency } from "@/lib/formatters";

export default function AdminCompanies() {
  const navigate = useNavigate();
  const { data: companies, isLoading } = useAdminCompanies();
  const { data: plans } = useAdminPlans();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredCompanies = companies?.filter((company) => {
    const matchesSearch = (company.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "all" || company.subscription?.name === filterPlan;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "blocked" && company.is_blocked) ||
      (filterStatus === "active" && !company.is_blocked);
    return matchesSearch && matchesPlan && matchesStatus;
  }) || [];

  // Calculate stats
  const totalCompanies = companies?.length || 0;
  const companiesWithPlan = companies?.filter(c => c.subscription).length || 0;
  const totalRevenue = companies?.reduce((sum, c) => sum + (c.subscription?.price || 0), 0) || 0;
  const totalStudents = companies?.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir as empresas registadas no sistema</p>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir as empresas registadas no sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Plano Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{companiesWithPlan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
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
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="blocked">Bloqueadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterPlan !== "all" ? "Nenhuma empresa encontrada" : "Nenhuma empresa registada"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || filterPlan !== "all" ? "Tente ajustar os filtros" : "As empresas aparecerão aqui quando se registarem"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card 
              key={company.id} 
              className={`hover:shadow-md transition-all cursor-pointer hover:border-primary/50 group ${company.is_blocked ? 'border-red-500/50 bg-red-500/5' : ''}`}
              onClick={() => navigate(`/admin/companies/${company.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${company.is_blocked ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                      {company.is_blocked ? (
                        <Lock className="h-5 w-5 text-red-500" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{company.name || "Sem nome"}</CardTitle>
                      <CardDescription>
                        Desde {new Date(company.created_at).toLocaleDateString("pt-PT")}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/companies/${company.id}`);
                    }}
                    title="Ver Detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {company.is_blocked && (
                    <Badge variant="destructive" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Bloqueada
                    </Badge>
                  )}
                  {company.subscription ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {company.subscription.name}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sem Plano</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.studentCount} alunos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.staffCount} staff</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Mensalidade</span>
                  <span className="font-bold text-green-600">
                    {company.subscription ? formatCurrency(company.subscription.price) : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
