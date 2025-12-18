import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, Users, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isFuture, isPast, isToday, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { pt } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string | null;
  max_participants: number | null;
}

export default function PersonalEvents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!staff) return;

      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('company_id', staff.company_id)
        .gte('event_date', monthStart)
        .lte('event_date', monthEnd)
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const eventDate = parseISO(event.event_date);
    if (filter === 'upcoming') return isFuture(eventDate) || isToday(eventDate);
    if (filter === 'past') return isPast(eventDate) && !isToday(eventDate);
    return true;
  });

  const getEventTypeLabel = (type: string | null) => {
    switch (type) {
      case 'training': return 'Formação';
      case 'meeting': return 'Reunião';
      case 'competition': return 'Competição';
      case 'workshop': return 'Workshop';
      case 'social': return 'Social';
      default: return 'Geral';
    }
  };

  const getEventTypeColor = (type: string | null) => {
    switch (type) {
      case 'training': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'meeting': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'competition': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'workshop': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'social': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Eventos e atividades da empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="min-w-[140px]">
            {format(currentMonth, 'MMMM yyyy', { locale: pt })}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('upcoming')}
            >
              Próximos
            </Button>
            <Button
              variant={filter === 'past' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('past')}
            >
              Passados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'upcoming' 
                ? 'Não há eventos futuros este mês'
                : filter === 'past'
                ? 'Não há eventos passados este mês'
                : 'Não há eventos este mês'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEvents.map((event) => {
            const eventDate = parseISO(event.event_date);
            const isPastEvent = isPast(eventDate) && !isToday(eventDate);
            
            return (
              <Card 
                key={event.id} 
                className={`hover:shadow-md transition-shadow ${isPastEvent ? 'opacity-70' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {event.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {getEventTypeLabel(event.event_type)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={isToday(eventDate) ? 'text-primary font-medium' : ''}>
                      {isToday(eventDate) 
                        ? 'Hoje' 
                        : format(eventDate, "EEEE, d 'de' MMMM", { locale: pt })}
                    </span>
                  </div>
                  
                  {(event.start_time || event.end_time) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {event.start_time?.substring(0, 5)}
                        {event.end_time && ` - ${event.end_time.substring(0, 5)}`}
                      </span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.max_participants && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Máximo {event.max_participants} participantes</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
