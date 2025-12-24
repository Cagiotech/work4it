import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, GraduationCap, Plus, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StaffClassesTabProps {
  staffId: string;
  canEdit: boolean;
}

interface ClassType {
  id: string;
  name: string;
  color: string | null;
  is_active: boolean;
}

interface StaffClass {
  id: string;
  class_id: string;
  is_active: boolean;
  classes: ClassType;
}

export function StaffClassesTab({ staffId, canEdit }: StaffClassesTabProps) {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffClasses, setStaffClasses] = useState<StaffClass[]>([]);
  const [allClasses, setAllClasses] = useState<ClassType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [staffId, company?.id]);

  const fetchData = async () => {
    if (!staffId || !company?.id) return;

    setLoading(true);
    try {
      const [staffClassesResult, allClassesResult] = await Promise.all([
        supabase
          .from("staff_classes")
          .select("id, class_id, is_active, classes(id, name, color, is_active)")
          .eq("staff_id", staffId),
        supabase
          .from("classes")
          .select("id, name, color, is_active")
          .eq("company_id", company.id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (staffClassesResult.error) throw staffClassesResult.error;
      if (allClassesResult.error) throw allClassesResult.error;

      setStaffClasses((staffClassesResult.data as any[]) || []);
      setAllClasses(allClassesResult.data || []);
    } catch (error) {
      console.error("Error fetching staff classes:", error);
      toast.error("Erro ao carregar modalidades");
    } finally {
      setLoading(false);
    }
  };

  const assignedClassIds = staffClasses.map((sc) => sc.class_id);
  const availableClasses = allClasses.filter((c) => !assignedClassIds.includes(c.id));

  const handleAddClasses = async () => {
    if (selectedClassIds.length === 0) {
      toast.error("Selecione pelo menos uma modalidade");
      return;
    }

    setSaving(true);
    try {
      const inserts = selectedClassIds.map((classId) => ({
        staff_id: staffId,
        class_id: classId,
        is_active: true,
      }));

      const { error } = await supabase.from("staff_classes").insert(inserts);

      if (error) throw error;

      toast.success("Modalidades atribuídas com sucesso!");
      setShowAddModal(false);
      setSelectedClassIds([]);
      fetchData();
    } catch (error: any) {
      console.error("Error adding staff classes:", error);
      toast.error(error.message || "Erro ao atribuir modalidades");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveClass = async (staffClassId: string) => {
    try {
      const { error } = await supabase
        .from("staff_classes")
        .delete()
        .eq("id", staffClassId);

      if (error) throw error;

      toast.success("Modalidade removida");
      fetchData();
    } catch (error: any) {
      console.error("Error removing staff class:", error);
      toast.error(error.message || "Erro ao remover modalidade");
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Modalidades Atribuídas
            </CardTitle>
            <CardDescription>
              Modalidades que este colaborador pode lecionar
            </CardDescription>
          </div>
          {canEdit && availableClasses.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {staffClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma modalidade atribuída</p>
              {canEdit && availableClasses.length > 0 && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  Atribuir Modalidade
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {staffClasses.map((sc) => (
                <Badge
                  key={sc.id}
                  variant="outline"
                  className="py-2 px-3 text-sm gap-2"
                  style={{
                    borderColor: sc.classes?.color || undefined,
                    backgroundColor: sc.classes?.color ? `${sc.classes.color}15` : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sc.classes?.color || "#888" }}
                  />
                  {sc.classes?.name}
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveClass(sc.id)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Classes Modal */}
      {showAddModal && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adicionar Modalidades</CardTitle>
            <CardDescription>
              Selecione as modalidades a atribuir ao colaborador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todas as modalidades já estão atribuídas a este colaborador
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleClassSelection(classItem.id)}
                  >
                    <Checkbox
                      checked={selectedClassIds.includes(classItem.id)}
                      onCheckedChange={() => toggleClassSelection(classItem.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: classItem.color || "#888" }}
                      />
                      <Label className="cursor-pointer">{classItem.name}</Label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedClassIds([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddClasses}
                disabled={saving || selectedClassIds.length === 0}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Adicionar ({selectedClassIds.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
