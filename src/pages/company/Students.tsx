import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, LayoutGrid, List, ArrowUpAZ, ArrowDownAZ, Download, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStudentDialog } from "@/components/company/students/AddStudentDialog";
import { StudentProfileDialog } from "@/components/company/students/StudentProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  nationality: string | null;
  nif: string | null;
  niss: string | null;
  citizen_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  health_notes: string | null;
  enrollment_date: string | null;
  status: string | null;
  created_at: string;
  company_id: string;
  personal_trainer_id: string | null;
}

export default function Students() {
  const { t } = useTranslation();
  const { company } = useAuth();
  const { canCreate, canEdit, canDelete, canExport, canImport } = usePermissions();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingStudent, setAddingStudent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const fetchStudents = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('company_id', company.id)
        .order('full_name', { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setStudents(data || []);
      
      // Update selectedStudent if it exists to reflect any changes
      if (selectedStudent && data) {
        const updated = data.find(s => s.id === selectedStudent.id);
        if (updated) {
          setSelectedStudent(updated);
        }
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [company?.id]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        const matchesSearch = 
          student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const comparison = a.full_name.localeCompare(b.full_name);
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [students, searchTerm, sortOrder, filterStatus]);

  const handleAddStudent = async (data: { name: string; email: string; phone: string; birthDate: string; createAccount: boolean }) => {
    if (!company?.id) return;
    
    setAddingStudent(true);
    try {
      // First create the student record
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([{
          company_id: company.id,
          full_name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birthDate || null,
          status: 'active',
          password_changed: !data.createAccount, // If not creating account, mark as changed
        }])
        .select()
        .single();

      if (error) throw error;
      
      // If createAccount is true and email exists, create the auth user
      if (data.createAccount && data.email) {
        const { data: accountData, error: accountError } = await supabase.functions.invoke('create-student-account', {
          body: {
            email: data.email,
            fullName: data.name,
            studentId: newStudent.id,
          }
        });

        if (accountError) {
          console.error('Error creating account:', accountError);
          toast.error('Aluno criado, mas erro ao criar conta: ' + accountError.message);
        } else if (accountData?.error) {
          toast.error('Aluno criado, mas erro ao criar conta: ' + accountData.error);
        } else {
          toast.success('Aluno adicionado com conta criada! Senha temporária: 12345678');
          setAddDialogOpen(false);
          setStudents([...students, newStudent]);
          return;
        }
      }
      
      setStudents([...students, newStudent]);
      setAddDialogOpen(false);
      toast.success('Aluno adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Erro ao adicionar aluno');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleUpdateStudent = async (updatedStudent: Student) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: updatedStudent.full_name,
          email: updatedStudent.email,
          phone: updatedStudent.phone,
          birth_date: updatedStudent.birth_date,
          gender: updatedStudent.gender,
          address: updatedStudent.address,
          emergency_contact: updatedStudent.emergency_contact,
          emergency_phone: updatedStudent.emergency_phone,
          health_notes: updatedStudent.health_notes,
          status: updatedStudent.status,
        })
        .eq('id', updatedStudent.id);

      if (error) throw error;
      
      setStudents(students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
      setSelectedStudent(updatedStudent);
      toast.success('Aluno atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Erro ao atualizar aluno');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentToDelete.id);

      if (error) throw error;
      
      setStudents(students.filter((s) => s.id !== studentToDelete.id));
      toast.success('Aluno excluído com sucesso!');
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      setProfileDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.message || 'Erro ao excluir aluno');
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Data Nascimento', 'Status', 'Data Matrícula'].join(','),
      ...filteredStudents.map(s => [
        s.full_name,
        s.email || '',
        s.phone || '',
        s.birth_date || '',
        s.status,
        s.enrollment_date || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'alunos.csv';
    link.click();
    toast.success('Exportação concluída!');
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setProfileDialogOpen(true);
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-600">Suspenso</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.students")}</h1>
          <p className="text-muted-foreground">{students.length} alunos cadastrados</p>
        </div>
        <div className="flex gap-2">
          {canExport('students') && (
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
          {canCreate('students') && (
            <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("students.addStudent")}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "A-Z" : "Z-A"}
              >
                {sortOrder === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Display */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {students.length === 0 
                ? "Nenhum aluno cadastrado ainda. Clique em 'Adicionar Aluno' para começar."
                : "Nenhum aluno encontrado com os filtros aplicados."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStudentClick(student)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(student.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{student.full_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{student.email || 'Sem email'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {getStatusBadge(student.status)}
                  {student.phone && (
                    <span className="text-sm text-muted-foreground">{student.phone}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Matrícula</TableHead>
                {canDelete('students') && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => handleStudentClick(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.email || '-'}</TableCell>
                  <TableCell>{student.phone || '-'}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    {student.enrollment_date 
                      ? new Date(student.enrollment_date).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  {canDelete('students') && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(student);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialogs */}
      <AddStudentDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onAdd={handleAddStudent}
        isLoading={addingStudent}
      />
      
      <StudentProfileDialog
        student={selectedStudent}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onUpdate={() => {
          fetchStudents();
        }}
        onDelete={canDelete('students') ? () => {
          if (selectedStudent) {
            confirmDelete(selectedStudent);
          }
        } : undefined}
        canEdit={canEdit('students')}
        canDelete={canDelete('students')}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno "{studentToDelete?.full_name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStudent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
