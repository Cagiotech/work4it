import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface StudentSecurityTabProps {
  studentId: string;
  studentEmail: string | null;
  studentName: string;
  companyId: string;
  hasAccount: boolean;
  onUpdate: () => void;
}

type PendingRequest = {
  id: string;
  created_at: string;
  status: string;
  new_password?: string | null;
} | null;

export function StudentSecurityTab({
  studentId,
  studentEmail,
  studentName,
  companyId,
  hasAccount,
  onUpdate,
}: StudentSecurityTabProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>(null);
  const [checking, setChecking] = useState(true);
  const [localHasAccount, setLocalHasAccount] = useState(hasAccount);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    setLocalHasAccount(hasAccount);
  }, [hasAccount]);

  useEffect(() => {
    if (studentEmail) {
      checkPendingRequest();
    } else {
      setChecking(false);
    }
  }, [studentEmail]);

  const normalizedEmail = studentEmail?.toLowerCase() || "";

  const checkPendingRequest = async () => {
    if (!studentEmail) return;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("id, created_at, status, new_password")
        .eq("email", normalizedEmail)
        .eq("user_type", "student")
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
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleCreateAccount = async () => {
    if (!studentEmail) {
      toast.error("O aluno precisa ter um email definido");
      return;
    }

    setCreatingAccount(true);
    setTempPassword(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-student-account", {
        body: {
          email: normalizedEmail,
          fullName: studentName,
          recordId: studentId,
          recordType: "student",
        },
      });

      if (error) throw error;

      const linkedExisting = (data as any)?.linkedExisting === true;
      const password = (data as any)?.temporaryPassword as string | undefined;

      if (linkedExisting && !password) {
        setLocalHasAccount(true);
        toast.success("Conta já existia e foi vinculada. Use 'Definir nova senha' se precisar.");
        onUpdate();
        return;
      }

      if (password) {
        setTempPassword(password);
        setLocalHasAccount(true);
        toast.success("Conta criada com sucesso!");
        onUpdate();
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error?.message || "Erro ao criar conta");
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword) {
      toast.error("Digite uma senha");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (!studentEmail) {
      toast.error("O aluno precisa ter um email definido");
      return;
    }

    setSaving(true);
    try {
      // Register password request for audit
      if (pendingRequest && pendingRequest.status === "pending") {
        await supabase
          .from("password_reset_requests")
          .update({
            status: "approved",
            new_password: newPassword,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", pendingRequest.id);
      } else {
        await supabase.from("password_reset_requests").insert({
          email: normalizedEmail,
          user_type: "student",
          user_id: studentId,
          company_id: companyId,
          status: "approved",
          new_password: newPassword,
          reviewed_at: new Date().toISOString(),
        });
      }

      // Apply password to account
      const { error: fnError } = await supabase.functions.invoke("create-student-account", {
        body: {
          email: normalizedEmail,
          fullName: studentName,
          recordId: studentId,
          recordType: "student",
          forceResetPassword: true,
          password: newPassword,
        },
      });

      if (fnError) throw fnError;

      toast.success("Senha definida com sucesso!");
      setNewPassword("");
      setShowPassword(false);
      setTempPassword(null);
      await checkPendingRequest();
    } catch (error: any) {
      console.error("Error saving password:", error);
      toast.error(error?.message || "Erro ao definir senha");
    } finally {
      setSaving(false);
    }
  };

  if (!studentEmail) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Email não definido</h3>
                <p className="text-muted-foreground mt-1">
                  Para criar uma conta de acesso, primeiro é necessário definir um email para este aluno
                  na aba de Perfil.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Estado da Conta
          </CardTitle>
          <CardDescription>
            Informações sobre a conta de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {localHasAccount ? (
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-red-500/20">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {localHasAccount ? "Conta ativa" : "Sem conta de acesso"}
                </p>
                <p className="text-sm text-muted-foreground">{studentEmail}</p>
              </div>
            </div>
            {localHasAccount && (
              <Badge variant="outline" className="border-green-500 text-green-600">
                Vinculada
              </Badge>
            )}
          </div>

          {!localHasAccount && (
            <Button
              onClick={handleCreateAccount}
              disabled={creatingAccount}
              className="w-full"
            >
              {creatingAccount ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A criar conta...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta de Acesso
                </>
              )}
            </Button>
          )}

          {/* Temp password display after creation */}
          {tempPassword && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Conta criada com sucesso!</span>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Senha temporária:</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2.5 bg-background rounded border font-mono text-sm">
                    {tempPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(tempPassword)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Guarde esta senha. O utilizador deve alterá-la no primeiro acesso.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Management Card */}
      {localHasAccount && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Gestão de Senha
            </CardTitle>
            <CardDescription>
              Defina uma nova senha temporária para o utilizador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending request info */}
            {checking ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                A verificar pedidos...
              </div>
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
            ) : pendingRequest &&
              pendingRequest.status === "approved" &&
              pendingRequest.new_password ? (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium text-muted-foreground mb-2">
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
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : null}

            <Separator />

            {/* New password form */}
            <div className="space-y-3">
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
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo: 8 caracteres</p>
            </div>

            {/* Password preview */}
            {newPassword && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <code className="flex-1 font-mono text-sm">{newPassword}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newPassword)}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}

            <Button
              onClick={handleSetPassword}
              disabled={!newPassword || saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A definir...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Definir Senha
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              A senha será aplicada imediatamente. O utilizador poderá fazer login de seguida.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
