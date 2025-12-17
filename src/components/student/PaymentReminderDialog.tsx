import { useState, useRef } from "react";
import { AlertTriangle, Upload, CreditCard, Phone, Loader2, FileText, X, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OverdueSubscription {
  id: string;
  end_date: string;
  payment_status: string | null;
  subscription_plans: {
    name: string;
    price: number;
  };
}

interface PaymentReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  companyMbwayPhone: string | null;
  overdueSubscriptions: OverdueSubscription[];
  onProofSubmitted?: () => void;
}

export function PaymentReminderDialog({
  open,
  onOpenChange,
  studentId,
  companyMbwayPhone,
  overdueSubscriptions,
  onProofSubmitted,
}: PaymentReminderDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAmount = overdueSubscriptions.reduce(
    (sum, sub) => sum + (sub.subscription_plans?.price || 0),
    0
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O ficheiro não pode exceder 5MB");
        return;
      }
      if (!file.type.includes("image") && file.type !== "application/pdf") {
        toast.error("Apenas imagens ou PDF são permitidos");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Selecione um comprovante de pagamento");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Informe o valor do pagamento");
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${studentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create payment proof record
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          student_id: studentId,
          subscription_id: selectedSubscription || overdueSubscriptions[0]?.id || null,
          amount: parseFloat(amount),
          proof_file_path: fileName,
          proof_file_name: selectedFile.name,
          proof_file_type: selectedFile.type,
          notes: notes || null,
          status: "pending",
        });

      if (insertError) throw insertError;

      setSubmitted(true);
      toast.success("Comprovante enviado com sucesso! Aguarde a aprovação.");
      onProofSubmitted?.();
      
      // Reset form
      setSelectedFile(null);
      setAmount("");
      setNotes("");
      setSelectedSubscription("");
    } catch (error: any) {
      console.error("Error uploading proof:", error);
      toast.error("Erro ao enviar comprovante: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSubmitted(false);
      onOpenChange(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Comprovante Enviado!</h3>
            <p className="text-muted-foreground mb-6">
              O seu comprovante foi enviado e está a aguardar aprovação.
              Será notificado quando for aprovado.
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Pagamento em Atraso
          </DialogTitle>
          <DialogDescription>
            Tem pagamentos pendentes. Por favor, regularize a sua situação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overdue subscriptions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Pagamentos Pendentes:</h4>
            {overdueSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="font-medium text-sm">{sub.subscription_plans?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencido em: {new Date(sub.end_date).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-destructive">
                  €{sub.subscription_plans?.price || 0}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total em Atraso:</span>
              <span className="text-lg font-bold text-destructive">€{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* MB Way info */}
          {companyMbwayPhone && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-primary" />
                <span className="font-medium">Pagamento via MB Way</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Envie o pagamento para o número:
              </p>
              <p className="text-2xl font-bold text-primary text-center py-2">
                {companyMbwayPhone}
              </p>
            </div>
          )}

          {/* Upload proof section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Enviar Comprovante de Pagamento:</h4>

            {overdueSubscriptions.length > 1 && (
              <div className="space-y-2">
                <Label>Selecione o plano (opcional)</Label>
                <select
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Todos os pagamentos</option>
                  {overdueSubscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subscription_plans?.name} - €{sub.subscription_plans?.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Valor Pago (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Comprovante (PDF ou Imagem) *</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Ficheiro
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Máximo 5MB. Formatos: JPG, PNG, PDF</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione alguma observação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={uploading}
            >
              Fechar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={uploading || !selectedFile || !amount}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A enviar...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Comprovante
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
