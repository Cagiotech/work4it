import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  health_notes: string | null;
  status: string | null;
}

interface StudentProfileTabProps {
  student: StudentData;
  canEdit: boolean;
  onUpdate: () => void;
}

export function StudentProfileTab({ student, canEdit, onUpdate }: StudentProfileTabProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState<StudentData>(student);

  const handleSave = async () => {
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
          health_notes: editData.health_notes,
          status: editData.status,
        })
        .eq('id', student.id);

      if (error) throw error;
      toast.success("Dados atualizados com sucesso");
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={editData.email || ""}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              type="tel"
              value={editData.phone || ""}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={editData.birth_date || ""}
              onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>Género</Label>
            <Select
              value={editData.gender || ""}
              onValueChange={(value) => setEditData({ ...editData, gender: value })}
              disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={editData.status || "active"}
              onValueChange={(value) => setEditData({ ...editData, status: value })}
              disabled={!isEditing}
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
              disabled={!isEditing}
              placeholder="123456789"
            />
          </div>
          <div className="space-y-2">
            <Label>NISS</Label>
            <Input
              value={editData.niss || ""}
              onChange={(e) => setEditData({ ...editData, niss: e.target.value })}
              disabled={!isEditing}
              placeholder="12345678901"
            />
          </div>
          <div className="space-y-2">
            <Label>Cartão Cidadão</Label>
            <Input
              value={editData.citizen_card || ""}
              onChange={(e) => setEditData({ ...editData, citizen_card: e.target.value })}
              disabled={!isEditing}
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
              disabled={!isEditing}
              placeholder="Rua, número, andar..."
            />
          </div>
          <div className="space-y-2">
            <Label>Código Postal</Label>
            <Input
              value={editData.postal_code || ""}
              onChange={(e) => setEditData({ ...editData, postal_code: e.target.value })}
              disabled={!isEditing}
              placeholder="1234-567"
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              value={editData.city || ""}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <Input
              value={editData.country || ""}
              onChange={(e) => setEditData({ ...editData, country: e.target.value })}
              disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone de Emergência</Label>
            <Input
              type="tel"
              value={editData.emergency_phone || ""}
              onChange={(e) => setEditData({ ...editData, emergency_phone: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* Health Notes */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Notas de Saúde
        </h3>
        <Textarea
          value={editData.health_notes || ""}
          onChange={(e) => setEditData({ ...editData, health_notes: e.target.value })}
          disabled={!isEditing}
          placeholder="Informações importantes sobre saúde, alergias, medicamentos..."
          rows={3}
        />
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditData(student);
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "A guardar..." : "Guardar"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar</Button>
          )}
        </div>
      )}
    </div>
  );
}
