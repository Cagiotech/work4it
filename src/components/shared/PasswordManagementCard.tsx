import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Eye, EyeOff, Copy, Check, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface PasswordManagementCardProps {
  userId: string;
  userType: "student" | "staff";
  userEmail: string;
  userName: string;
  companyId: string;
  hasAccount: boolean;
}

export function PasswordManagementCard({
  userId,
  userType,
  userEmail,
  userName,
  companyId,
  hasAccount,
}: PasswordManagementCardProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<{
    id: string;
    created_at: string;
    status: string;
    new_password?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkPendingRequest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("id, created_at, status, new_password")
        .eq("email", userEmail.toLowerCase())
        .eq("user_type", userType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPendingRequest(data);
    } catch (error) {
      console.error("Error checking request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    checkPendingRequest();
    setShowResetDialog(true);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success("Senha copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePassword = async () => {
    if (!newPassword) {
      toast.error("Defina uma senha");
      return;
    }

    setSaving(true);
    try {
      // If there's a pending request, update it
      if (pendingRequest && pendingRequest.status === "pending") {
        const { error } = await supabase
          .from("password_reset_requests")
          .update({
            status: "approved",
            new_password: newPassword,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", pendingRequest.id);

        if (error) throw error;
      } else {
        // Create a new approved request with the password
        const { error } = await supabase
          .from("password_reset_requests")
          .insert({
            email: userEmail.toLowerCase(),
            user_type: userType,
            user_id: userId,
            company_id: companyId,
            status: "approved",
            new_password: newPassword,
            reviewed_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success("Senha temporária definida! Comunique ao utilizador.");
      setShowResetDialog(false);
      setNewPassword("");
    } catch (error) {
      console.error("Error saving password:", error);
      toast.error("Erro ao definir senha");
    } finally {
      setSaving(false);
    }
  };

  if (!hasAccount) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Acesso ao Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Este utilizador não possui conta de acesso ao sistema.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Gestão de Senha
          </CardTitle>
          <CardDescription>
            Defina uma senha temporária para o utilizador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleOpenDialog}>
            <KeyRound className="h-4 w-4 mr-2" />
            Definir Nova Senha
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Definir Senha Temporária
            </DialogTitle>
            <DialogDescription>
              Defina uma nova senha para <strong>{userName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Verificando...</div>
            ) : pendingRequest && pendingRequest.status === "pending" ? (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Pedido de recuperação pendente</p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                      Solicitado em {format(new Date(pendingRequest.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                    </p>
                  </div>
                </div>
              </div>
            ) : pendingRequest && pendingRequest.status === "approved" && pendingRequest.new_password ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Última senha definida:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded border font-mono text-sm">
                    {pendingRequest.new_password}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(pendingRequest.new_password!);
                      toast.success("Senha copiada!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha Temporária</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Gerar
                </Button>
              </div>
            </div>

            {newPassword && (
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">{newPassword}</code>
                <Button size="sm" variant="ghost" onClick={handleCopyPassword}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              A senha será registada no sistema. Comunique ao utilizador de forma segura.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePassword} disabled={!newPassword || saving}>
              {saving ? "Salvando..." : "Definir Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
