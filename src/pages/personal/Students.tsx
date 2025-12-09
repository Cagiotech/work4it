import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreVertical, Mail, Phone, Calendar } from "lucide-react";
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

const students = [
  {
    id: 1,
    name: "Maria Santos",
    email: "maria@email.com",
    phone: "+351 912 345 678",
    plan: "Premium",
    status: "Ativo",
    nextSession: "Hoje, 14:00",
    progress: 85,
    joinDate: "Jan 2024",
  },
  {
    id: 2,
    name: "Pedro Costa",
    email: "pedro@email.com",
    phone: "+351 923 456 789",
    plan: "Básico",
    status: "Ativo",
    nextSession: "Amanhã, 09:00",
    progress: 72,
    joinDate: "Mar 2024",
  },
  {
    id: 3,
    name: "Ana Ferreira",
    email: "ana@email.com",
    phone: "+351 934 567 890",
    plan: "Premium",
    status: "Ativo",
    nextSession: "Hoje, 16:00",
    progress: 90,
    joinDate: "Fev 2024",
  },
  {
    id: 4,
    name: "João Oliveira",
    email: "joao@email.com",
    phone: "+351 945 678 901",
    plan: "Intermédio",
    status: "Pausado",
    nextSession: "-",
    progress: 65,
    joinDate: "Dez 2023",
  },
  {
    id: 5,
    name: "Sofia Rodrigues",
    email: "sofia@email.com",
    phone: "+351 956 789 012",
    plan: "Premium",
    status: "Ativo",
    nextSession: "Quinta, 10:00",
    progress: 78,
    joinDate: "Abr 2024",
  },
  {
    id: 6,
    name: "Miguel Almeida",
    email: "miguel@email.com",
    phone: "+351 967 890 123",
    plan: "Básico",
    status: "Ativo",
    nextSession: "Sexta, 17:00",
    progress: 60,
    joinDate: "Mai 2024",
  },
];

export default function PersonalStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === "all" || student.plan === filterPlan;
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meus Alunos</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerir e acompanhar os seus alunos
          </p>
        </div>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Aluno
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar alunos..."
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
                <SelectItem value="Pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{student.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Desde {student.joinDate}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Criar Plano</DropdownMenuItem>
                    <DropdownMenuItem>Enviar Mensagem</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={student.status === "Ativo" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {student.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {student.plan}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Próxima sessão: {student.nextSession}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{student.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
