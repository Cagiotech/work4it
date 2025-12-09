import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Palette, Camera, Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function PersonalSettings() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Definições</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Gerir o seu perfil e preferências
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 md:flex">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualizar os seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      PT
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center md:text-left">
                  <p className="font-medium">Foto de Perfil</p>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Primeiro Nome</Label>
                  <Input id="firstName" defaultValue="João" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apelido</Label>
                  <Input id="lastName" defaultValue="Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="joao.silva@cagiotech.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="+351 912 345 678" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    placeholder="Escreva uma breve descrição sobre si..."
                    defaultValue="Personal Trainer certificado com 5 anos de experiência. Especializado em treino funcional e musculação."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Especialização</Label>
                  <Select defaultValue="funcional">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funcional">Treino Funcional</SelectItem>
                      <SelectItem value="musculacao">Musculação</SelectItem>
                      <SelectItem value="pilates">Pilates</SelectItem>
                      <SelectItem value="crossfit">CrossFit</SelectItem>
                      <SelectItem value="reabilitacao">Reabilitação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Anos de Experiência</Label>
                  <Input id="experience" type="number" defaultValue="5" />
                </div>
              </div>

              <Button className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>Configurar como receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novas mensagens</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações de novas mensagens
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembretes de aulas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações 30 minutos antes das aulas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novos alunos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando um novo aluno for atribuído
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagamentos</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre pagamentos recebidos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email semanal</Label>
                    <p className="text-sm text-muted-foreground">
                      Resumo semanal por email
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerir a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Palavra-passe Atual</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Palavra-passe</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Alterar Palavra-passe</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de dois fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicionar uma camada extra de segurança
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalizar a interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select defaultValue="light">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select defaultValue="pt">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animações</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar animações na interface
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
