import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, LayoutGrid, DoorOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { CreateClassDialog } from "@/components/company/classes/CreateClassDialog";
import { ScheduleClassDialog } from "@/components/company/classes/ScheduleClassDialog";
import { EnrollStudentsDialog } from "@/components/company/classes/EnrollStudentsDialog";
import { CalendarSection } from "@/components/company/classes/CalendarSection";
import { ClassTypesSection } from "@/components/company/classes/ClassTypesSection";
import { RoomsSection } from "@/components/company/classes/RoomsSection";
import { cn } from "@/lib/utils";
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

interface ClassSchedule {
  id: string;
  class_id: string;
  instructor_id: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  class: {
    id: string;
    name: string;
    capacity: number;
    color: string;
    room?: Room | null;
  };
  instructor: { full_name: string } | null;
  enrollments_count: number;
}

type ActiveSection = 'calendar' | 'class-types' | 'rooms';

const sidebarItems = [
  { key: 'calendar' as const, label: 'Calendário', icon: Calendar },
  { key: 'class-types' as const, label: 'Tipos de Aula', icon: LayoutGrid },
  { key: 'rooms' as const, label: 'Salas', icon: DoorOpen },
];

export default function Classes() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<ActiveSection>('calendar');
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<ClassSchedule[]>([]);
  const [monthSchedules, setMonthSchedules] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'class' | 'schedule', id: string } | null>(null);
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const fetchData = async () => {
    if (!profile?.company_id) return;
    
    setIsLoading(true);
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');
      
      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('full_name');
      
      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Fetch class types with room and instructor
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          room:rooms(id, name, capacity, location),
          default_instructor:staff!classes_default_instructor_id_fkey(id, full_name)
        `)
        .eq('company_id', profile.company_id)
        .order('name');
      
      if (classError) throw classError;
      setClassTypes(classes || []);

      // Fetch schedules for this week (extended range for week navigation)
      const weekEnd = addDays(weekStart, 13); // 2 weeks ahead
      const { data: weekData, error: weekError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(*),
          instructor:staff(full_name)
        `)
        .gte('scheduled_date', format(addDays(weekStart, -7), 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date')
        .order('start_time');

      if (weekError) throw weekError;

      // Fetch schedules for current month (for calendar view)
      const { data: monthData, error: monthError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(*),
          instructor:staff(full_name)
        `)
        .gte('scheduled_date', format(currentMonthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(currentMonthEnd, 'yyyy-MM-dd'))
        .order('scheduled_date')
        .order('start_time');

      if (monthError) throw monthError;

      // Helper to add enrollment counts
      const addEnrollmentCounts = async (schedulesData: any[]) => {
        return Promise.all(
          (schedulesData || []).map(async (schedule) => {
            const { count } = await supabase
              .from('class_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('class_schedule_id', schedule.id)
              .neq('status', 'cancelled');
            
            return {
              ...schedule,
              enrollments_count: count || 0
            };
          })
        );
      };

      const weekWithCounts = await addEnrollmentCounts(weekData || []);
      const monthWithCounts = await addEnrollmentCounts(monthData || []);

      setWeekSchedules(weekWithCounts);
      setMonthSchedules(monthWithCounts);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleDeleteClass = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'class') return;
    
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      toast.success('Tipo de aula eliminado');
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Erro ao eliminar tipo de aula');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'schedule') return;
    
    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', deleteConfirm.id);
      
      if (error) throw error;
      toast.success('Aula eliminada');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Erro ao eliminar aula');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
      {/* Side Navigation */}
      <div className="w-48 shrink-0 hidden md:block">
        <nav className="sticky top-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeSection === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 p-2">
        <div className="flex justify-around">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs transition-colors",
                activeSection === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pb-20 md:pb-0">
        {activeSection === 'calendar' && (
          <CalendarSection
            weekSchedules={weekSchedules}
            monthSchedules={monthSchedules}
            onEnroll={(schedule) => {
              setSelectedSchedule(schedule);
              setShowEnrollDialog(true);
            }}
            onDelete={(id) => setDeleteConfirm({ type: 'schedule', id })}
            onScheduleClass={() => setShowScheduleDialog(true)}
          />
        )}

        {activeSection === 'class-types' && (
          <ClassTypesSection
            classTypes={classTypes}
            onEdit={(classType) => {
              setSelectedClassType(classType);
              setShowCreateDialog(true);
            }}
            onDelete={(id) => setDeleteConfirm({ type: 'class', id })}
            onCreate={() => setShowCreateDialog(true)}
          />
        )}

        {activeSection === 'rooms' && (
          <RoomsSection rooms={rooms} onRefresh={fetchData} />
        )}
      </div>

      {/* Dialogs */}
      <CreateClassDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setSelectedClassType(null);
        }}
        classType={selectedClassType}
        rooms={rooms}
        staff={staff}
        onSuccess={fetchData}
      />

      <ScheduleClassDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        classTypes={classTypes}
        rooms={rooms}
        staff={staff}
        onSuccess={fetchData}
      />

      <EnrollStudentsDialog
        open={showEnrollDialog}
        onOpenChange={(open) => {
          setShowEnrollDialog(open);
          if (!open) setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        onSuccess={fetchData}
      />

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'class' 
                ? 'Tem certeza que deseja eliminar este tipo de aula? Todas as aulas agendadas deste tipo também serão eliminadas.'
                : 'Tem certeza que deseja eliminar esta aula agendada? Todas as inscrições serão canceladas.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteConfirm?.type === 'class' ? handleDeleteClass : handleDeleteSchedule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
