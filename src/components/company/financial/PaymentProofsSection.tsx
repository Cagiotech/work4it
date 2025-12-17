import { useState, useEffect } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Check, X, Eye, Download, Clock, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentProof {
  id: string;
  student_id: string;
  subscription_id: string | null;
  transaction_id: string | null;
  amount: number;
  proof_file_path: string;
  proof_file_name: string;
  proof_file_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  student?: { full_name: string; email: string | null };
}

interface PaymentProofsSectionProps {
  companyId: string;
}

export function PaymentProofsSection({ companyId }: PaymentProofsSectionProps) {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      // First get all students for this company
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('company_id', companyId);

      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        const { data: proofsData, error: proofsError } = await supabase
          .from('payment_proofs')
          .select(`
            *,
            student:students(full_name, email)
          `)
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });

        if (proofsError) throw proofsError;
        setProofs(proofsData || []);
      } else {
        setProofs([]);
      }
    } catch (error) {
      console.error('Error fetching payment proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchProofs();
    }
  }, [companyId]);

  const handleViewProof = async (proof: PaymentProof) => {
    setSelectedProof(proof);
    setReviewNotes(proof.notes || "");

    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(proof.proof_file_path, 3600);

      if (error) throw error;
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error('Erro ao carregar comprovante');
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedProof) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('payment_proofs')
        .update({
          status: approved ? 'approved' : 'rejected',
          notes: reviewNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedProof.id);

      if (error) throw error;

      // If approved and has transaction_id, update the transaction status
      if (approved && selectedProof.transaction_id) {
        await supabase
          .from('financial_transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', selectedProof.transaction_id);
      }

      toast.success(approved ? 'Comprovante aprovado!' : 'Comprovante rejeitado');
      fetchProofs();
      setSelectedProof(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error reviewing proof:', error);
      toast.error('Erro ao processar comprovante');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "border-yellow-500 text-yellow-600 bg-yellow-500/10",
      approved: "border-green-500 text-green-600 bg-green-500/10",
      rejected: "border-red-500 text-red-600 bg-red-500/10",
    };
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };
    return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
  };

  const pendingCount = proofs.filter(p => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-700 dark:text-yellow-400">
                {pendingCount} comprovante(s) aguardando aprovação
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Comprovantes de Pagamento ({proofs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proofs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum comprovante enviado pelos alunos
            </p>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ficheiro</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proofs.map((proof) => (
                    <TableRow key={proof.id} className={proof.status === 'pending' ? 'bg-yellow-500/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{proof.student?.full_name || 'Aluno'}</p>
                            {proof.student?.email && (
                              <p className="text-xs text-muted-foreground">{proof.student.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        €{Number(proof.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{proof.proof_file_name}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(proof.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </TableCell>
                      <TableCell>{getStatusBadge(proof.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewProof(proof)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver comprovante</TooltipContent>
                          </Tooltip>
                          {proof.status === 'pending' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                    onClick={() => { setSelectedProof(proof); handleReview(true); }}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aprovar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={() => { setSelectedProof(proof); handleReview(false); }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rejeitar</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* View/Review Dialog */}
      <Dialog open={!!selectedProof && !!previewUrl} onOpenChange={() => { setSelectedProof(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Aluno:</span>
                  <p className="font-medium">{selectedProof.student?.full_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-bold text-green-600">€{Number(selectedProof.amount).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data de Envio:</span>
                  <p>{format(new Date(selectedProof.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedProof.status)}</div>
                </div>
              </div>

              {previewUrl && (
                <div className="border rounded-lg p-2 bg-muted/50">
                  {selectedProof.proof_file_type.startsWith('image/') ? (
                    <img src={previewUrl} alt="Comprovante" className="max-w-full h-auto mx-auto" />
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">{selectedProof.proof_file_name}</p>
                      <Button asChild variant="outline">
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Abrir Ficheiro
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedProof.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Adicionar notas sobre a revisão..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedProof?.status === 'pending' ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleReview(false)}
                  disabled={processing}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button 
                  onClick={() => handleReview(true)}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => { setSelectedProof(null); setPreviewUrl(null); }}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
