import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { ScheduleClassDialog } from "@/components/company/classes/ScheduleClassDialog";
import { EnrollStudentsDialog } from "@/components/company/classes/EnrollStudentsDialog";
import { CalendarSection } from "@/components/company/classes/CalendarSection";
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

export default function Classes() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<ClassSchedule[]>([]);
  const [monthSchedules, setMonthSchedules] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
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

      // Fetch schedules for extended range (for week navigation)
      const weekEnd = addDays(weekStart, 20);
      const { data: weekData, error: weekError } = await supabase
        .from('class_schedules')
        .select(`
          *,
          class:classes(*),
          instructor:staff(full_name)
        `)
        .gte('scheduled_date', format(addDays(weekStart, -14), 'yyyy-MM-dd'))
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

  const handleDeleteSchedule = async () => {
    if (!deleteConfirm) return;
    
    try {
      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', deleteConfirm);
      
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Aulas e Serviços</h1>
      </div>

      <CalendarSection
        weekSchedules={weekSchedules}
        monthSchedules={monthSchedules}
        hasClassTypes={classTypes.length > 0}
        onEnroll={(schedule) => {
          setSelectedSchedule(schedule);
          setShowEnrollDialog(true);
        }}
        onDelete={(id) => setDeleteConfirm(id)}
        onScheduleClass={() => setShowScheduleDialog(true)}
      />

      {/* Dialogs */}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar esta aula agendada? Todas as inscrições serão canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSchedule}
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
