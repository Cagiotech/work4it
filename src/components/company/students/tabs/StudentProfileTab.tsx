import { useState, useEffect, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SaveTriggerContext } from "../StudentProfileDialog";
import { Camera, Loader2, Trash2 } from "lucide-react";
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
import { PasswordManagementCard } from "@/components/shared/PasswordManagementCard";

interface StudentData {
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
  status: string | null;
  profile_photo_url?: string | null;
  user_id?: string | null;
  company_id?: string;
}

interface StudentProfileTabProps {
  student: StudentData;
  canEdit: boolean;
  onUpdate: () => void;
}

export function StudentProfileTab({ student, canEdit, onUpdate }: StudentProfileTabProps) {
  const { t } = useTranslation();
  const { registerSave, unregisterSave } = useContext(SaveTriggerContext);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<StudentData>(student);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditData(student);
  }, [student]);

  // Register save function with parent
  useEffect(() => {
    const saveFn = async () => {
      setConfirmSaveOpen(true);
    };
    registerSave("profile", saveFn);
    return () => unregisterSave("profile");
  }, [registerSave, unregisterSave, editData]);

  const handleSave = async () => {
    setConfirmSaveOpen(false);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          full_name: editData.full_name,
          email: editData.email,
          phone: editData.phone,
          birth_date: editData.birth_date,
          gender: editData.gender,
          address: editData.address,
          postal_code: editData.postal_code,
          city: editData.city,
          country: editData.country,
          nationality: editData.nationality,
          nif: editData.nif,
          niss: editData.niss,
          citizen_card: editData.citizen_card,
          emergency_contact: editData.emergency_contact,
          emergency_phone: editData.emergency_phone,
          status: editData.status,
        })
        .eq('id', student.id);

      toast.success("Dados atualizados com sucesso");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem não pode exceder 2MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${student.id}.${fileExt}`;

      // Delete old photo if exists
      if (editData.profile_photo_url) {
        const oldPath = editData.profile_photo_url.split("/").pop();
        if (oldPath) {
          await supabase.storage.from("student-photos").remove([oldPath]);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from("student-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("student-photos")
        .getPublicUrl(fileName);

      // Update student record
      const { error: updateError } = await supabase
        .from("students")
        .update({ profile_photo_url: urlData.publicUrl })
        .eq("id", student.id);

      if (updateError) throw updateError;

      setEditData({ ...editData, profile_photo_url: urlData.publicUrl });
      toast.success("Foto atualizada com sucesso");
      onUpdate();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!editData.profile_photo_url) return;

    setUploadingPhoto(true);
    try {
      const fileName = editData.profile_photo_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("student-photos").remove([fileName]);
      }

      await supabase
        .from("students")
        .update({ profile_photo_url: null })
        .eq("id", student.id);

      setEditData({ ...editData, profile_photo_url: null });
      toast.success("Foto removida");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao remover foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={editData.profile_photo_url || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(editData.full_name)}
              </AvatarFallback>
            </Avatar>
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          {canEdit && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {editData.profile_photo_url ? "Alterar Foto" : "Adicionar Foto"}
                </Button>
                {editData.profile_photo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Máximo 2MB. JPG, PNG</p>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Informações Pessoais
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editData.full_name}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editData.email || ""}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                type="tel"
                value={editData.phone || ""}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={editData.birth_date || ""}
                onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Select
                value={editData.gender || ""}
                onValueChange={(value) => setEditData({ ...editData, gender: value })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nacionalidade</Label>
              <Input
                value={editData.nationality || ""}
                onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={editData.status || "active"}
                onValueChange={(value) => setEditData({ ...editData, status: value })}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Portuguese Documents */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Documentos (Portugal)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>NIF</Label>
              <Input
                value={editData.nif || ""}
                onChange={(e) => setEditData({ ...editData, nif: e.target.value })}
                disabled={!canEdit}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>NISS</Label>
              <Input
                value={editData.niss || ""}
                onChange={(e) => setEditData({ ...editData, niss: e.target.value })}
                disabled={!canEdit}
                placeholder="12345678901"
              />
            </div>
            <div className="space-y-2">
              <Label>Cartão Cidadão</Label>
              <Input
                value={editData.citizen_card || ""}
                onChange={(e) => setEditData({ ...editData, citizen_card: e.target.value })}
                disabled={!canEdit}
                placeholder="12345678 9 AB1"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Morada
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={editData.address || ""}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                disabled={!canEdit}
                placeholder="Rua, número, andar..."
              />
            </div>
            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input
                value={editData.postal_code || ""}
                onChange={(e) => setEditData({ ...editData, postal_code: e.target.value })}
                disabled={!canEdit}
                placeholder="1234-567"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={editData.city || ""}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input
                value={editData.country || ""}
                onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Contacto de Emergência
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Contacto</Label>
              <Input
                value={editData.emergency_contact || ""}
                onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone de Emergência</Label>
              <Input
                type="tel"
                value={editData.emergency_phone || ""}
                onChange={(e) => setEditData({ ...editData, emergency_phone: e.target.value })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Password Management */}
        {student.user_id && student.company_id && student.email && canEdit && (
          <PasswordManagementCard
            userId={student.id}
            userType="student"
            userEmail={student.email}
            userName={student.full_name}
            companyId={student.company_id}
            hasAccount={!!student.user_id}
          />
        )}
      </div>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja guardar as alterações feitas no perfil de "{student.full_name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
