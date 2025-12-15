import { Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TrainingPlans() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-16 text-center">
          <Dumbbell className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Planos de Treino</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Os seus planos de treino aparecerão aqui. 
            O seu Personal Trainer pode criar planos personalizados para si.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
