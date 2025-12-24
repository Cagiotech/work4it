import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ban, CheckCircle, Clock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    full_name: string;
    status: string | null;
    block_reason?: string | null;
  };
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo", icon: CheckCircle, color: "text-green-600", description: "Acesso total ao aplicativo" },
  { value: "inactive", label: "Inativo", icon: Clock, color: "text-gray-600", description: "Conta desativada temporariamente" },
  { value: "suspended", label: "Suspenso", icon: Ban, color: "text-red-600", description: "Acesso bloqueado ao aplicativo" },
];

const BLOCK_REASONS = [
  { value: "payment_pending", label: "Pagamento Pendente", description: "Mensalidade em atraso" },
  { value: "document_pending", label: "Documentação Pendente", description: "Falta de documentos obrigatórios" },
  { value: "rule_violation", label: "Violação de Regras", description: "Não cumprimento do regulamento" },
  { value: "other", label: "Outro Motivo", description: "Motivo personalizado" },
];

export function StudentStatusDialog({ open, onOpenChange, student, onUpdate }: StudentStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(student.status || "active");
  const [blockReason, setBlockReason] = useState(student.block_reason || "");
  const [selectedBlockReason, setSelectedBlockReason] = useState<string>(
    student.block_reason ? (BLOCK_REASONS.find(r => student.block_reason?.includes(r.value))?.value || "other") : ""
  );
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let finalBlockReason: string | null = null;
      let blockedAt: string | null = null;

      if (selectedStatus === "suspended") {
        if (selectedBlockReason === "other") {
          finalBlockReason = customReason || "Outro motivo";
        } else {
          const reason = BLOCK_REASONS.find(r => r.value === selectedBlockReason);
          finalBlockReason = reason ? `${selectedBlockReason}:${reason.label}` : selectedBlockReason;
        }
        blockedAt = new Date().toISOString();
      }

      const { error } = await supabase
        .from("students")
        .update({
          status: selectedStatus,
          block_reason: finalBlockReason,
          blocked_at: selectedStatus === "suspended" ? blockedAt : null,
        })
        .eq("id", student.id);

      if (error) throw error;

      toast.success("Status atualizado com sucesso");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[550px] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alterar Status do Aluno
          </DialogTitle>
          <DialogDescription>
            Altere o status de acesso de <strong>{student.full_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status da Conta</Label>
            <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-2">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStatus === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {selectedStatus === option.value && (
                      <Badge variant="secondary" className="text-xs">Selecionado</Badge>
                    )}
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {selectedStatus === "suspended" && (
            <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                Motivo da Suspensão
              </Label>
              <RadioGroup value={selectedBlockReason} onValueChange={setSelectedBlockReason} className="space-y-2">
                {BLOCK_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors bg-background ${
                      selectedBlockReason === reason.value
                        ? "border-destructive bg-destructive/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={reason.value} className="sr-only" />
                    {reason.value === "payment_pending" && <CreditCard className="h-4 w-4 text-amber-500" />}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{reason.label}</p>
                      <p className="text-xs text-muted-foreground">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {selectedBlockReason === "other" && (
                <div className="pt-2">
                  <Textarea
                    placeholder="Descreva o motivo da suspensão..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              )}

              {selectedBlockReason === "payment_pending" && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    O aluno verá as informações de pagamento MBWay da empresa e poderá enviar comprovativo de pagamento.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || (selectedStatus === "suspended" && !selectedBlockReason)}
            variant={selectedStatus === "suspended" ? "destructive" : "default"}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Guardando..." : "Confirmar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}