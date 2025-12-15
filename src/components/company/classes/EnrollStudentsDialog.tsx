import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, User, X } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ClassSchedule {
  id: string;
  class_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  class: {
    name: string;
    capacity: number;
  };
  enrollments_count: number;
}

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  status: string | null;
}

interface Enrollment {
  id: string;
  student_id: string;
  status: string;
  student: Student;
}

interface EnrollStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ClassSchedule | null;
  onSuccess: () => void;
}

export function EnrollStudentsDialog({ open, onOpenChange, schedule, onSuccess }: EnrollStudentsDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    if (open && profile?.company_id && schedule) {
      fetchStudents();
      fetchEnrollments();
    }
  }, [open, profile?.company_id, schedule]);

  const fetchStudents = async () => {
    if (!profile?.company_id) return;
    
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, email, status')
      .eq('company_id', profile.company_id)
      .eq('status', 'active')
      .order('full_name');

    if (!error && data) {
      setStudents(data);
    }
  };

  const fetchEnrollments = async () => {
    if (!schedule) return;

    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`
        id,
        student_id,
        status,
        student:students(id, full_name, email, status)
      `)
      .eq('class_schedule_id', schedule.id)
      .neq('status', 'cancelled');

    if (!error && data) {
      setEnrollments(data as unknown as Enrollment[]);
    }
  };

  const handleEnroll = async () => {
    if (!schedule || selectedStudents.length === 0) return;

    setIsLoading(true);
    try {
      const enrollmentsToInsert = selectedStudents.map(studentId => ({
        class_schedule_id: schedule.id,
        student_id: studentId,
        status: 'enrolled'
      }));

      const { error } = await supabase
        .from('class_enrollments')
        .insert(enrollmentsToInsert);

      if (error) throw error;

      toast.success(`${selectedStudents.length} aluno(s) inscrito(s)`);
      setSelectedStudents([]);
      fetchEnrollments();
      onSuccess();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Alguns alunos já estão inscritos nesta aula');
      } else {
        console.error('Error enrolling students:', error);
        toast.error('Erro ao inscrever alunos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast.success('Inscrição cancelada');
      fetchEnrollments();
      onSuccess();
    } catch (error) {
      console.error('Error removing enrollment:', error);
      toast.error('Erro ao cancelar inscrição');
    }
  };

  const enrolledStudentIds = enrollments.map(e => e.student_id);
  const availableStudents = students.filter(
    s => !enrolledStudentIds.includes(s.id) && 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const spotsLeft = schedule ? (schedule.class?.capacity || 0) - enrollments.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inscrever Alunos</DialogTitle>
          <DialogDescription>
            {schedule && (
              <>
                {schedule.class?.name} - {format(new Date(schedule.scheduled_date), "d 'de' MMMM", { locale: pt })} às {schedule.start_time.slice(0, 5)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Enrollments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Alunos Inscritos</h4>
              <Badge variant={spotsLeft > 0 ? "outline" : "destructive"}>
                {enrollments.length}/{schedule?.class?.capacity} vagas
              </Badge>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum aluno inscrito</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {enrollments.map((enrollment) => (
                  <div 
                    key={enrollment.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{enrollment.student?.full_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveEnrollment(enrollment.id)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Students */}
          {spotsLeft > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Adicionar Alunos</h4>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar alunos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-48 border rounded-lg p-2">
                {availableStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm ? 'Nenhum aluno encontrado' : 'Todos os alunos já estão inscritos'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {availableStudents.map((student) => (
                      <div 
                        key={student.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedStudents(prev => 
                            prev.includes(student.id)
                              ? prev.filter(id => id !== student.id)
                              : prev.length < spotsLeft
                                ? [...prev, student.id]
                                : prev
                          );
                        }}
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          disabled={!selectedStudents.includes(student.id) && selectedStudents.length >= spotsLeft}
                        />
                        <div>
                          <p className="text-sm font-medium">{student.full_name}</p>
                          {student.email && (
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {selectedStudents.length > 0 && (
            <Button onClick={handleEnroll} disabled={isLoading}>
              {isLoading ? 'A inscrever...' : `Inscrever ${selectedStudents.length} aluno(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
