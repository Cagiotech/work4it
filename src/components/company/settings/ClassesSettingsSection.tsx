import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, MapPin, User, Users, LayoutGrid, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const colorOptions = [
  "#aeca12", "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

const daysOfWeek = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function ClassesSettingsSection() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'class-types' | 'rooms'>('class-types');
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Class Type Dialog
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const [classFormData, setClassFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    capacity: 10,
    color: "#aeca12",
    room_id: "",
    default_instructor_id: "",
    has_fixed_schedule: false,
    default_start_time: "09:00",
    default_end_time: "10:00",
    default_days_of_week: [] as number[]
  });
  
  // Room Dialog
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    capacity: 10,
    location: ""
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'class' | 'room', id: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      const [roomsRes, staffRes, classesRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('staff').select('id, full_name').eq('company_id', profile.company_id).eq('is_active', true).order('full_name'),
        supabase.from('classes').select(`*, room:rooms(id, name, capacity, location), default_instructor:staff!classes_default_instructor_id_fkey(id, full_name)`).eq('company_id', profile.company_id).order('name')
      ]);
      
      if (roomsRes.error) throw roomsRes.error;
      if (staffRes.error) throw staffRes.error;
      if (classesRes.error) throw classesRes.error;
      
      setRooms(roomsRes.data || []);
      setStaff(staffRes.data || []);
      setClassTypes(classesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  // Class Type handlers
  useEffect(() => {
    if (selectedClassType) {
      setClassFormData({
        name: selectedClassType.name,
        description: selectedClassType.description || "",
        duration_minutes: selectedClassType.duration_minutes,
        capacity: selectedClassType.capacity,
        color: selectedClassType.color,
        room_id: selectedClassType.room_id || "",
        default_instructor_id: selectedClassType.default_instructor_id || "",
        has_fixed_schedule: selectedClassType.has_fixed_schedule || false,
        default_start_time: selectedClassType.default_start_time?.slice(0, 5) || "09:00",
        default_end_time: selectedClassType.default_end_time?.slice(0, 5) || "10:00",
        default_days_of_week: selectedClassType.default_days_of_week || []
      });
    } else {
      setClassFormData({
        name: "",
        description: "",
        duration_minutes: 60,
        capacity: 10,
        color: "#aeca12",
        room_id: "",
        default_instructor_id: "",
        has_fixed_schedule: false,
        default_start_time: "09:00",
        default_end_time: "10:00",
        default_days_of_week: []
      });
    }
  }, [selectedClassType, showClassDialog]);

  const toggleDay = (day: number) => {
    setClassFormData(prev => ({
      ...prev,
      default_days_of_week: prev.default_days_of_week.includes(day)
        ? prev.default_days_of_week.filter(d => d !== day)
        : [...prev.default_days_of_week, day]
    }));
  };

  const handleSaveClassType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setSaving(true);
    try {
      const payload = {
        name: classFormData.name,
        description: classFormData.description || null,
        duration_minutes: classFormData.duration_minutes,
        capacity: classFormData.capacity,
        color: classFormData.color,
        room_id: classFormData.room_id || null,
        default_instructor_id: classFormData.default_instructor_id || null,
        has_fixed_schedule: classFormData.has_fixed_schedule,
        default_start_time: classFormData.has_fixed_schedule ? classFormData.default_start_time : null,
        default_end_time: classFormData.has_fixed_schedule ? classFormData.default_end_time : null,
        default_days_of_week: classFormData.has_fixed_schedule && classFormData.default_days_of_week.length > 0 
          ? classFormData.default_days_of_week 
          : null
      };

      if (selectedClassType) {
        const { error } = await supabase.from('classes').update(payload).eq('id', selectedClassType.id);
        if (error) throw error;
        toast.success('Tipo de aula atualizado');
      } else {
        const { error } = await supabase.from('classes').insert({ ...payload, company_id: profile.company_id });
        if (error) throw error;
        toast.success('Tipo de aula criado');
      }

      fetchData();
      setShowClassDialog(false);
      setSelectedClassType(null);
    } catch (error) {
      console.error('Error saving class type:', error);
      toast.error('Erro ao guardar tipo de aula');
    } finally {
      setSaving(false);
    }
  };

  // Room handlers
  useEffect(() => {
    if (selectedRoom) {
      setRoomFormData({
        name: selectedRoom.name,
        capacity: selectedRoom.capacity,
        location: selectedRoom.location || ""
      });
    } else {
      setRoomFormData({ name: "", capacity: 10, location: "" });
    }
  }, [selectedRoom, showRoomDialog]);

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    setSaving(true);
    try {
      if (selectedRoom) {
        const { error } = await supabase.from('rooms').update({
          name: roomFormData.name,
          capacity: roomFormData.capacity,
          location: roomFormData.location || null
        }).eq('id', selectedRoom.id);
        if (error) throw error;
        toast.success('Sala atualizada');
      } else {
        const { error } = await supabase.from('rooms').insert({
          company_id: profile.company_id,
          name: roomFormData.name,
          capacity: roomFormData.capacity,
          location: roomFormData.location || null
        });
        if (error) throw error;
        toast.success('Sala criada');
      }

      fetchData();
      setShowRoomDialog(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Erro ao guardar sala');
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'class') {
        const { error } = await supabase.from('classes').delete().eq('id', deleteConfirm.id);
        if (error) throw error;
        toast.success('Tipo de aula eliminado');
      } else {
        const { error } = await supabase.from('rooms').delete().eq('id', deleteConfirm.id);
        if (error) throw error;
        toast.success('Sala eliminada');
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao eliminar');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'class-types' | 'rooms')}>
        <TabsList>
          <TabsTrigger value="class-types" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Tipos de Aula
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-2">
            <DoorOpen className="h-4 w-4" />
            Salas
          </TabsTrigger>
        </TabsList>

        {/* Class Types Tab */}
        <TabsContent value="class-types" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Configure os tipos de aulas disponíveis na sua empresa.
            </p>
            <Button onClick={() => { setSelectedClassType(null); setShowClassDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Tipo
            </Button>
          </div>

          {classTypes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tipo de aula criado</p>
                <Button variant="link" onClick={() => setShowClassDialog(true)} className="mt-2">
                  Criar primeiro tipo de aula
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classTypes.map((classType) => (
                <Card key={classType.id} className="hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: classType.color }} />
                  <CardContent className="p-4 pt-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${classType.color}20` }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: classType.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{classType.name}</h3>
                        {classType.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{classType.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>{classType.duration_minutes} min</span>
                          <span>{classType.capacity} vagas</span>
                        </div>
                        {classType.room && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                            <MapPin className="h-3 w-3" />{classType.room.name}
                          </p>
                        )}
                        {classType.default_instructor && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" />{classType.default_instructor.full_name}
                          </p>
                        )}
                        {classType.has_fixed_schedule && classType.default_start_time && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />{classType.default_start_time.slice(0, 5)} - {classType.default_end_time?.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedClassType(classType); setShowClassDialog(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ type: 'class', id: classType.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Configure as salas disponíveis para aulas.
            </p>
            <Button onClick={() => { setSelectedRoom(null); setShowRoomDialog(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Sala
            </Button>
          </div>

          {rooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sala criada</p>
                <Button variant="link" onClick={() => setShowRoomDialog(true)} className="mt-2">
                  Criar primeira sala
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-all group relative">
                  <CardContent className="p-4">
                    <div className="font-medium text-foreground">{room.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{room.capacity}</span>
                      {room.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{room.location}</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedRoom(room); setShowRoomDialog(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteConfirm({ type: 'room', id: room.id })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Class Type Dialog */}
      <Dialog open={showClassDialog} onOpenChange={(open) => { setShowClassDialog(open); if (!open) setSelectedClassType(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClassType ? 'Editar' : 'Criar'} Tipo de Aula</DialogTitle>
            <DialogDescription>
              {selectedClassType ? 'Edite os dados do tipo de aula' : 'Defina um novo tipo de aula'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveClassType}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Nome *</Label>
                <Input id="class-name" value={classFormData.name} onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })} placeholder="Ex: Yoga, CrossFit, Pilates" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-description">Descrição</Label>
                <Textarea id="class-description" value={classFormData.description} onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })} placeholder="Descrição opcional" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class-duration">Duração (min)</Label>
                  <Input id="class-duration" type="number" min={15} max={240} value={classFormData.duration_minutes} onChange={(e) => setClassFormData({ ...classFormData, duration_minutes: parseInt(e.target.value) || 60 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class-capacity">Capacidade</Label>
                  <Input id="class-capacity" type="number" min={1} max={100} value={classFormData.capacity} onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) || 10 })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button key={color} type="button" className={`w-8 h-8 rounded-full transition-all ${classFormData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: color }} onClick={() => setClassFormData({ ...classFormData, color })} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sala</Label>
                <Select value={classFormData.room_id} onValueChange={(value) => setClassFormData({ ...classFormData, room_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma sala (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>{room.name} {room.location ? `(${room.location})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instrutor Padrão</Label>
                <Select value={classFormData.default_instructor_id} onValueChange={(value) => setClassFormData({ ...classFormData, default_instructor_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um instrutor (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="has_fixed_schedule" checked={classFormData.has_fixed_schedule} onCheckedChange={(checked) => setClassFormData({ ...classFormData, has_fixed_schedule: checked === true })} />
                <Label htmlFor="has_fixed_schedule" className="cursor-pointer">Definir horário padrão</Label>
              </div>
              {classFormData.has_fixed_schedule && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Hora de início</Label>
                      <Input id="start_time" type="time" value={classFormData.default_start_time} onChange={(e) => setClassFormData({ ...classFormData, default_start_time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Hora de fim</Label>
                      <Input id="end_time" type="time" value={classFormData.default_end_time} onChange={(e) => setClassFormData({ ...classFormData, default_end_time: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dias da semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <Button key={day.value} type="button" variant={classFormData.default_days_of_week.includes(day.value) ? "default" : "outline"} size="sm" onClick={() => toggleDay(day.value)} className="min-w-[50px]">
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowClassDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'A guardar...' : selectedClassType ? 'Guardar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={showRoomDialog} onOpenChange={(open) => { setShowRoomDialog(open); if (!open) setSelectedRoom(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? 'Editar' : 'Criar'} Sala</DialogTitle>
            <DialogDescription>{selectedRoom ? 'Edite os dados da sala' : 'Adicione uma nova sala'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRoom}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Nome *</Label>
                <Input id="room-name" value={roomFormData.name} onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })} placeholder="Ex: Sala 1, Estúdio A" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-capacity">Capacidade</Label>
                <Input id="room-capacity" type="number" min={1} max={500} value={roomFormData.capacity} onChange={(e) => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) || 10 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-location">Localização</Label>
                <Input id="room-location" value={roomFormData.location} onChange={(e) => setRoomFormData({ ...roomFormData, location: e.target.value })} placeholder="Ex: Piso 1, Bloco A" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRoomDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'A guardar...' : selectedRoom ? 'Guardar' : 'Criar'}</Button>
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
              {deleteConfirm?.type === 'class' 
                ? 'Tem certeza que deseja eliminar este tipo de aula? Todas as aulas agendadas deste tipo também serão eliminadas.'
                : 'Tem certeza que deseja eliminar esta sala? As aulas associadas ficarão sem sala atribuída.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
