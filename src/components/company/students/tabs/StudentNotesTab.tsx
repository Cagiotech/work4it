import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2, Lock, Unlock, Pencil } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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

interface Note {
  id: string;
  title: string | null;
  content: string;
  is_private: boolean;
  created_at: string;
  created_by: string;
}

interface StudentNotesTabProps {
  studentId: string;
  canEdit: boolean;
}

export function StudentNotesTab({ studentId, canEdit }: StudentNotesTabProps) {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", is_private: false });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [studentId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", is_private: false });
    setIsAdding(false);
    setEditingNote(null);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || "",
      content: note.content,
      is_private: note.is_private
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    setConfirmSave(false);
    if (!formData.content.trim()) {
      toast.error("O conteúdo da nota é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      if (editingNote) {
        const { error } = await supabase
          .from('student_notes')
          .update({
            title: formData.title || null,
            content: formData.content,
            is_private: formData.is_private
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success("Nota atualizada");
      } else {
        const { error } = await supabase
          .from('student_notes')
          .insert({
            student_id: studentId,
            created_by: user.id,
            title: formData.title || null,
            content: formData.content,
            is_private: formData.is_private
          });

        if (error) throw error;
        toast.success("Nota adicionada");
      }

      resetForm();
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar nota");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!confirmDeleteId) return;
    try {
      const { error } = await supabase
        .from('student_notes')
        .delete()
        .eq('id', confirmDeleteId);

      if (error) throw error;
      toast.success("Nota removida");
      setConfirmDeleteId(null);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover nota");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notas do Aluno
          </h3>
          {canEdit && !isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Nota
            </Button>
          )}
        </div>

        {isAdding && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da nota..."
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escreva a nota aqui..."
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {formData.is_private ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  <Label className="text-sm">Nota privada</Label>
                </div>
                <Switch
                  checked={formData.is_private}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={() => setConfirmSave(true)} disabled={saving}>
                  {saving ? "A guardar..." : editingNote ? "Atualizar Nota" : "Guardar Nota"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {notes.length === 0 && !isAdding && (
          <Card>
            <CardContent className="py-8 text-center">
              <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma nota registada para este aluno.
              </p>
              {canEdit && (
                <Button onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Primeira Nota
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {notes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {note.is_private && <Lock className="h-3 w-3 text-muted-foreground" />}
                  {note.title || "Sem título"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-normal">
                    {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", { locale: pt })}
                  </span>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEdit(note)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDeleteId(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirm Save Note */}
      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {editingNote ? "Atualização" : "Adição"}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {editingNote ? "atualizar" : "adicionar"} esta nota?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              {editingNote ? "Atualizar" : "Adicionar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Note */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta nota? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}