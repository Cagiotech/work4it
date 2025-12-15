import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Heart, CreditCard, FileText, StickyNote, Pencil, Trash2, X, Check } from "lucide-react";
import { StudentProfileTab } from "./tabs/StudentProfileTab";
import { StudentAnamnesisTab } from "./tabs/StudentAnamnesisTab";
import { StudentPlansTab } from "./tabs/StudentPlansTab";
import { StudentNotesTab } from "./tabs/StudentNotesTab";
import { StudentDocumentsTab } from "./tabs/StudentDocumentsTab";
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
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  nationality?: string | null;
  nif?: string | null;
  niss?: string | null;
  citizen_card?: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  health_notes: string | null;
  status: string | null;
  company_id: string;
  personal_trainer_id?: string | null;
}

interface StudentProfileDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function StudentProfileDialog({ 
  student, 
  open, 
  onOpenChange, 
  onUpdate,
  onDelete,
  canEdit = true,
  canDelete = true,
}: StudentProfileDialogProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab("profile");
      setIsEditing(false);
    }
  }, [open]);

  if (!student) return null;

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

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    onDelete?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-xl">{student.full_name}</DialogTitle>
                <div className="flex gap-2 mt-1">
                  {getStatusBadge(student.status)}
                  {student.email && (
                    <span className="text-sm text-muted-foreground">{student.email}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {canEdit && (
                  <Button 
                    variant={isEditing ? "default" : "outline"}
                    size="icon"
                    onClick={() => setIsEditing(!isEditing)}
                    title={isEditing ? "Modo de visualização" : "Modo de edição"}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                )}
                {canDelete && onDelete && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    title="Eliminar aluno"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6 pt-2">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </TabsTrigger>
                <TabsTrigger value="anamnesis" className="gap-1 text-xs sm:text-sm">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Saúde</span>
                </TabsTrigger>
                <TabsTrigger value="plans" className="gap-1 text-xs sm:text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Planos</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm">
                  <StickyNote className="h-4 w-4" />
                  <span className="hidden sm:inline">Notas</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(90vh-200px)] px-6 py-4">
              <TabsContent value="profile" className="mt-0">
                <StudentProfileTab 
                  student={student} 
                  canEdit={canEdit && isEditing} 
                  onUpdate={onUpdate} 
                />
              </TabsContent>

              <TabsContent value="anamnesis" className="mt-0">
                <StudentAnamnesisTab 
                  studentId={student.id} 
                  canEdit={canEdit && isEditing} 
                />
              </TabsContent>

              <TabsContent value="plans" className="mt-0">
                <StudentPlansTab 
                  studentId={student.id}
                  personalTrainerId={student.personal_trainer_id || null}
                  companyId={student.company_id}
                  canEdit={canEdit && isEditing}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <StudentDocumentsTab 
                  studentId={student.id} 
                  canEdit={canEdit && isEditing} 
                />
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <StudentNotesTab 
                  studentId={student.id} 
                  canEdit={canEdit && isEditing} 
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar o aluno "{student.full_name}"? 
              Esta ação não pode ser desfeita e todos os dados associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
