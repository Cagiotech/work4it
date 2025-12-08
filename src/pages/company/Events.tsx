import { useTranslation } from "react-i18next";
import { CalendarDays, Plus, MapPin, Clock, Users } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockEvents = [
  { 
    id: 1, 
    name: "Workshop de Yoga ao Ar Livre", 
    date: "15 Dezembro 2024", 
    time: "09:00 - 12:00",
    location: "Parque da Cidade",
    participants: 25,
    maxParticipants: 30,
    status: "upcoming"
  },
  { 
    id: 2, 
    name: "Competição de CrossFit", 
    date: "20 Dezembro 2024", 
    time: "10:00 - 18:00",
    location: "Ginásio Principal",
    participants: 40,
    maxParticipants: 50,
    status: "upcoming"
  },
  { 
    id: 3, 
    name: "Aula Especial de Natal", 
    date: "23 Dezembro 2024", 
    time: "18:00 - 20:00",
    location: "Sala Multiusos",
    participants: 35,
    maxParticipants: 40,
    status: "upcoming"
  },
  { 
    id: 4, 
    name: "Maratona de Spinning", 
    date: "01 Dezembro 2024", 
    time: "08:00 - 12:00",
    location: "Sala de Spinning",
    participants: 20,
    maxParticipants: 20,
    status: "completed"
  },
];

export default function Events() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.events")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Eventos & Atividades</h2>
            <p className="text-muted-foreground">Gerencie workshops, competições e eventos especiais</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Evento
          </Button>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos Eventos
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockEvents
              .filter((e) => e.status === "upcoming")
              .map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-heading font-semibold text-lg text-foreground">{event.name}</h4>
                        <Badge variant="outline" className="mt-2 border-primary text-primary">
                          {event.participants}/{event.maxParticipants} inscritos
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver Detalhes
                      </Button>
                      <Button size="sm" className="flex-1">
                        Gerir Inscrições
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Past Events */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-muted-foreground">Eventos Passados</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockEvents
              .filter((e) => e.status === "completed")
              .map((event) => (
                <Card key={event.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{event.name}</h4>
                        <p className="text-sm text-muted-foreground">{event.date}</p>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{event.participants} participantes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
