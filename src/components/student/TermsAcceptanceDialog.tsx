import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TermsAcceptanceDialogProps {
  open: boolean;
  studentId: string;
  companyId: string;
  companyName: string;
  termsText: string | null;
  regulationsText: string | null;
  onAccepted: () => void;
}

export function TermsAcceptanceDialog({
  open,
  studentId,
  companyId,
  companyName,
  termsText,
  regulationsText,
  onAccepted,
}: TermsAcceptanceDialogProps) {
  const { t } = useTranslation();
  const [termsChecked, setTermsChecked] = useState(false);
  const [regulationsChecked, setRegulationsChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasTerms = !!termsText;
  const hasRegulations = !!regulationsText;

  const canAccept = (!hasTerms || termsChecked) && (!hasRegulations || regulationsChecked);

  const handleAccept = async () => {
    if (!canAccept) return;

    setSaving(true);
    try {
      const documentsToInsert = [];
      const now = new Date().toISOString();

      if (hasTerms && termsChecked) {
        documentsToInsert.push({
          student_id: studentId,
          company_id: companyId,
          document_type: 'terms',
          document_content: termsText,
          signed_at: now,
        });
      }

      if (hasRegulations && regulationsChecked) {
        documentsToInsert.push({
          student_id: studentId,
          company_id: companyId,
          document_type: 'regulations',
          document_content: regulationsText,
          signed_at: now,
        });
      }

      if (documentsToInsert.length > 0) {
        const { error: docsError } = await supabase
          .from('signed_documents')
          .insert(documentsToInsert);

        if (docsError) throw docsError;
      }

      // Update student record
      const { error: updateError } = await supabase
        .from('students')
        .update({ terms_accepted_at: now })
        .eq('id', studentId);

      if (updateError) throw updateError;

      toast.success("Termos aceites com sucesso!");
      onAccepted();
    } catch (error: any) {
      console.error('Error accepting terms:', error);
      toast.error(error.message || "Erro ao aceitar termos");
    } finally {
      setSaving(false);
    }
  };

  const defaultTerms = `
TERMOS E CONDIÇÕES DE UTILIZAÇÃO

1. ACEITAÇÃO DOS TERMOS
Ao aceder e utilizar os serviços de ${companyName}, o utilizador concorda com os presentes termos e condições.

2. SERVIÇOS
${companyName} oferece serviços de fitness e bem-estar, incluindo mas não limitado a aulas de grupo, treino personalizado e acesso a equipamentos.

3. RESPONSABILIDADES DO UTILIZADOR
- Manter os dados pessoais atualizados
- Informar sobre qualquer condição de saúde relevante
- Seguir as instruções dos profissionais
- Respeitar as normas de utilização das instalações

4. SAÚDE E SEGURANÇA
O utilizador declara estar em condições de saúde adequadas para a prática de exercício físico e assume total responsabilidade pela sua participação nas atividades.

5. PROTEÇÃO DE DADOS
Os dados pessoais serão tratados de acordo com o Regulamento Geral de Proteção de Dados (RGPD).

6. ALTERAÇÕES
${companyName} reserva-se o direito de alterar estes termos a qualquer momento, notificando os utilizadores das alterações.
  `.trim();

  const defaultRegulations = `
REGULAMENTO INTERNO

1. HORÁRIO DE FUNCIONAMENTO
Consulte os horários de funcionamento no local ou na aplicação.

2. UTILIZAÇÃO DAS INSTALAÇÕES
- É obrigatório o uso de roupa e calçado adequados
- A utilização de toalha é obrigatória nos equipamentos
- Respeitar o tempo de utilização dos equipamentos

3. HIGIENE
- Tomar duche antes de utilizar a piscina (quando aplicável)
- Manter as instalações limpas

4. COMPORTAMENTO
- Manter um comportamento adequado
- Não é permitido o uso de linguagem imprópria
- Respeitar os outros utilizadores e funcionários

5. OBJETOS PESSOAIS
${companyName} não se responsabiliza por objetos deixados nas instalações.

6. SANÇÕES
O incumprimento deste regulamento pode resultar em suspensão ou expulsão.
  `.trim();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Termos e Regulamento
          </DialogTitle>
          <DialogDescription>
            Para continuar, leia e aceite os termos e regulamento de {companyName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Terms Section */}
          {(hasTerms || !hasRegulations) && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Termos e Condições</h3>
              <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/30">
                <pre className="text-xs whitespace-pre-wrap font-sans">
                  {termsText || defaultTerms}
                </pre>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsChecked}
                  onCheckedChange={(checked) => setTermsChecked(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  Li e aceito os Termos e Condições
                </Label>
              </div>
            </div>
          )}

          {/* Regulations Section */}
          {(hasRegulations || !hasTerms) && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Regulamento Interno</h3>
              <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/30">
                <pre className="text-xs whitespace-pre-wrap font-sans">
                  {regulationsText || defaultRegulations}
                </pre>
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regulations"
                  checked={regulationsChecked}
                  onCheckedChange={(checked) => setRegulationsChecked(checked as boolean)}
                />
                <Label htmlFor="regulations" className="text-sm cursor-pointer">
                  Li e aceito o Regulamento Interno
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!canAccept || saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A processar...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aceitar e Continuar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
