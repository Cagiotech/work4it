import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventData {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  max_participants: number | null;
  is_public: boolean;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventData | null;
  onSave: (data: EventData) => Promise<void>;
  canCreatePublic: boolean;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  onSave,
  canCreatePublic,
}: EventDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventData>({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    event_type: "general",
    max_participants: null,
    is_public: false,
  });

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        title: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        location: "",
        event_type: "general",
        max_participants: null,
        is_public: false,
      });
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) return;

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {event ? "Editar Evento" : "Criar Evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome do evento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o evento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Data *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="competition">Competição</SelectItem>
                  <SelectItem value="special_class">Aula Especial</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora Início</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora Fim</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Local do evento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">Máx. Participantes</Label>
              <Input
                id="max_participants"
                type="number"
                min={1}
                value={formData.max_participants || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_participants: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Sem limite"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="is_public" className="font-medium">
                Evento Público
              </Label>
              <p className="text-sm text-muted-foreground">
                {canCreatePublic
                  ? "Visível para todas as empresas e utilizadores"
                  : "Já tem um evento público ativo (limite: 1)"}
              </p>
            </div>
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              disabled={!canCreatePublic && !event?.is_public}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : event ? "Atualizar" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
