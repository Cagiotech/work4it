import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Upload, Download, Trash2, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  document_type: string;
  description: string | null;
  expiry_date: string | null;
  created_at: string;
  file_path: string;
}

interface StaffDocumentsTabProps {
  staffId: string;
  canEdit: boolean;
}

const documentTypes = [
  { value: "contract", label: "Contrato" },
  { value: "id_card", label: "Cartão de Cidadão" },
  { value: "certificate", label: "Certificado" },
  { value: "cv", label: "Currículo" },
  { value: "diploma", label: "Diploma" },
  { value: "medical", label: "Atestado Médico" },
  { value: "insurance", label: "Seguro" },
  { value: "other", label: "Outro" },
];

export function StaffDocumentsTab({ staffId, canEdit }: StaffDocumentsTabProps) {
  const { user, company } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [newDocument, setNewDocument] = useState({
    type: "other",
    description: "",
    expiryDate: "",
  });

  useEffect(() => {
    fetchDocuments();
  }, [staffId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_documents")
        .select("*")
        .eq("staff_id", staffId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !company?.id) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ficheiro muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `staff/${staffId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("staff-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: dbError } = await supabase.from("staff_documents").insert({
        staff_id: staffId,
        company_id: company.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        document_type: newDocument.type,
        description: newDocument.description || null,
        expiry_date: newDocument.expiryDate || null,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast.success("Documento carregado!");
      setNewDocument({ type: "other", description: "", expiryDate: "" });
      fetchDocuments();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Erro ao carregar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      // Delete from storage
      await supabase.storage.from("staff-documents").remove([documentToDelete.file_path]);

      // Delete record
      const { error } = await supabase
        .from("staff_documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (error) throw error;

      toast.success("Documento eliminado!");
      fetchDocuments();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Erro ao eliminar documento");
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from("staff-documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Erro ao descarregar documento");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      {canEdit && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Carregar Documento</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select
                value={newDocument.type}
                onValueChange={(v) => setNewDocument({ ...newDocument, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={newDocument.description}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, description: e.target.value })
                }
                placeholder="Descrição do documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Validade (opcional)</Label>
              <Input
                type="date"
                value={newDocument.expiryDate}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, expiryDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <Label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center gap-2"
            >
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploading}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "A carregar..." : "Selecionar Ficheiro"}
              </Button>
              <span className="text-xs text-muted-foreground">
                Máx. 5MB (PDF, imagens)
              </span>
            </Label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
            />
          </div>
        </Card>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento carregado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{format(new Date(doc.created_at), "dd/MM/yyyy")}</span>
                    {doc.expiry_date && (
                      <>
                        <span>•</span>
                        <span
                          className={
                            new Date(doc.expiry_date) < new Date()
                              ? "text-destructive"
                              : ""
                          }
                        >
                          Expira: {format(new Date(doc.expiry_date), "dd/MM/yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    title="Descarregar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        setDocumentToDelete(doc);
                        setDeleteDialogOpen(true);
                      }}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{documentToDelete?.file_name}"? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
