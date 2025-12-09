import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, Plus, ThumbsUp, MessageCircle, Clock, CheckCircle, Circle, ArrowUp } from "lucide-react";

const suggestions = [
  {
    id: 1,
    title: "Integração com Apple Watch",
    description: "Seria ótimo poder sincronizar os treinos com o Apple Watch para monitorizar em tempo real",
    author: "Maria Santos",
    company: "Gym Fitness Pro",
    votes: 156,
    comments: 23,
    status: "Em Análise",
    category: "Integrações",
    createdAt: "Há 3 dias",
  },
  {
    id: 2,
    title: "Modo Offline para App",
    description: "Permitir aos alunos aceder aos planos de treino sem internet",
    author: "João Silva",
    company: "CrossFit Lisboa",
    votes: 134,
    comments: 18,
    status: "Planeado",
    category: "App Mobile",
    createdAt: "Há 1 semana",
  },
  {
    id: 3,
    title: "Relatórios Personalizados",
    description: "Criar relatórios customizados com métricas específicas de cada empresa",
    author: "Ana Ferreira",
    company: "Yoga Studio Zen",
    votes: 98,
    comments: 12,
    status: "Em Desenvolvimento",
    category: "Relatórios",
    createdAt: "Há 2 semanas",
  },
  {
    id: 4,
    title: "Chat em Grupo",
    description: "Permitir conversas em grupo entre alunos da mesma turma",
    author: "Pedro Costa",
    company: "Boxing Academy",
    votes: 87,
    comments: 9,
    status: "Em Análise",
    category: "Comunicação",
    createdAt: "Há 3 semanas",
  },
  {
    id: 5,
    title: "Pagamentos Recorrentes",
    description: "Sistema de débito direto automático para mensalidades",
    author: "Sofia Rodrigues",
    company: "Pilates Center",
    votes: 76,
    comments: 15,
    status: "Concluído",
    category: "Pagamentos",
    createdAt: "Há 1 mês",
  },
];

const roadmapItems = [
  {
    quarter: "Q4 2024",
    items: [
      { title: "App Mobile iOS/Android", status: "Em Desenvolvimento", progress: 75 },
      { title: "Modo Offline", status: "Em Desenvolvimento", progress: 40 },
      { title: "Integração Stripe", status: "Concluído", progress: 100 },
    ],
  },
  {
    quarter: "Q1 2025",
    items: [
      { title: "Integração Apple Watch", status: "Planeado", progress: 0 },
      { title: "Chat em Grupo", status: "Planeado", progress: 0 },
      { title: "Relatórios Personalizados", status: "Planeado", progress: 10 },
    ],
  },
  {
    quarter: "Q2 2025",
    items: [
      { title: "API Pública", status: "Planeado", progress: 0 },
      { title: "Marketplace de Treinos", status: "Em Análise", progress: 0 },
      { title: "IA para Planos de Treino", status: "Em Análise", progress: 0 },
    ],
  },
];

const statusColors: Record<string, string> = {
  "Em Análise": "bg-yellow-500/10 text-yellow-600",
  "Planeado": "bg-blue-500/10 text-blue-600",
  "Em Desenvolvimento": "bg-purple-500/10 text-purple-600",
  "Concluído": "bg-green-500/10 text-green-600",
};

export default function AdminRoadmap() {
  const [filter, setFilter] = useState("all");

  const filteredSuggestions = suggestions.filter(
    (s) => filter === "all" || s.status === filter
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Roadmap</h1>
          <p className="text-muted-foreground text-sm md:text-base">Sugestões dos utilizadores e plano de desenvolvimento</p>
        </div>
      </div>

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="suggestions" className="flex-1 md:flex-none">Sugestões</TabsTrigger>
          <TabsTrigger value="roadmap" className="flex-1 md:flex-none">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {/* Stats */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sugestões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suggestions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {suggestions.filter(s => s.status === "Em Análise").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em Desenvolvimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {suggestions.filter(s => s.status === "Em Desenvolvimento").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {suggestions.filter(s => s.status === "Concluído").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Planeado">Planeado</SelectItem>
                <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Votes */}
                    <div className="flex md:flex-col items-center gap-2 md:gap-1 md:min-w-[60px]">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-lg">{suggestion.votes}</span>
                      <span className="text-xs text-muted-foreground hidden md:block">votos</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                          <p className="text-muted-foreground mt-1">{suggestion.description}</p>
                        </div>
                        <Badge variant="outline" className={statusColors[suggestion.status]}>
                          {suggestion.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="text-xs">
                              {suggestion.author.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{suggestion.author}</span>
                          <span className="text-xs text-muted-foreground">({suggestion.company})</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>{suggestion.comments}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{suggestion.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          {roadmapItems.map((quarter) => (
            <Card key={quarter.quarter}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  {quarter.quarter}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quarter.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="shrink-0">
                        {item.status === "Concluído" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : item.status === "Em Desenvolvimento" ? (
                          <Clock className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="outline" className={statusColors[item.status]}>
                            {item.status}
                          </Badge>
                        </div>
                        {item.progress > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progresso</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
