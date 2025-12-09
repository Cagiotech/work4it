import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Megaphone, Plus, Calendar, Eye, Edit, Trash, Image, Users, Building2, Target } from "lucide-react";

const banners = [
  {
    id: 1,
    title: "Black Friday - 50% Desconto",
    description: "Promoção especial para novos planos",
    image: "/placeholder.svg",
    target: "Todos",
    status: "Ativo",
    startDate: "20 Nov 2024",
    endDate: "30 Nov 2024",
    views: 12456,
    clicks: 892,
  },
  {
    id: 2,
    title: "Novo Módulo de Nutrição",
    description: "Agora disponível para planos Premium",
    image: "/placeholder.svg",
    target: "Empresas",
    status: "Ativo",
    startDate: "01 Dez 2024",
    endDate: "31 Dez 2024",
    views: 5678,
    clicks: 234,
  },
  {
    id: 3,
    title: "Webinar: Treino Funcional",
    description: "Aprenda as melhores técnicas",
    image: "/placeholder.svg",
    target: "Alunos",
    status: "Agendado",
    startDate: "15 Dez 2024",
    endDate: "15 Dez 2024",
    views: 0,
    clicks: 0,
  },
  {
    id: 4,
    title: "Manutenção Programada",
    description: "Sistema indisponível das 02h às 04h",
    image: "/placeholder.svg",
    target: "Todos",
    status: "Expirado",
    startDate: "01 Nov 2024",
    endDate: "01 Nov 2024",
    views: 8934,
    clicks: 123,
  },
];

const events = [
  {
    id: 1,
    title: "Conferência Fitness 2024",
    description: "O maior evento de fitness do ano",
    date: "15 Dez 2024",
    location: "Lisboa, Portugal",
    attendees: 245,
    status: "Confirmado",
  },
  {
    id: 2,
    title: "Workshop Personal Trainers",
    description: "Técnicas avançadas de treino",
    date: "20 Dez 2024",
    location: "Online",
    attendees: 89,
    status: "Aberto",
  },
  {
    id: 3,
    title: "Lançamento App Mobile",
    description: "Apresentação da nova versão",
    date: "10 Jan 2025",
    location: "Porto, Portugal",
    attendees: 156,
    status: "Aberto",
  },
];

const targetColors: Record<string, string> = {
  "Todos": "bg-purple-500/10 text-purple-600",
  "Empresas": "bg-blue-500/10 text-blue-600",
  "Alunos": "bg-green-500/10 text-green-600",
  "Trainers": "bg-orange-500/10 text-orange-600",
};

export default function AdminEvents() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Eventos e Anúncios</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir banners, anúncios e eventos</p>
        </div>
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="banners" className="flex-1 md:flex-none">Banners/Anúncios</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 md:flex-none">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Novo Banner</DialogTitle>
                  <DialogDescription>Configure o banner para exibir aos utilizadores</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="bannerTitle">Título</Label>
                    <Input id="bannerTitle" placeholder="Título do banner" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bannerDescription">Descrição</Label>
                    <Textarea id="bannerDescription" placeholder="Descrição do banner" />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagem do Banner</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Arraste uma imagem ou clique para selecionar</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Público Alvo</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="companies">Empresas</SelectItem>
                          <SelectItem value="students">Alunos</SelectItem>
                          <SelectItem value="trainers">Trainers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Link (opcional)</Label>
                      <Input placeholder="https://..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ativar imediatamente</Label>
                    <Switch />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Criar Banner</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Banners Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{banners.filter(b => b.status === "Ativo").length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Visualizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">27,068</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cliques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,249</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CTR Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.6%</div>
              </CardContent>
            </Card>
          </div>

          {/* Banners Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="aspect-[3/1] bg-muted relative">
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      banner.status === "Ativo" ? "bg-green-600" :
                      banner.status === "Agendado" ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    {banner.status}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{banner.title}</CardTitle>
                      <CardDescription>{banner.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={targetColors[banner.target]}>
                      <Target className="h-3 w-3 mr-1" />
                      {banner.target}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {banner.startDate} - {banner.endDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{banner.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                        <span>{banner.clicks.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Data</span>
                      <span className="font-medium">{event.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Local</span>
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Inscritos</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{event.attendees}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={event.status === "Confirmado" ? "default" : "secondary"}>
                    {event.status}
                  </Badge>
                  <Button variant="outline" className="w-full">
                    Gerir Evento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
