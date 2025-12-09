import { useTranslation } from "react-i18next";
import { User, Lock, Bell, Palette, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Settings() {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Perfil</TabsTrigger>
        <TabsTrigger value="company"><Building className="h-4 w-4 mr-2" />Empresa</TabsTrigger>
        <TabsTrigger value="security"><Lock className="h-4 w-4 mr-2" />Segurança</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <Card><CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-primary-foreground">JS</AvatarFallback></Avatar><Button variant="outline" size="sm">Alterar Foto</Button></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Nome</Label><Input defaultValue="João" /></div><div><Label>Apelido</Label><Input defaultValue="Silva" /></div></div>
            <Button>{t("common.save")}</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="company"><Card><CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><Label>Nome</Label><Input defaultValue="Fitness Pro Gym" /></div><Button>{t("common.save")}</Button></div></CardContent></Card></TabsContent>
      <TabsContent value="security"><Card><CardHeader><CardTitle>Segurança</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><Label>Nova palavra-passe</Label><Input type="password" /></div><Button>{t("common.save")}</Button></div></CardContent></Card></TabsContent>
    </Tabs>
  );
}
