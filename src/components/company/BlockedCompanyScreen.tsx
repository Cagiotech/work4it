import { ShieldX, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { openExternalLink } from "@/lib/platform";

interface BlockedCompanyScreenProps {
  companyName: string;
  blockedReason?: string | null;
}

export function BlockedCompanyScreen({ companyName, blockedReason }: BlockedCompanyScreenProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Conta Bloqueada</CardTitle>
          <CardDescription>
            A empresa <span className="font-semibold text-foreground">{companyName}</span> foi bloqueada pelo administrador do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {blockedReason && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-left">
              <p className="text-sm font-medium text-destructive mb-1">Motivo do bloqueio:</p>
              <p className="text-sm text-muted-foreground">{blockedReason}</p>
            </div>
          )}

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              O acesso a esta conta foi temporariamente suspenso. Para mais informações ou para resolver esta situação, entre em contacto com o suporte.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => openExternalLink("mailto:suporte@cagiotech.com")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contactar Suporte
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleLogout}
            >
              Terminar Sessão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
