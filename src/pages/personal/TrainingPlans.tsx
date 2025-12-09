import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Dumbbell, Clock, Target, MoreVertical, Copy, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const trainingPlans = [
  {
    id: 1,
    name: "Hipertrofia - Iniciante",
    student: "Maria Santos",
    duration: "8 semanas",
    frequency: "4x por semana",
    goal: "Ganho de massa muscular",
    status: "Ativo",
    progress: 65,
    createdAt: "15 Jan 2024",
  },
  {
    id: 2,
    name: "Emagrecimento Intensivo",
    student: "Pedro Costa",
    duration: "12 semanas",
    frequency: "5x por semana",
    goal: "Perda de gordura",
    status: "Ativo",
    progress: 40,
    createdAt: "20 Fev 2024",
  },
  {
    id: 3,
    name: "Força e Potência",
    student: "Ana Ferreira",
    duration: "6 semanas",
    frequency: "3x por semana",
    goal: "Aumento de força",
    status: "Ativo",
    progress: 80,
    createdAt: "01 Mar 2024",
  },
  {
    id: 4,
    name: "Reabilitação Lombar",
    student: "João Oliveira",
    duration: "4 semanas",
    frequency: "2x por semana",
    goal: "Recuperação",
    status: "Pausado",
    progress: 50,
    createdAt: "10 Dez 2023",
  },
];

const templates = [
  { id: 1, name: "Hipertrofia - Iniciante", duration: "8 semanas", exercises: 24, uses: 12 },
  { id: 2, name: "Emagrecimento HIIT", duration: "6 semanas", exercises: 18, uses: 8 },
  { id: 3, name: "Full Body Funcional", duration: "4 semanas", exercises: 16, uses: 15 },
  { id: 4, name: "Força Powerlifting", duration: "12 semanas", exercises: 32, uses: 5 },
  { id: 5, name: "Mobilidade e Flexibilidade", duration: "4 semanas", exercises: 20, uses: 10 },
];

export default function PersonalTrainingPlans() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlans = trainingPlans.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planos de Treino</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Criar e gerir planos de treino para os seus alunos
          </p>
        </div>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="active" className="flex-1 md:flex-none">Planos Ativos</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 md:flex-none">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar planos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Plans Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <CardDescription>Criado em {plan.createdAt}</CardDescription>
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
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {plan.student.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{plan.student}</span>
                    <Badge
                      variant={plan.status === "Ativo" ? "default" : "secondary"}
                      className="ml-auto text-xs"
                    >
                      {plan.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.frequency}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-muted/50 text-sm">
                    <span className="text-muted-foreground">Objetivo: </span>
                    <span>{plan.goal}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{plan.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.duration}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{template.exercises} exercícios</span>
                    <span className="text-muted-foreground">Usado {template.uses}x</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
