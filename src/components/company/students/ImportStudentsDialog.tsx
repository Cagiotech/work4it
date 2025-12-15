import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

export function ImportStudentsDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess
}: ImportStudentsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = [
      'Nome Completo,Email,Telefone,Data de Nascimento,Género,NIF,NISS,Cartão de Cidadão',
      'João Silva,joao.silva@email.com,912345678,1990-05-15,Masculino,123456789,12345678901,12345678',
      'Maria Santos,maria.santos@email.com,913456789,1985-10-20,Feminino,987654321,98765432109,87654321'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_alunos.csv';
    link.click();
    toast.success('Modelo baixado!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast.error('Por favor, selecione um arquivo CSV ou Excel');
      return;
    }

    setFile(selectedFile);

    // Read and preview CSV
    if (selectedFile.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(0, 6);
        const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
        setPreview(rows);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(1).filter(line => line.trim());
        
        const students = lines.map(line => {
          const [fullName, email, phone, birthDate, gender, nif, niss, citizenCard] = line.split(',').map(cell => cell.trim());
          return {
            company_id: companyId,
            full_name: fullName,
            email: email || null,
            phone: phone || null,
            birth_date: birthDate || null,
            gender: gender || null,
            nif: nif || null,
            niss: niss || null,
            citizen_card: citizenCard || null,
            status: 'active'
          };
        }).filter(s => s.full_name);

        if (students.length === 0) {
          toast.error('Nenhum aluno válido encontrado no arquivo');
          setIsLoading(false);
          return;
        }

        const { error } = await supabase
          .from('students')
          .insert(students);

        if (error) throw error;

        toast.success(`${students.length} alunos importados com sucesso!`);
        onSuccess();
        onOpenChange(false);
        setFile(null);
        setPreview([]);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error('Erro ao importar alunos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Alunos
          </DialogTitle>
          <DialogDescription>
            Importe alunos em massa através de uma planilha CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Modelo de Planilha</p>
                <p className="text-xs text-muted-foreground">Baixe o modelo para preencher os dados</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Clique para selecionar</p>
                <p className="text-sm text-muted-foreground">ou arraste o arquivo aqui</p>
              </>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pré-visualização</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <tbody>
                    {preview.slice(0, 4).map((row, i) => (
                      <tr key={i} className={i === 0 ? 'bg-muted font-medium' : ''}>
                        {row.slice(0, 4).map((cell, j) => (
                          <td key={j} className="px-2 py-1 border-b truncate max-w-[100px]">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {preview.length - 1} alunos serão importados
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}