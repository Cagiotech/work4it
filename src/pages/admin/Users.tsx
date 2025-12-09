import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreVertical, Mail, Shield, Building2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const users = [
  { id: 1, name: "Maria Santos", email: "maria@gymfitness.pt", role: "Aluno", company: "Gym Fitness Pro", status: "Ativo", lastLogin: "Há 2h" },
  { id: 2, name: "João Silva", email: "joao@gymfitness.pt", role: "Personal Trainer", company: "Gym Fitness Pro", status: "Ativo", lastLogin: "Há 30min" },
  { id: 3, name: "Ana Costa", email: "ana@crossfit.pt", role: "Admin Empresa", company: "CrossFit Lisboa", status: "Ativo", lastLogin: "Há 1 dia" },
  { id: 4, name: "Pedro Ferreira", email: "pedro@yoga.pt", role: "Aluno", company: "Yoga Studio Zen", status: "Inativo", lastLogin: "Há 2 semanas" },
  { id: 5, name: "Sofia Rodrigues", email: "sofia@boxing.pt", role: "Personal Trainer", company: "Boxing Academy", status: "Ativo", lastLogin: "Há 5h" },
  { id: 6, name: "Miguel Almeida", email: "miguel@admin.pt", role: "Super Admin", company: "Sistema", status: "Ativo", lastLogin: "Agora" },
];

const roleColors: Record<string, string> = {
  "Aluno": "bg-blue-500/10 text-blue-600",
  "Personal Trainer": "bg-green-500/10 text-green-600",
  "Admin Empresa": "bg-purple-500/10 text-purple-600",
  "Super Admin": "bg-red-500/10 text-red-600",
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Utilizadores</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir todos os utilizadores do sistema</p>
        </div>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Utilizador
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                <SelectItem value="Aluno">Aluno</SelectItem>
                <SelectItem value="Personal Trainer">Personal Trainer</SelectItem>
                <SelectItem value="Admin Empresa">Admin Empresa</SelectItem>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Utilizadores</CardTitle>
          <CardDescription>{filteredUsers.length} utilizadores encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead className="hidden md:table-cell">Função</TableHead>
                  <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                  <TableHead className="hidden md:table-cell">Último Login</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={roleColors[user.role]}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{user.company}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Ativo" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Editar Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
