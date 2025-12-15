import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentClasses() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-16 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aulas e Horários</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            As suas aulas e horários aparecerão aqui. 
            Quando a sua empresa ativar o sistema de agendamento, poderá ver e gerir as suas aulas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
