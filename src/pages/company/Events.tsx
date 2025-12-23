import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Plus, MapPin, Clock, Users, Edit2, Trash2, Globe, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { EventDialog } from "@/components/company/events/EventDialog";
import { format, isBefore, isToday, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string;
  max_participants: number | null;
  is_public: boolean;
  company_id: string;
  created_at: string;
}

export default function Events() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [canCreatePublic, setCanCreatePublic] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      await loadEvents(profile.company_id);
    }
  };

  const loadEvents = async (cId: string) => {
    setLoading(true);

    // Load company events
    const { data: companyEvents } = await supabase
      .from("events")
      .select("*")
      .eq("company_id", cId)
      .order("event_date", { ascending: true });

    // Load public events from other companies
    const { data: publicData } = await supabase
      .from("events")
      .select("*")
      .eq("is_public", true)
      .neq("company_id", cId)
      .order("event_date", { ascending: true });

    setEvents(companyEvents || []);
    setPublicEvents(publicData || []);

    // Check if company already has a public event
    const hasPublicEvent = (companyEvents || []).some((e) => e.is_public);
    setCanCreatePublic(!hasPublicEvent);

    setLoading(false);
  };

  const handleSaveEvent = async (data: any) => {
    if (!companyId || !userId) return;

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update({
          title: data.title,
          description: data.description,
          event_date: data.event_date,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          location: data.location || null,
          event_type: data.event_type,
          max_participants: data.max_participants,
          is_public: data.is_public,
        })
        .eq("id", editingEvent.id);

      if (error) {
        toast.error("Erro ao atualizar evento");
        throw error;
      }
      toast.success("Evento atualizado!");
    } else {
      // Check public event limit
      if (data.is_public && !canCreatePublic) {
        toast.error("Já tem um evento público ativo. Limite: 1 por empresa.");
        return;
      }

      const { error } = await supabase.from("events").insert({
        company_id: companyId,
        created_by: userId,
        title: data.title,
        description: data.description,
        event_date: data.event_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location || null,
        event_type: data.event_type,
        max_participants: data.max_participants,
        is_public: data.is_public,
      });

      if (error) {
        toast.error("Erro ao criar evento");
        throw error;
      }
      toast.success("Evento criado!");
    }

    setEditingEvent(null);
    loadEvents(companyId);
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId || !companyId) return;

    const { error } = await supabase.from("events").delete().eq("id", deleteEventId);

    if (error) {
      toast.error("Erro ao eliminar evento");
    } else {
      toast.success("Evento eliminado!");
      loadEvents(companyId);
    }
    setDeleteEventId(null);
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "workshop":
        return "Workshop";
      case "competition":
        return "Competição";
      case "special_class":
        return "Aula Especial";
      case "social":
        return "Social";
      default:
        return "Geral";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "workshop":
        return "bg-purple-500/20 text-purple-600 border-purple-500/30";
      case "competition":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      case "special_class":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "social":
        return "bg-green-500/20 text-green-600 border-green-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const isPastEvent = (date: string) => {
    return isBefore(parseISO(date), new Date()) && !isToday(parseISO(date));
  };

  const upcomingEvents = events.filter((e) => !isPastEvent(e.event_date));
  const pastEvents = events.filter((e) => isPastEvent(e.event_date));

  const EventCard = ({ event, isOwn = true }: { event: Event; isOwn?: boolean }) => (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-shadow border-l-4 ${
        event.is_public ? "border-l-green-500" : "border-l-primary"
      } ${isPastEvent(event.event_date) ? "opacity-60" : ""}`}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-heading font-semibold text-lg text-foreground">{event.title}</h4>
              {event.is_public && (
                <Badge variant="outline" className="gap-1 text-xs border-green-500 text-green-600">
                  <Globe className="h-3 w-3" />
                  Público
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getEventTypeColor(event.event_type || "general")}>
                {getEventTypeLabel(event.event_type || "general")}
              </Badge>
              {event.max_participants && (
                <Badge variant="outline" className="text-xs">
                  Max: {event.max_participants}
                </Badge>
              )}
            </div>
          </div>
          {isOwn && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingEvent(event);
                  setShowEventDialog(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteEventId(event.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>
              {format(parseISO(event.event_date), "dd MMMM yyyy", { locale: pt })}
              {isToday(parseISO(event.event_date)) && (
                <Badge className="ml-2 text-xs bg-primary text-primary-foreground">Hoje</Badge>
              )}
            </span>
          </div>
          {(event.start_time || event.end_time) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {event.start_time?.slice(0, 5)}
                {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Eventos & Atividades</h2>
          <p className="text-muted-foreground">Gerencie workshops, competições e eventos especiais</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingEvent(null);
            setShowEventDialog(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Criar Evento
        </Button>
      </div>

      {/* Public Events from other companies */}
      {publicEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Eventos Públicos
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {publicEvents.map((event) => (
              <EventCard key={event.id} event={event} isOwn={false} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Próximos Eventos
        </h3>

        {upcomingEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ainda não tem eventos agendados</p>
              <p className="text-sm">Clique em "Criar Evento" para adicionar o primeiro</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-muted-foreground">Eventos Passados</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Event Dialog */}
      <EventDialog
        open={showEventDialog}
        onOpenChange={(open) => {
          setShowEventDialog(open);
          if (!open) setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleSaveEvent}
        canCreatePublic={canCreatePublic || (editingEvent?.is_public ?? false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
