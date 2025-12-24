import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { KeyRound, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

interface PasswordResetRequestCardProps {
  userEmail: string;
  userName: string;
  companyId: string;
}

interface ResetRequest {
  id: string;
  created_at: string;
  status: string;
  reviewed_at: string | null;
  notes: string | null;
}

export function PasswordResetRequestCard({
  userEmail,
  userName,
  companyId,
}: PasswordResetRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastRequest, setLastRequest] = useState<ResetRequest | null>(null);

  useEffect(() => {
    if (userEmail) {
      fetchLastRequest();
    }
  }, [userEmail]);

  const fetchLastRequest = async () => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("id, created_at, status, reviewed_at, notes")
        .eq("email", userEmail.toLowerCase())
        .eq("user_type", "staff")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLastRequest(data);
    } catch (error) {
      console.error("Error fetching password reset request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!userEmail || !companyId) {
      toast.error("Dados incompletos para solicitar redefinição");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("password_reset_requests").insert({
        email: userEmail.toLowerCase(),
        user_type: "staff",
        company_id: companyId,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Pedido enviado! A administração irá analisar o seu pedido.");
      await fetchLastRequest();
    } catch (error: any) {
      console.error("Error submitting password reset request:", error);
      toast.error(error?.message || "Erro ao enviar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasPendingRequest = lastRequest?.status === "pending";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Solicitar Redefinição de Senha
        </CardTitle>
        <CardDescription>
          Caso não consiga alterar a senha diretamente, pode solicitar ajuda à administração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">A verificar pedidos...</span>
          </div>
        ) : (
          <>
            {lastRequest && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Último pedido</span>
                  {getStatusBadge(lastRequest.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Solicitado em{" "}
                  {format(new Date(lastRequest.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: pt,
                  })}
                </p>
                {lastRequest.status === "approved" && lastRequest.reviewed_at && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Aprovado em{" "}
                    {format(new Date(lastRequest.reviewed_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: pt,
                    })}
                    . A sua senha foi redefinida.
                  </p>
                )}
                {lastRequest.status === "rejected" && lastRequest.notes && (
                  <p className="text-xs text-destructive">
                    Motivo: {lastRequest.notes}
                  </p>
                )}
              </div>
            )}

            {hasPendingRequest ? (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p className="text-sm">
                  Já existe um pedido pendente. Aguarde a análise pela administração.
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Solicitar Redefinição
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
