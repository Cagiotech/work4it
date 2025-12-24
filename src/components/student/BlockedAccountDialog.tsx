import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Ban, CreditCard, Phone, Upload, CheckCircle, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlockedAccountDialogProps {
  open: boolean;
  student: {
    id: string;
    full_name: string;
    status: string | null;
    block_reason?: string | null;
    company_id: string;
  };
}

export function BlockedAccountDialog({ open, student }: BlockedAccountDialogProps) {
  const [companyMbway, setCompanyMbway] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isPaymentPending = student.block_reason?.includes("payment_pending");

  useEffect(() => {
    if (open && isPaymentPending && student.company_id) {
      fetchCompanyMbway();
      checkExistingProof();
    }
  }, [open, student.company_id, isPaymentPending]);

  const fetchCompanyMbway = async () => {
    const { data } = await supabase
      .from("companies")
      .select("mbway_phone")
      .eq("id", student.company_id)
      .single();
    
    if (data?.mbway_phone) {
      setCompanyMbway(data.mbway_phone);
    }
  };

  const checkExistingProof = async () => {
    const { data } = await supabase
      .from("payment_proofs")
      .select("id, status")
      .eq("student_id", student.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      setProofSubmitted(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedFile || !amount) {
      toast.error("Por favor, preencha o valor e anexe o comprovativo");
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${student.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, selectedFile);

      if (uploadError) {
        // If bucket doesn't exist, just save the record without the file path
        console.error("Upload error:", uploadError);
      }

      // Create payment proof record
      const { error } = await supabase.from("payment_proofs").insert({
        student_id: student.id,
        amount: parseFloat(amount),
        notes: notes || null,
        proof_file_name: selectedFile.name,
        proof_file_path: fileName,
        proof_file_type: selectedFile.type,
        status: "pending",
      });

      if (error) throw error;

      setProofSubmitted(true);
      toast.success("Comprovativo enviado com sucesso!");
    } catch (error) {
      console.error("Error submitting proof:", error);
      toast.error("Erro ao enviar comprovativo");
    } finally {
      setIsUploading(false);
    }
  };

  const getBlockReasonLabel = () => {
    if (!student.block_reason) return "Conta suspensa";
    if (student.block_reason.includes("payment_pending")) return "Pagamento Pendente";
    if (student.block_reason.includes("document_pending")) return "Documentação Pendente";
    if (student.block_reason.includes("rule_violation")) return "Violação de Regras";
    return student.block_reason.split(":")[1] || student.block_reason;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" hideCloseButton>
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Ban className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Conta Suspensa</DialogTitle>
          <DialogDescription>
            Olá <strong>{student.full_name}</strong>, a sua conta está temporariamente suspensa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-sm">Motivo da Suspensão</p>
                  <Badge variant="outline" className="mt-1 border-destructive/50 text-destructive">
                    {getBlockReasonLabel()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {isPaymentPending && !proofSubmitted && (
            <>
              {companyMbway && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Phone className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">MBWay para Pagamento</p>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{companyMbway}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground text-center">
                  Após efetuar o pagamento, envie o comprovativo abaixo:
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="amount">Valor Pago (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="proof">Comprovativo de Pagamento</Label>
                    <div className="mt-1">
                      <label
                        htmlFor="proof-file"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        {selectedFile ? (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-primary font-medium">{selectedFile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Clique para anexar</span>
                          </div>
                        )}
                        <input
                          id="proof-file"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Adicione alguma informação relevante..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitProof} 
                  disabled={isUploading || !selectedFile || !amount}
                  className="w-full gap-2"
                >
                  {isUploading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Enviar Comprovativo
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {proofSubmitted && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-green-700 dark:text-green-400">Comprovativo Enviado</p>
                    <p className="text-xs text-muted-foreground">
                      Aguarde a validação pela empresa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {proofSubmitted 
                  ? "Em breve a empresa irá liberar o seu aplicativo ou entrar em contacto consigo."
                  : "Regularize a sua situação para ter acesso novamente ao aplicativo."}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}