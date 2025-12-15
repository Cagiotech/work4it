import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Lock, Bell, Palette, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function StudentSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('students')
        .select('password_changed, full_name, email, phone, birth_date, emergency_contact, emergency_phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setStudentData(data);
        if (data.password_changed === false) {
          setMustChangePassword(true);
          setActiveTab("security");
        }
      }
    };

    checkPasswordStatus();
  }, [user?.id]);

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As palavras-passe não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("A nova palavra-passe deve ter pelo menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      // Update password_changed flag
      if (user?.id) {
        await supabase
          .from('students')
          .update({ password_changed: true })
          .eq('user_id', user.id);
      }

      setMustChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Palavra-passe alterada com sucesso!");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || "Erro ao alterar palavra-passe");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  return (
    <div className="space-y-6">
      {mustChangePassword && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ação Necessária</AlertTitle>
          <AlertDescription>
            Por segurança, deve alterar a sua palavra-passe temporária antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 md:mb-6 w-full md:w-auto grid grid-cols-2 md:grid-cols-4 md:flex">
          <TabsTrigger 
            value="profile" 
            className="gap-1 md:gap-2 text-xs md:text-sm"
            disabled={mustChangePassword}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
            {mustChangePassword && <span className="ml-1 h-2 w-2 rounded-full bg-destructive" />}
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="gap-1 md:gap-2 text-xs md:text-sm"
            disabled={mustChangePassword}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger 
            value="appearance" 
            className="gap-1 md:gap-2 text-xs md:text-sm"
            disabled={mustChangePassword}
          >
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
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg md:text-xl">
                    {getInitials(studentData?.full_name || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <Button variant="outline" size="sm">Alterar Foto</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF. Máx. 2MB</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input id="fullName" defaultValue={studentData?.full_name || ""} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={studentData?.email || user?.email || ""} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue={studentData?.phone || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Data de Nascimento</Label>
                  <Input id="birthdate" type="date" defaultValue={studentData?.birth_date || ""} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency">Contacto de Emergência</Label>
                  <Input id="emergency" defaultValue={studentData?.emergency_contact || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input id="emergencyPhone" defaultValue={studentData?.emergency_phone || ""} />
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
              <CardTitle className="text-base md:text-lg">
                {mustChangePassword ? "Alterar Palavra-passe Temporária" : t("common.changePassword")}
              </CardTitle>
              <CardDescription>
                {mustChangePassword 
                  ? "A sua conta foi criada com uma palavra-passe temporária. Por segurança, deve alterá-la."
                  : "Mantenha a sua conta segura"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mustChangePassword && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Palavra-passe atual</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova palavra-passe</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova palavra-passe</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
              </div>
              <Button 
                className="w-full sm:w-auto" 
                onClick={handleChangePassword}
                disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {loading ? "A alterar..." : mustChangePassword ? "Alterar e Continuar" : t("common.save")}
              </Button>
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
