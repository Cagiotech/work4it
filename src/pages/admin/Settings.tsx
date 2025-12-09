import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Globe, Mail, Shield, Database, Bell, Save, Key } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Definições do Sistema</h1>
        <p className="text-muted-foreground text-sm md:text-base">Configurações globais da plataforma</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-5 md:flex">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden md:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden md:inline">API</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Definições básicas da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome da Plataforma</Label>
                  <Input id="siteName" defaultValue="Cagiotech" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">URL da Plataforma</Label>
                  <Input id="siteUrl" defaultValue="https://app.cagiotech.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  defaultValue="Plataforma de gestão para ginásios e personal trainers"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Idioma Padrão</Label>
                  <Select defaultValue="pt">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select defaultValue="europe-lisbon">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-lisbon">Europe/Lisbon</SelectItem>
                      <SelectItem value="europe-london">Europe/London</SelectItem>
                      <SelectItem value="america-sao-paulo">America/Sao_Paulo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo de Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear acesso de utilizadores durante manutenção
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Registo</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir novas empresas se registarem
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>Definir servidor SMTP e templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input id="smtpHost" placeholder="smtp.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta</Label>
                  <Input id="smtpPort" placeholder="587" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Utilizador</Label>
                  <Input id="smtpUser" placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Palavra-passe</Label>
                  <Input id="smtpPassword" type="password" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Remetente</Label>
                  <Input id="fromEmail" placeholder="noreply@cagiotech.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome Remetente</Label>
                  <Input id="fromName" placeholder="Cagiotech" />
                </div>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Definir políticas de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação 2FA Obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Exigir 2FA para todos os utilizadores admin
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bloqueio após Tentativas</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear conta após 5 tentativas falhadas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Expiração de Sessão</Label>
                    <p className="text-sm text-muted-foreground">
                      Terminar sessão após inatividade
                    </p>
                  </div>
                  <Select defaultValue="24h">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="8h">8 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>Definir alertas e notificações do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novas Empresas</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando uma nova empresa se regista
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Pagamentos Pendentes</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertar sobre pagamentos em atraso
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Erros do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas de erros críticos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novas Sugestões</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar sobre novas sugestões no roadmap
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
              <CardDescription>Gerir chaves e acessos de API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chave de API Principal</p>
                    <p className="text-sm text-muted-foreground">Criada em 01 Jan 2024</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm">sk_live_•••••••••••</code>
                    <Button variant="outline" size="sm">Revelar</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativar API Pública</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir acesso via API para integrações
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limitar pedidos por minuto
                    </p>
                  </div>
                  <Select defaultValue="1000">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100/min</SelectItem>
                      <SelectItem value="500">500/min</SelectItem>
                      <SelectItem value="1000">1000/min</SelectItem>
                      <SelectItem value="unlimited">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Gerar Nova Chave
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
