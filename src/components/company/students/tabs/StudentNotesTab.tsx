import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

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
  const [newNote, setNewNote] = useState({ title: "", content: "", is_private: false });
  const [saving, setSaving] = useState(false);

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

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast.error("O conteúdo da nota é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from('student_notes')
        .insert({
          student_id: studentId,
          created_by: user.id,
          title: newNote.title || null,
          content: newNote.content,
          is_private: newNote.is_private
        });

      if (error) throw error;
      toast.success("Nota adicionada");
      setNewNote({ title: "", content: "", is_private: false });
      setIsAdding(false);
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar nota");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('student_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast.success("Nota removida");
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover nota");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  return (
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
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Título da nota..."
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Escreva a nota aqui..."
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {newNote.is_private ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                <Label className="text-sm">Nota privada</Label>
              </div>
              <Switch
                checked={newNote.is_private}
                onCheckedChange={(checked) => setNewNote({ ...newNote, is_private: checked })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddNote} disabled={saving}>
                {saving ? "A guardar..." : "Guardar Nota"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 && !isAdding && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma nota registada para este aluno.
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
  );
}
