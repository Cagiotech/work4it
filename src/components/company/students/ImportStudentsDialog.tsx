import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, X, Loader2, AlertTriangle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

interface ParsedStudent {
  company_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  nif: string | null;
  niss: string | null;
  citizen_card: string | null;
  status: string;
}

interface DuplicateInfo {
  email: string;
  existingName: string;
  newName: string;
  existingId: string;
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
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Create workbook and worksheet
    const templateData = [
      ['Nome Completo', 'Email', 'Telefone', 'Data de Nascimento', 'Género', 'NIF', 'NISS', 'Cartão de Cidadão'],
      ['João Silva', 'joao.silva@email.com', '912345678', '1990-05-15', 'Masculino', '123456789', '12345678901', '12345678'],
      ['Maria Santos', 'maria.santos@email.com', '913456789', '1985-10-20', 'Feminino', '987654321', '98765432109', '87654321'],
      ['Pedro Costa', 'pedro.costa@email.com', '914567890', '1995-03-10', 'Masculino', '456789123', '45678912345', '45678901']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Nome Completo
      { wch: 25 }, // Email
      { wch: 12 }, // Telefone
      { wch: 18 }, // Data de Nascimento
      { wch: 12 }, // Género
      { wch: 12 }, // NIF
      { wch: 14 }, // NISS
      { wch: 16 }, // Cartão de Cidadão
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');
    
    XLSX.writeFile(wb, 'modelo_importacao_alunos.xlsx');
    toast.success('Modelo baixado com sucesso!');
  };

  const parseXlsxFile = async (file: File): Promise<string[][]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    return jsonData.map(row => row.map(cell => String(cell ?? '').trim()));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Por favor, selecione um arquivo CSV ou Excel');
      return;
    }

    setFile(selectedFile);
    setDuplicates([]);
    setParsedStudents([]);

    try {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const rows = await parseXlsxFile(selectedFile);
        setPreview(rows.slice(0, 6));
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim()).slice(0, 6);
          const delimiter = lines[0]?.includes(';') ? ';' : ',';
          const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, '')));
          setPreview(rows);
        };
        reader.readAsText(selectedFile, 'UTF-8');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Erro ao ler o arquivo');
    }
  };

  const parseFile = async (): Promise<ParsedStudent[]> => {
    if (!file) return [];
    
    let rows: string[][] = [];
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      rows = await parseXlsxFile(file);
    } else {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const delimiter = lines[0]?.includes(';') ? ';' : ',';
      rows = lines.map(line => line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, '')));
    }
    
    if (rows.length < 2) return [];
    
    const dataRows = rows.slice(1);
    
    return dataRows.map(cells => {
      const [fullName, email, phone, birthDate, gender, nif, niss, citizenCard] = cells;
      return {
        company_id: companyId,
        full_name: fullName || '',
        email: email || null,
        phone: phone || null,
        birth_date: birthDate && birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? birthDate : null,
        gender: gender || null,
        nif: nif || null,
        niss: niss || null,
        citizen_card: citizenCard || null,
        status: 'active'
      };
    }).filter(s => s.full_name.length > 0);
  };

  const checkDuplicates = async (students: ParsedStudent[]): Promise<DuplicateInfo[]> => {
    const emails = students.map(s => s.email).filter(Boolean) as string[];
    if (emails.length === 0) return [];

    const { data: existingStudents } = await supabase
      .from('students')
      .select('id, email, full_name')
      .eq('company_id', companyId)
      .in('email', emails);

    if (!existingStudents || existingStudents.length === 0) return [];

    return existingStudents.map(existing => {
      const newStudent = students.find(s => s.email?.toLowerCase() === existing.email?.toLowerCase());
      return {
        email: existing.email!,
        existingName: existing.full_name,
        newName: newStudent?.full_name || '',
        existingId: existing.id
      };
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const students = await parseFile();
      
      if (students.length === 0) {
        toast.error('Nenhum aluno válido encontrado no arquivo');
        setIsLoading(false);
        return;
      }

      setParsedStudents(students);
      
      const foundDuplicates = await checkDuplicates(students);
      
      if (foundDuplicates.length > 0) {
        setDuplicates(foundDuplicates);
        setShowDuplicateDialog(true);
        setIsLoading(false);
        return;
      }

      await executeImport(students, []);
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error('Erro ao importar alunos');
      setIsLoading(false);
    }
  };

  const executeImport = async (students: ParsedStudent[], duplicatesToUpdate: DuplicateInfo[]) => {
    setIsLoading(true);
    try {
      const duplicateEmails = duplicatesToUpdate.map(d => d.email.toLowerCase());
      
      // Filter out duplicates if not overwriting
      const studentsToInsert = overwriteDuplicates 
        ? students.filter(s => !duplicateEmails.includes(s.email?.toLowerCase() || ''))
        : students.filter(s => !duplicateEmails.includes(s.email?.toLowerCase() || ''));

      // Update existing students if overwriting
      if (overwriteDuplicates && duplicatesToUpdate.length > 0) {
        for (const dup of duplicatesToUpdate) {
          const newData = students.find(s => s.email?.toLowerCase() === dup.email.toLowerCase());
          if (newData) {
            await supabase
              .from('students')
              .update({
                full_name: newData.full_name,
                phone: newData.phone,
                birth_date: newData.birth_date,
                gender: newData.gender,
                nif: newData.nif,
                niss: newData.niss,
                citizen_card: newData.citizen_card,
              })
              .eq('id', dup.existingId);
          }
        }
      }

      // Insert new students
      if (studentsToInsert.length > 0) {
        const { error } = await supabase
          .from('students')
          .insert(studentsToInsert);

        if (error) throw error;
      }

      const updatedCount = overwriteDuplicates ? duplicatesToUpdate.length : 0;
      const insertedCount = studentsToInsert.length;
      
      if (updatedCount > 0 && insertedCount > 0) {
        toast.success(`${insertedCount} alunos criados e ${updatedCount} atualizados!`);
      } else if (updatedCount > 0) {
        toast.success(`${updatedCount} alunos atualizados!`);
      } else {
        toast.success(`${insertedCount} alunos importados com sucesso!`);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error('Erro ao importar alunos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateConfirm = () => {
    setShowDuplicateDialog(false);
    executeImport(parsedStudents, overwriteDuplicates ? duplicates : []);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setParsedStudents([]);
    setDuplicates([]);
    setOverwriteDuplicates(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Alunos
            </DialogTitle>
            <DialogDescription>
              Importe alunos em massa através de uma planilha Excel (.xlsx)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Password Warning */}
            <div className="p-3 border rounded-lg bg-amber-500/10 border-amber-500/30">
              <div className="flex items-start gap-2">
                <Key className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Senha Temporária</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Alunos importados com email receberão a senha temporária <strong>12345678</strong> que deverá ser alterada no primeiro acesso.
                  </p>
                </div>
              </div>
            </div>

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
                accept=".csv,.xlsx,.xls"
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

      {/* Duplicate Warning Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alunos Duplicados Encontrados
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Foram encontrados {duplicates.length} aluno(s) com emails já cadastrados:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {duplicates.map((dup, i) => (
                    <div key={i} className="text-xs p-2 bg-muted rounded">
                      <strong>{dup.email}</strong>
                      <br />
                      <span className="text-muted-foreground">
                        Existente: {dup.existingName} → Novo: {dup.newName}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteDuplicates}
                    onCheckedChange={(checked) => setOverwriteDuplicates(checked === true)}
                  />
                  <label htmlFor="overwrite" className="text-sm cursor-pointer">
                    Sobrescrever dados dos alunos duplicados
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se não marcar, os alunos duplicados serão ignorados.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDuplicateDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateConfirm}>
              Continuar Importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
