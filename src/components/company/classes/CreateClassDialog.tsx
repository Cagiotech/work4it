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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ClassType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  color: string;
  is_active: boolean;
}

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classType?: ClassType | null;
  onSuccess: () => void;
}

const colorOptions = [
  "#aeca12", "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

export function CreateClassDialog({ open, onOpenChange, classType, onSuccess }: CreateClassDialogProps) {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    capacity: 10,
    color: "#aeca12"
  });

  useEffect(() => {
    if (classType) {
      setFormData({
        name: classType.name,
        description: classType.description || "",
        duration_minutes: classType.duration_minutes,
        capacity: classType.capacity,
        color: classType.color
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        capacity: 10,
        color: "#aeca12"
      });
    }
  }, [classType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setIsLoading(true);
    try {
      if (classType) {
        // Update existing
        const { error } = await supabase
          .from('classes')
          .update({
            name: formData.name,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            capacity: formData.capacity,
            color: formData.color
          })
          .eq('id', classType.id);

        if (error) throw error;
        toast.success('Tipo de aula atualizado');
      } else {
        // Create new
        const { error } = await supabase
          .from('classes')
          .insert({
            company_id: profile.company_id,
            name: formData.name,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            capacity: formData.capacity,
            color: formData.color
          });

        if (error) throw error;
        toast.success('Tipo de aula criado');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error('Erro ao guardar tipo de aula');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{classType ? 'Editar' : 'Criar'} Tipo de Aula</DialogTitle>
          <DialogDescription>
            {classType ? 'Edite os dados do tipo de aula' : 'Defina um novo tipo de aula para a sua empresa'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Yoga, CrossFit, Pilates"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional da aula"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={240}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color 
                        ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'A guardar...' : classType ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
