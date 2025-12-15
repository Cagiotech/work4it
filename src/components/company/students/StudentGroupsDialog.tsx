import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Student {
  id: string;
  full_name: string;
  email: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  color: string;
  members: { id: string; student_id: string; student: Student }[];
}

interface StudentGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  students: Student[];
}

const colorOptions = [
  "#aeca12", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

export function StudentGroupsDialog({
  open,
  onOpenChange,
  companyId,
  students
}: StudentGroupsDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#aeca12",
    selectedStudents: [] as string[]
  });

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_groups')
        .select(`
          *,
          members:student_group_members(
            id,
            student_id,
            student:students(id, full_name, email)
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open, companyId]);

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color,
      selectedStudents: group.members.map(m => m.student_id)
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingGroup(null);
    setFormData({
      name: "",
      description: "",
      color: "#aeca12",
      selectedStudents: []
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        // Update group
        const { error: updateError } = await supabase
          .from('student_groups')
          .update({
            name: formData.name,
            description: formData.description || null,
            color: formData.color
          })
          .eq('id', editingGroup.id);

        if (updateError) throw updateError;

        // Delete existing members
        await supabase
          .from('student_group_members')
          .delete()
          .eq('group_id', editingGroup.id);

        // Add new members
        if (formData.selectedStudents.length > 0) {
          const { error: membersError } = await supabase
            .from('student_group_members')
            .insert(formData.selectedStudents.map(studentId => ({
              group_id: editingGroup.id,
              student_id: studentId
            })));

          if (membersError) throw membersError;
        }

        toast.success('Grupo atualizado!');
      } else {
        // Create group
        const { data: newGroup, error: createError } = await supabase
          .from('student_groups')
          .insert({
            company_id: companyId,
            name: formData.name,
            description: formData.description || null,
            color: formData.color
          })
          .select()
          .single();

        if (createError) throw createError;

        // Add members
        if (formData.selectedStudents.length > 0) {
          const { error: membersError } = await supabase
            .from('student_group_members')
            .insert(formData.selectedStudents.map(studentId => ({
              group_id: newGroup.id,
              student_id: studentId
            })));

          if (membersError) throw membersError;
        }

        toast.success('Grupo criado!');
      }

      setShowForm(false);
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Erro ao salvar grupo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', deleteConfirm);

      if (error) throw error;
      toast.success('Grupo excluído!');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Erro ao excluir grupo');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleStudent = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Grupos de Alunos
            </DialogTitle>
            <DialogDescription>
              Organize alunos em grupos para inscrição em aulas
            </DialogDescription>
          </DialogHeader>

          {showForm ? (
            <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
              <div className="space-y-2">
                <Label>Nome do Grupo *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Turma da Manhã"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-7 h-7 rounded-full transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-hidden">
                <Label>Membros ({formData.selectedStudents.length} selecionados)</Label>
                <ScrollArea className="h-[200px] border rounded-lg p-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={formData.selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <span className="text-sm">{student.full_name}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingGroup ? 'Salvar' : 'Criar')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum grupo criado</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium">{group.name}</h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(group)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteConfirm(group.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-xs text-muted-foreground">{group.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {group.members.length} membros
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <Button onClick={handleNew} className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Novo Grupo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os alunos não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}