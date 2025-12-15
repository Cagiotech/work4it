import { useState, useEffect, useRef, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Heart, CreditCard, FileText, StickyNote, Pencil, Trash2, X, Save, Apple, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Context for save trigger
export const SaveTriggerContext = createContext<{
  registerSave: (tabId: string, saveFn: () => Promise<void>) => void;
  unregisterSave: (tabId: string) => void;
}>({
  registerSave: () => {},
  unregisterSave: () => {},
});
import { StudentProfileTab } from "./tabs/StudentProfileTab";
import { StudentAnamnesisTab } from "./tabs/StudentAnamnesisTab";
import { StudentPlansTab } from "./tabs/StudentPlansTab";
import { StudentNotesTab } from "./tabs/StudentNotesTab";
import { StudentDocumentsTab } from "./tabs/StudentDocumentsTab";
import { StudentNutritionTab } from "./tabs/StudentNutritionTab";
import { StudentScheduleTab } from "./tabs/StudentScheduleTab";

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
  
  const [isSaving, setIsSaving] = useState(false);
  const saveFunctionsRef = useRef<Map<string, () => Promise<void>>>(new Map());

  const registerSave = (tabId: string, saveFn: () => Promise<void>) => {
    saveFunctionsRef.current.set(tabId, saveFn);
  };

  const unregisterSave = (tabId: string) => {
    saveFunctionsRef.current.delete(tabId);
  };

  const handleSave = async () => {
    const saveFn = saveFunctionsRef.current.get(activeTab);
    if (saveFn) {
      setIsSaving(true);
      try {
        await saveFn();
      } finally {
        setIsSaving(false);
      }
    }
  };

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
                {/* Save button only for tabs that use SaveTriggerContext (profile, anamnesis) */}
                {canEdit && isEditing && (activeTab === "profile" || activeTab === "anamnesis") && (
                  <Button 
                    variant="default"
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving}
                    title="Guardar alterações"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
                {canEdit && (
                  <Button 
                    variant={isEditing ? "outline" : "outline"}
                    size="icon"
                    onClick={() => setIsEditing(!isEditing)}
                    title={isEditing ? "Cancelar edição" : "Modo de edição"}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                )}
                {canDelete && onDelete && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete()}
                    title="Eliminar aluno"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <SaveTriggerContext.Provider value={{ registerSave, unregisterSave }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="px-6 pt-2">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Perfil</span>
                  </TabsTrigger>
                  <TabsTrigger value="anamnesis" className="gap-1 text-xs sm:text-sm">
                    <Heart className="h-4 w-4" />
                    <span className="hidden sm:inline">Saúde</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="gap-1 text-xs sm:text-sm">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Agenda</span>
                  </TabsTrigger>
                  <TabsTrigger value="nutrition" className="gap-1 text-xs sm:text-sm">
                    <Apple className="h-4 w-4" />
                    <span className="hidden sm:inline">Nutrição</span>
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
                    healthNotes={student.health_notes}
                    onHealthNotesChange={() => onUpdate()}
                  />
                </TabsContent>

                <TabsContent value="schedule" className="mt-0">
                  <StudentScheduleTab studentId={student.id} />
                </TabsContent>

                <TabsContent value="nutrition" className="mt-0">
                  <StudentNutritionTab 
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
          </SaveTriggerContext.Provider>
        </DialogContent>
      </Dialog>
    </>
  );
}
