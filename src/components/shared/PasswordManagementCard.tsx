import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Loader2,
  UserPlus,
} from "lucide-react";

interface PasswordManagementCardProps {
  recordId: string;
  userType: "student" | "staff";
  userEmail: string;
  userName: string;
  companyId: string;
  hasAccount: boolean;
}

type PendingRequest = {
  id: string;
  created_at: string;
  status: string;
  new_password?: string | null;
} | null;

type DialogMode = "create" | "reset";

export function PasswordManagementCard({
  recordId,
  userType,
  userEmail,
  userName,
  companyId,
  hasAccount,
}: PasswordManagementCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("reset");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>(null);
  const [checking, setChecking] = useState(false);
  const [localHasAccount, setLocalHasAccount] = useState(hasAccount);

  useEffect(() => {
    setLocalHasAccount(hasAccount);
  }, [hasAccount]);

  const normalizedEmail = useMemo(() => userEmail.toLowerCase(), [userEmail]);

  const checkPendingRequest = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("id, created_at, status, new_password")
        .eq("email", normalizedEmail)
        .eq("user_type", userType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPendingRequest(data);
    } catch (error) {
      console.error("Error checking request:", error);
    } finally {
      setChecking(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setShowPassword(true);
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Senha copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar a senha");
    }
  };

  const handleOpenReset = async () => {
    setMode("reset");
    setDialogOpen(true);
    setNewPassword("");
    setShowPassword(false);
    await checkPendingRequest();
  };

  const handleCreateAccount = async () => {
    setMode("create");
    setDialogOpen(true);
    setSaving(true);
    setNewPassword("");
    setShowPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-student-account", {
        body: {
          email: normalizedEmail,
          fullName: userName,
          recordId,
          recordType: userType,
        },
      });

      if (error) throw error;

      const linkedExisting = (data as any)?.linkedExisting === true;
      const tempPassword = (data as any)?.temporaryPassword as string | undefined;

      // If the email already existed, the backend links the account without changing password.
      if (!tempPassword) {
        if (linkedExisting) {
          setLocalHasAccount(true);
          toast.success("Conta já existia e foi vinculada. A senha não foi alterada; use a senha existente ou defina uma nova.");
          setDialogOpen(false);
          return;
        }

        throw new Error("Resposta inválida: senha temporária ausente");
      }

      setNewPassword(tempPassword);
      setLocalHasAccount(true);
      toast.success("Conta criada. Copie a senha temporária.");
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error?.message || "Erro ao criar conta");
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword) {
      toast.error("Defina uma senha");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    setSaving(true);
    try {
      // 1) Registar/auditar a senha definida (mantém o fluxo atual de pedidos)
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
        const { error } = await supabase.from("password_reset_requests").insert({
          email: normalizedEmail,
          user_type: userType,
          user_id: recordId,
          company_id: companyId,
          status: "approved",
          new_password: newPassword,
          reviewed_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      // 2) Aplicar de facto a senha à conta (backend)
      const { error: fnError } = await supabase.functions.invoke("create-student-account", {
        body: {
          email: normalizedEmail,
          fullName: userName,
          recordId,
          recordType: userType,
          forceResetPassword: true,
          password: newPassword,
        },
      });

      if (fnError) throw fnError;

      toast.success("Senha temporária definida e aplicada. O utilizador já pode fazer login.");
      setDialogOpen(false);
      setNewPassword("");
      setShowPassword(false);
    } catch (error: any) {
      console.error("Error saving password:", error);
      toast.error(error?.message || "Erro ao definir senha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Acesso ao Sistema
          </CardTitle>
          <CardDescription>
            {localHasAccount ? "Defina uma senha temporária" : "Criar conta de acesso e gerar senha"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!localHasAccount ? (
            <div className="flex items-start gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>Este utilizador ainda não possui conta de acesso.</span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {!localHasAccount ? (
              <Button variant="outline" onClick={handleCreateAccount} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Criar conta de acesso
              </Button>
            ) : (
              <Button variant="outline" onClick={handleOpenReset}>
                <KeyRound className="h-4 w-4 mr-2" />
                Definir nova senha
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {mode === "create" ? "Conta criada" : "Definir senha temporária"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Copie e guarde a senha temporária (será necessária para o primeiro login)."
                : "Defina uma nova senha para o utilizador (ele deve alterá-la no primeiro acesso)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Email:</p>
              <p className="font-medium">{userEmail}</p>
              <p className="text-xs text-muted-foreground mt-1">{userName}</p>
            </div>

            {mode === "reset" ? (
              <>
                {checking ? (
                  <div className="text-center py-2 text-muted-foreground">Verificando pedidos...</div>
                ) : pendingRequest && pendingRequest.status === "pending" ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Pedido de recuperação pendente
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                          Solicitado em{" "}
                          {format(new Date(pendingRequest.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: pt,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : pendingRequest && pendingRequest.status === "approved" && pendingRequest.new_password ? (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Última senha definida:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded border font-mono text-sm">
                        {pendingRequest.new_password}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(pendingRequest.new_password!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha temporária</Label>
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
                  <p className="text-xs text-muted-foreground">Mínimo: 8 caracteres.</p>
                </div>

                {newPassword ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">{newPassword}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newPassword)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Aplicado automaticamente</Badge>
                  <span>Esta ação atualiza a senha real da conta.</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Senha temporária:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-background rounded border font-mono text-sm">
                      {newPassword || "A gerar..."}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!newPassword}
                      onClick={() => copyToClipboard(newPassword)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  O utilizador deve fazer login com esta senha e depois alterá-la nas definições.
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            {mode === "reset" ? (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePassword} disabled={!newPassword || saving}>
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      A guardar...
                    </span>
                  ) : (
                    "Definir senha"
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setDialogOpen(false)}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
