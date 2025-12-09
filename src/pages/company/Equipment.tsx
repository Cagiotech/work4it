import { useTranslation } from "react-i18next";
import { Dumbbell, Plus, Search, AlertTriangle, CheckCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

const mockEquipment = [
  { id: 1, name: "Passadeira TechnoGym", category: "Cardio", status: "operational", lastMaintenance: "01/12/2024" },
  { id: 2, name: "Bicicleta Spinning", category: "Cardio", status: "operational", lastMaintenance: "28/11/2024" },
  { id: 3, name: "Rack de Agachamento", category: "Musculação", status: "maintenance", lastMaintenance: "15/11/2024" },
  { id: 4, name: "Banco Supino", category: "Musculação", status: "operational", lastMaintenance: "20/11/2024" },
  { id: 5, name: "Elíptica", category: "Cardio", status: "broken", lastMaintenance: "10/11/2024" },
  { id: 6, name: "Halteres (Set)", category: "Musculação", status: "operational", lastMaintenance: "05/12/2024" },
];

export default function Equipment() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Equipamentos"
          value={45}
          icon={Dumbbell}
        />
        <StatCard
          title="Em Manutenção"
          value={3}
          icon={Wrench}
          className="border-l-4 border-l-warning"
        />
        <StatCard
          title="Avariados"
          value={1}
          icon={AlertTriangle}
          className="border-l-4 border-l-destructive"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar equipamento..." className="pl-10" />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Equipamento
        </Button>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockEquipment.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    item.status === "operational" ? "bg-success/10 text-success" :
                    item.status === "maintenance" ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {item.status === "operational" ? <CheckCircle className="h-5 w-5" /> :
                     item.status === "maintenance" ? <Wrench className="h-5 w-5" /> :
                     <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <Badge variant="secondary" className="mt-1">{item.category}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Última manutenção</p>
                  <p className="text-sm font-medium text-foreground">{item.lastMaintenance}</p>
                </div>
                <Badge 
                  variant="outline"
                  className={
                    item.status === "operational" ? "border-success text-success" :
                    item.status === "maintenance" ? "border-warning text-warning" :
                    "border-destructive text-destructive"
                  }
                >
                  {item.status === "operational" ? "Operacional" :
                   item.status === "maintenance" ? "Manutenção" : "Avariado"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
