import { useState, useEffect } from "react";
import { Plus, X, Dumbbell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClassType {
  id: string;
  name: string;
  color: string;
  duration_minutes: number;
  default_instructor_id: string | null;
}

interface StudentClass {
  id: string;
  class_id: string;
  is_active: boolean;
  notes: string | null;
  assigned_at: string;
  class: {
    id: string;
    name: string;
    color: string;
    duration_minutes: number;
    default_instructor_id: string | null;
  };
  assigned_by_staff?: {
    full_name: string;
  } | null;
}

interface StudentClassesTabProps {
  studentId: string;
  companyId: string;
  canEdit: boolean;
}

export function StudentClassesTab({ studentId, companyId, canEdit }: StudentClassesTabProps) {
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch student's assigned classes
      const { data: assigned, error: assignedError } = await supabase
        .from('student_classes')
        .select(`
          id,
          class_id,
          is_active,
          notes,
          assigned_at,
          class:classes(id, name, color, duration_minutes, default_instructor_id),
          assigned_by_staff:staff(full_name)
        `)
        .eq('student_id', studentId)
        .eq('is_active', true);

      if (assignedError) throw assignedError;
      setStudentClasses(assigned || []);

      // Fetch all available classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, color, duration_minutes, default_instructor_id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (classesError) throw classesError;
      setAvailableClasses(classes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar modalidades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!selectedClassId) {
      toast.error('Selecione uma modalidade');
      return;
    }

    setIsSaving(true);
    try {
      // Get current staff id if available
      const { data: { user } } = await supabase.auth.getUser();
      let staffId = null;
      
      if (user) {
        const { data: staff } = await supabase
          .from('staff')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        staffId = staff?.id;
      }

      const { error } = await supabase
        .from('student_classes')
        .upsert({
          student_id: studentId,
          class_id: selectedClassId,
          assigned_by: staffId,
          notes: notes || null,
          is_active: true,
        }, {
          onConflict: 'student_id,class_id'
        });

      if (error) throw error;

      toast.success('Modalidade atribuída com sucesso');
      setShowAddDialog(false);
      setSelectedClassId('');
      setNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding class:', error);
      toast.error('Erro ao atribuir modalidade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveClass = async (studentClassId: string) => {
    try {
      const { error } = await supabase
        .from('student_classes')
        .update({ is_active: false })
        .eq('id', studentClassId);

      if (error) throw error;

      toast.success('Modalidade removida');
      fetchData();
    } catch (error) {
      console.error('Error removing class:', error);
      toast.error('Erro ao remover modalidade');
    }
  };

  // Filter out already assigned classes
  const unassignedClasses = availableClasses.filter(
    c => !studentClasses.some(sc => sc.class_id === c.id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Modalidades Atribuídas</h3>
        {canEdit && unassignedClasses.length > 0 && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar
          </Button>
        )}
      </div>

      {studentClasses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhuma modalidade atribuída a este aluno.
            </p>
            {canEdit && unassignedClasses.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Atribuir Modalidade
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {studentClasses.map((sc) => (
            <Card 
              key={sc.id} 
              className="border-l-4"
              style={{ borderLeftColor: sc.class?.color || '#aeca12' }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{sc.class?.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{sc.class?.duration_minutes} min</span>
                    </div>
                    {sc.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {sc.notes}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRemoveClass(sc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atribuir Modalidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre esta atribuição..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddClass} disabled={isSaving || !selectedClassId}>
              {isSaving ? 'Guardando...' : 'Atribuir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
