import { Plus, Pencil, Trash2, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
}

interface Staff {
  id: string;
  full_name: string;
}

interface ClassType {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  color: string;
  is_active: boolean;
  room_id?: string | null;
  default_instructor_id?: string | null;
  has_fixed_schedule?: boolean;
  default_start_time?: string | null;
  default_end_time?: string | null;
  default_days_of_week?: number[] | null;
  room?: Room | null;
  default_instructor?: Staff | null;
}

interface ClassTypesSectionProps {
  classTypes: ClassType[];
  onEdit: (classType: ClassType) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function ClassTypesSection({ classTypes, onEdit, onDelete, onCreate }: ClassTypesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading font-semibold text-xl">Tipos de Aula</h2>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {classTypes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <p>Nenhum tipo de aula criado</p>
            <Button 
              variant="link" 
              onClick={onCreate}
              className="mt-2"
            >
              Criar primeiro tipo de aula
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classTypes.map((classType) => (
            <Card 
              key={classType.id} 
              className="hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: classType.color }}
              />
              <CardContent className="p-4 pt-5">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${classType.color}20` }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: classType.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{classType.name}</h3>
                    {classType.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {classType.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>{classType.duration_minutes} min</span>
                      <span>{classType.capacity} vagas</span>
                    </div>
                    {classType.room && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                        <MapPin className="h-3 w-3" />
                        {classType.room.name}
                      </p>
                    )}
                    {classType.default_instructor && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3" />
                        {classType.default_instructor.full_name}
                      </p>
                    )}
                    {classType.has_fixed_schedule && classType.default_start_time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {classType.default_start_time.slice(0, 5)} - {classType.default_end_time?.slice(0, 5)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(classType)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDelete(classType.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
