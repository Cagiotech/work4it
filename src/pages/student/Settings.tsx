import { useTranslation } from "react-i18next";
import { User, Lock, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function StudentSettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4 md:mb-6 w-full md:w-auto grid grid-cols-2 md:grid-cols-4 md:flex">
            <TabsTrigger value="profile" className="gap-1 md:gap-2 text-xs md:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Informações Pessoais</CardTitle>
                <CardDescription>Atualize as suas informações pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg md:text-xl">MS</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <Button variant="outline" size="sm">Alterar Foto</Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF. Máx. 2MB</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input id="firstName" defaultValue="Maria" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apelido</Label>
                    <Input id="lastName" defaultValue="Santos" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="maria.santos@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" defaultValue="+351 912 345 678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Data de Nascimento</Label>
                    <Input id="birthdate" type="date" defaultValue="1995-03-15" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency">Contacto de Emergência</Label>
                    <Input id="emergency" defaultValue="+351 918 765 432" />
                  </div>
                </div>
                
                <Button className="w-full sm:w-auto">{t("common.save")}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">{t("common.changePassword")}</CardTitle>
                <CardDescription>Mantenha a sua conta segura</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Palavra-passe atual</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova palavra-passe</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova palavra-passe</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button className="w-full sm:w-auto">{t("common.save")}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Preferências de Notificações</CardTitle>
                <CardDescription>Configure como quer receber notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                {[
                  { id: "email-class", label: "Lembrete de Aulas", description: "Receber email antes das aulas agendadas" },
                  { id: "email-plan", label: "Atualizações do Plano", description: "Notificar quando o plano de treino for atualizado" },
                  { id: "email-promo", label: "Promoções", description: "Receber ofertas e promoções especiais" },
                  { id: "push-all", label: "Notificações push", description: "Receber notificações no browser" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm md:text-base">{item.label}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.id !== "email-promo"} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Aparência</CardTitle>
                <CardDescription>Personalize a aparência do painel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm md:text-base">{t("common.language")}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Selecione o idioma do painel</p>
                  </div>
                  <LanguageSwitcher />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm md:text-base">Modo Escuro</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
