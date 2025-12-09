import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Check, X, Plus, Edit, CreditCard, Users, Building2, Dumbbell, MessageCircle, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const plans = [
  {
    id: 1,
    name: "Básico",
    price: 290,
    billingCycle: "mensal",
    companies: 12,
    color: "gray",
    features: {
      maxUsers: 50,
      maxTrainers: 5,
      storage: "5 GB",
      support: "Email",
      reports: false,
      customBranding: false,
      api: false,
      multiLocation: false,
    },
    permissions: [
      { name: "Gestão de Alunos", enabled: true },
      { name: "Planos de Treino", enabled: true },
      { name: "Agenda", enabled: true },
      { name: "Pagamentos Básicos", enabled: true },
      { name: "Chat Interno", enabled: false },
      { name: "Relatórios Avançados", enabled: false },
      { name: "Nutrição", enabled: false },
      { name: "App Personalizada", enabled: false },
    ],
  },
  {
    id: 2,
    name: "Intermédio",
    price: 490,
    billingCycle: "mensal",
    companies: 18,
    color: "blue",
    popular: true,
    features: {
      maxUsers: 150,
      maxTrainers: 15,
      storage: "25 GB",
      support: "Email + Chat",
      reports: true,
      customBranding: false,
      api: false,
      multiLocation: false,
    },
    permissions: [
      { name: "Gestão de Alunos", enabled: true },
      { name: "Planos de Treino", enabled: true },
      { name: "Agenda", enabled: true },
      { name: "Pagamentos Básicos", enabled: true },
      { name: "Chat Interno", enabled: true },
      { name: "Relatórios Avançados", enabled: true },
      { name: "Nutrição", enabled: true },
      { name: "App Personalizada", enabled: false },
    ],
  },
  {
    id: 3,
    name: "Premium",
    price: 890,
    billingCycle: "mensal",
    companies: 8,
    color: "yellow",
    features: {
      maxUsers: "Ilimitado",
      maxTrainers: "Ilimitado",
      storage: "100 GB",
      support: "Prioritário 24/7",
      reports: true,
      customBranding: true,
      api: true,
      multiLocation: true,
    },
    permissions: [
      { name: "Gestão de Alunos", enabled: true },
      { name: "Planos de Treino", enabled: true },
      { name: "Agenda", enabled: true },
      { name: "Pagamentos Básicos", enabled: true },
      { name: "Chat Interno", enabled: true },
      { name: "Relatórios Avançados", enabled: true },
      { name: "Nutrição", enabled: true },
      { name: "App Personalizada", enabled: true },
    ],
  },
];

const colorClasses: Record<string, string> = {
  gray: "border-gray-300 bg-gray-50",
  blue: "border-blue-500 bg-blue-50",
  yellow: "border-yellow-500 bg-yellow-50",
};

export default function AdminPlans() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planos de Assinatura</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir os planos e permissões do sistema</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
              <DialogDescription>Configure os detalhes do novo plano de assinatura</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Nome do Plano</Label>
                  <Input id="planName" placeholder="Ex: Enterprise" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planPrice">Preço (€/mês)</Label>
                  <Input id="planPrice" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Máx. Utilizadores</Label>
                  <Input id="maxUsers" type="number" placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTrainers">Máx. Trainers</Label>
                  <Input id="maxTrainers" type="number" placeholder="10" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Plano</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€24,580</div>
            <p className="text-xs text-green-600">+12% vs mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plano Mais Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Intermédio</div>
            <p className="text-xs text-muted-foreground">18 empresas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€512</div>
            <p className="text-xs text-muted-foreground">por empresa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2.1%</div>
            <p className="text-xs text-muted-foreground">este trimestre</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative overflow-hidden ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                Mais Popular
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.companies} empresas</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="pt-4">
                <span className="text-4xl font-bold">€{plan.price}</span>
                <span className="text-muted-foreground">/{plan.billingCycle}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              
              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Utilizadores</span>
                  </div>
                  <span className="font-medium">{plan.features.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <span>Trainers</span>
                  </div>
                  <span className="font-medium">{plan.features.maxTrainers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Armazenamento</span>
                  </div>
                  <span className="font-medium">{plan.features.storage}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Suporte</span>
                  </div>
                  <span className="font-medium text-xs">{plan.features.support}</span>
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Permissões:</p>
                {plan.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {permission.enabled ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={permission.enabled ? "" : "text-muted-foreground"}>
                      {permission.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
