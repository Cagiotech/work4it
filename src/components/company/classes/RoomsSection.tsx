import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  is_active?: boolean;
}

interface RoomsSectionProps {
  rooms: Room[];
  onRefresh: () => void;
}

export function RoomsSection({ rooms, onRefresh }: RoomsSectionProps) {
  const { profile } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    capacity: 10,
    location: ""
  });

  useEffect(() => {
    if (selectedRoom) {
      setFormData({
        name: selectedRoom.name,
        capacity: selectedRoom.capacity,
        location: selectedRoom.location || ""
      });
    } else {
      setFormData({
        name: "",
        capacity: 10,
        location: ""
      });
    }
  }, [selectedRoom, showDialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setIsLoading(true);
    try {
      if (selectedRoom) {
        const { error } = await supabase
          .from('rooms')
          .update({
            name: formData.name,
            capacity: formData.capacity,
            location: formData.location || null
          })
          .eq('id', selectedRoom.id);

        if (error) throw error;
        toast.success('Sala atualizada');
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert({
            company_id: profile.company_id,
            name: formData.name,
            capacity: formData.capacity,
            location: formData.location || null
          });

        if (error) throw error;
        toast.success('Sala criada');
      }

      onRefresh();
      setShowDialog(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Erro ao guardar sala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', deleteConfirm);

      if (error) throw error;
      toast.success('Sala eliminada');
      onRefresh();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Erro ao eliminar sala');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Salas</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedRoom(null);
              setShowDialog(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nova Sala
          </Button>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>Nenhuma sala criada</p>
              <Button 
                variant="link" 
                onClick={() => setShowDialog(true)}
                className="mt-1"
              >
                Criar primeira sala
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {rooms.map((room) => (
                <div 
                  key={room.id} 
                  className="p-3 rounded-lg border bg-card hover:shadow-md transition-all group relative"
                >
                  <div className="font-medium text-foreground">{room.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </span>
                    {room.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {room.location}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowDialog(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => setDeleteConfirm(room.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) setSelectedRoom(null);
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? 'Editar' : 'Criar'} Sala</DialogTitle>
            <DialogDescription>
              {selectedRoom ? 'Edite os dados da sala' : 'Adicione uma nova sala'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Nome *</Label>
                <Input
                  id="room-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Sala 1, Estúdio A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-capacity">Capacidade</Label>
                <Input
                  id="room-capacity"
                  type="number"
                  min={1}
                  max={500}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 10 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-location">Localização</Label>
                <Input
                  id="room-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Piso 1, Bloco A"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'A guardar...' : selectedRoom ? 'Guardar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar esta sala? As aulas associadas ficarão sem sala atribuída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
