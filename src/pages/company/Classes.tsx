import { useTranslation } from "react-i18next";
import { Plus, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockClasses = [
  { id: 1, name: "Yoga Matinal", time: "08:00 - 09:00", trainer: "Ana Costa", students: 12, capacity: 15, day: "seg" },
  { id: 2, name: "CrossFit", time: "10:00 - 11:00", trainer: "Pedro Silva", students: 8, capacity: 10, day: "seg" },
  { id: 3, name: "Pilates", time: "14:00 - 15:00", trainer: "Marta Reis", students: 15, capacity: 15, day: "ter" },
  { id: 4, name: "Funcional", time: "18:00 - 19:00", trainer: "João Santos", students: 10, capacity: 12, day: "qua" },
  { id: 5, name: "Spinning", time: "07:00 - 08:00", trainer: "Carlos Ferreira", students: 18, capacity: 20, day: "qui" },
  { id: 6, name: "Zumba", time: "19:00 - 20:00", trainer: "Sofia Lima", students: 22, capacity: 25, day: "sex" },
];

const weekDays = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
];

export default function Classes() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.classes")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">Semana: 2-8 Dezembro 2024</span>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Aula
          </Button>
        </div>

        {/* Classes by Day */}
        <Tabs defaultValue="seg" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {weekDays.map((day) => (
              <TabsTrigger key={day.key} value={day.key} className="min-w-[100px]">
                {day.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {weekDays.map((day) => (
            <TabsContent key={day.key} value={day.key} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockClasses
                  .filter((c) => c.day === day.key)
                  .map((classItem) => (
                    <Card key={classItem.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-heading font-semibold text-lg text-foreground">
                            {classItem.name}
                          </h3>
                          <Badge variant="outline" className="border-primary text-primary">
                            {classItem.students}/{classItem.capacity}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{classItem.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{classItem.trainer}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Ver Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {mockClasses.filter((c) => c.day === day.key).length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Nenhuma aula agendada para este dia
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* All Services */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {["Yoga", "CrossFit", "Pilates", "Funcional", "Spinning", "Zumba", "Musculação", "Personal Training"].map((service) => (
                <div key={service} className="p-4 bg-muted/30 rounded-xl text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="font-medium text-foreground">{service}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
