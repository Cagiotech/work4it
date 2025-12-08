import { useTranslation } from "react-i18next";
import { Calendar, Clock, User, MapPin, CheckCircle } from "lucide-react";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const upcomingClasses = [
  { 
    id: 1, 
    name: "Treino Funcional", 
    date: "08 Dezembro 2024", 
    time: "10:00 - 11:00",
    trainer: "João Silva",
    location: "Sala 1",
    status: "confirmed"
  },
  { 
    id: 2, 
    name: "Yoga", 
    date: "09 Dezembro 2024", 
    time: "18:00 - 19:00",
    trainer: "Ana Costa",
    location: "Sala Zen",
    status: "confirmed"
  },
  { 
    id: 3, 
    name: "Musculação", 
    date: "10 Dezembro 2024", 
    time: "09:00 - 10:30",
    trainer: "Pedro Martins",
    location: "Ginásio Principal",
    status: "pending"
  },
  { 
    id: 4, 
    name: "Pilates", 
    date: "11 Dezembro 2024", 
    time: "17:00 - 18:00",
    trainer: "Marta Reis",
    location: "Sala 2",
    status: "confirmed"
  },
];

const pastClasses = [
  { 
    id: 5, 
    name: "CrossFit", 
    date: "05 Dezembro 2024", 
    time: "07:00 - 08:00",
    trainer: "Carlos Ferreira",
    attended: true
  },
  { 
    id: 6, 
    name: "Treino Funcional", 
    date: "03 Dezembro 2024", 
    time: "10:00 - 11:00",
    trainer: "João Silva",
    attended: true
  },
  { 
    id: 7, 
    name: "Yoga", 
    date: "01 Dezembro 2024", 
    time: "18:00 - 19:00",
    trainer: "Ana Costa",
    attended: false
  },
];

export default function StudentClasses() {
  const { t } = useTranslation();

  return (
    <>
      <StudentHeader title={t("student.classes")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Próximas Aulas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <div className="space-y-4">
              {upcomingClasses.map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading font-semibold text-lg text-foreground">
                            {classItem.name}
                          </h3>
                          <Badge 
                            variant="outline"
                            className={classItem.status === "confirmed" 
                              ? "border-success text-success" 
                              : "border-warning text-warning"
                            }
                          >
                            {classItem.status === "confirmed" ? "Confirmada" : "Pendente"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{classItem.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{classItem.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{classItem.trainer}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{classItem.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {classItem.status === "pending" && (
                          <Button size="sm">Confirmar Presença</Button>
                        )}
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Aulas Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastClasses.map((classItem) => (
                    <div 
                      key={classItem.id} 
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          classItem.attended 
                            ? "bg-success/10 text-success" 
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{classItem.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {classItem.date} • {classItem.trainer}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={classItem.attended 
                          ? "border-success text-success" 
                          : "border-destructive text-destructive"
                        }
                      >
                        {classItem.attended ? "Presente" : "Faltou"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
