import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react";

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const scheduleData = {
  Segunda: [
    { time: "08:00", duration: "1h", student: "Maria Santos", type: "Musculação", location: "Sala 1" },
    { time: "10:00", duration: "1h", student: "Pedro Costa", type: "Funcional", location: "Sala 2" },
    { time: "14:00", duration: "1h30", student: "Ana Ferreira", type: "Pilates", location: "Sala 3" },
    { time: "17:00", duration: "1h", student: "João Oliveira", type: "HIIT", location: "Sala 1" },
  ],
  Terça: [
    { time: "09:00", duration: "1h", student: "Sofia Rodrigues", type: "Musculação", location: "Sala 1" },
    { time: "11:00", duration: "1h", student: "Miguel Almeida", type: "Funcional", location: "Sala 2" },
    { time: "15:00", duration: "1h30", student: "Maria Santos", type: "Cardio", location: "Sala 1" },
  ],
  Quarta: [
    { time: "08:00", duration: "1h", student: "Pedro Costa", type: "Musculação", location: "Sala 1" },
    { time: "10:00", duration: "1h", student: "Ana Ferreira", type: "Funcional", location: "Sala 2" },
    { time: "14:00", duration: "1h", student: "João Oliveira", type: "Pilates", location: "Sala 3" },
    { time: "16:00", duration: "1h", student: "Sofia Rodrigues", type: "HIIT", location: "Sala 1" },
    { time: "18:00", duration: "1h", student: "Miguel Almeida", type: "Musculação", location: "Sala 2" },
  ],
  Quinta: [
    { time: "09:00", duration: "1h", student: "Maria Santos", type: "Funcional", location: "Sala 2" },
    { time: "11:00", duration: "1h30", student: "Pedro Costa", type: "Cardio", location: "Sala 1" },
    { time: "15:00", duration: "1h", student: "Ana Ferreira", type: "Musculação", location: "Sala 1" },
  ],
  Sexta: [
    { time: "08:00", duration: "1h", student: "João Oliveira", type: "Funcional", location: "Sala 2" },
    { time: "10:00", duration: "1h", student: "Sofia Rodrigues", type: "Pilates", location: "Sala 3" },
    { time: "14:00", duration: "1h", student: "Miguel Almeida", type: "HIIT", location: "Sala 1" },
    { time: "17:00", duration: "1h30", student: "Maria Santos", type: "Musculação", location: "Sala 1" },
  ],
  Sábado: [
    { time: "09:00", duration: "1h", student: "Pedro Costa", type: "Funcional", location: "Sala 2" },
    { time: "11:00", duration: "1h", student: "Ana Ferreira", type: "Cardio", location: "Sala 1" },
  ],
  Domingo: [],
};

const typeColors: Record<string, string> = {
  Musculação: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Funcional: "bg-green-500/10 text-green-600 border-green-500/20",
  Pilates: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  HIIT: "bg-red-500/10 text-red-600 border-red-500/20",
  Cardio: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function PersonalSchedule() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState("Segunda");

  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + currentWeek * 7);
    
    return weekDays.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date.getDate();
    });
  };

  const weekDates = getWeekDates();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerir as suas aulas e compromissos
          </p>
        </div>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Aula
        </Button>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(currentWeek - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {currentWeek === 0 ? "Esta Semana" : currentWeek > 0 ? `+${currentWeek} semana(s)` : `${currentWeek} semana(s)`}
            </span>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeek(currentWeek + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week Days - Responsive */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {weekDays.map((day, index) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center p-2 md:p-3 rounded-lg transition-all ${
                  selectedDay === day
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span className="text-xs font-medium hidden md:block">{day}</span>
                <span className="text-xs font-medium md:hidden">{day.slice(0, 3)}</span>
                <span className={`text-lg md:text-xl font-bold mt-1 ${
                  selectedDay === day ? "" : "text-foreground"
                }`}>
                  {weekDates[index]}
                </span>
                {scheduleData[day as keyof typeof scheduleData]?.length > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    selectedDay === day ? "bg-primary-foreground" : "bg-primary"
                  }`} />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedDay}</CardTitle>
          <CardDescription>
            {scheduleData[selectedDay as keyof typeof scheduleData]?.length || 0} aulas agendadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduleData[selectedDay as keyof typeof scheduleData]?.length > 0 ? (
            <div className="space-y-3">
              {scheduleData[selectedDay as keyof typeof scheduleData].map((session, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 md:w-24">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.time}</p>
                      <p className="text-xs text-muted-foreground">{session.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {session.student.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.student}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={typeColors[session.type] || ""}
                  >
                    {session.type}
                  </Badge>

                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 md:flex-none">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Sem aulas agendadas para este dia</p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Agendar Aula
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
