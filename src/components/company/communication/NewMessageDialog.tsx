import { useState, useEffect } from "react";
import { Search, Users, GraduationCap, Briefcase, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Recipient {
  id: string;
  name: string;
  type: 'student' | 'staff';
  email?: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipients: (recipients: Recipient[]) => void;
}

export function NewMessageDialog({ open, onOpenChange, onSelectRecipients }: NewMessageDialogProps) {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Recipient[]>([]);
  const [staff, setStaff] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    if (open && profile?.company_id) {
      fetchRecipients();
    }
  }, [open, profile?.company_id]);

  const fetchRecipients = async () => {
    if (!profile?.company_id) return;
    
    setLoading(true);
    try {
      // Fetch students - breaking chain to avoid TS2589
      const studentsResponse = await (supabase
        .from('students')
        .select('id, full_name, email')
        .eq('company_id', profile.company_id) as any)
        .eq('is_active', true);
      
      // Fetch staff
      const staffResponse = await (supabase
        .from('staff')
        .select('id, full_name, email')
        .eq('company_id', profile.company_id) as any)
        .eq('is_active', true);

      if (studentsResponse.data) {
        const mappedStudents: Recipient[] = [];
        for (const s of studentsResponse.data) {
          mappedStudents.push({
            id: s.id,
            name: s.full_name,
            type: 'student',
            email: s.email || undefined
          });
        }
        setStudents(mappedStudents.sort((a, b) => a.name.localeCompare(b.name)));
      }

      if (staffResponse.data) {
        const mappedStaff: Recipient[] = [];
        for (const s of staffResponse.data) {
          mappedStaff.push({
            id: s.id,
            name: s.full_name,
            type: 'staff',
            email: s.email || undefined
          });
        }
        setStaff(mappedStaff.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev => {
      const exists = prev.find(r => r.id === recipient.id && r.type === recipient.type);
      if (exists) {
        return prev.filter(r => !(r.id === recipient.id && r.type === recipient.type));
      }
      return [...prev, recipient];
    });
  };

  const isSelected = (recipient: Recipient) => {
    return selectedRecipients.some(r => r.id === recipient.id && r.type === recipient.type);
  };

  const selectAll = (type: 'student' | 'staff') => {
    const list = type === 'student' ? students : staff;
    const filtered = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    
    const allSelected = filtered.every(r => isSelected(r));
    
    if (allSelected) {
      setSelectedRecipients(prev => 
        prev.filter(r => r.type !== type || !filtered.some(f => f.id === r.id))
      );
    } else {
      setSelectedRecipients(prev => {
        const existing = prev.filter(r => r.type !== type || !filtered.some(f => f.id === r.id));
        return [...existing, ...filtered];
      });
    }
  };

  const handleConfirm = () => {
    if (selectedRecipients.length > 0) {
      onSelectRecipients(selectedRecipients);
      onOpenChange(false);
      setSelectedRecipients([]);
      setSearch("");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nova Mensagem
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedRecipients.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
            {selectedRecipients.map((r) => (
              <Badge
                key={`${r.type}-${r.id}`}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => toggleRecipient(r)}
              >
                {r.name} ×
              </Badge>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Alunos ({students.length})
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Colaboradores ({staff.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="flex-1 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {filteredStudents.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Checkbox
                      checked={filteredStudents.every(r => isSelected(r))}
                      onCheckedChange={() => selectAll('student')}
                    />
                    <span className="text-sm text-muted-foreground">Selecionar todos</span>
                  </div>
                )}
                <ScrollArea className="h-[250px]">
                  <div className="space-y-1">
                    {filteredStudents.map((recipient) => (
                      <div
                        key={recipient.id}
                        onClick={() => toggleRecipient(recipient)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox checked={isSelected(recipient)} />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(recipient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{recipient.name}</p>
                          {recipient.email && (
                            <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredStudents.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Nenhum aluno encontrado</p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="staff" className="flex-1 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {filteredStaff.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Checkbox
                      checked={filteredStaff.every(r => isSelected(r))}
                      onCheckedChange={() => selectAll('staff')}
                    />
                    <span className="text-sm text-muted-foreground">Selecionar todos</span>
                  </div>
                )}
                <ScrollArea className="h-[250px]">
                  <div className="space-y-1">
                    {filteredStaff.map((recipient) => (
                      <div
                        key={recipient.id}
                        onClick={() => toggleRecipient(recipient)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox checked={isSelected(recipient)} />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-secondary/50 text-secondary-foreground text-sm">
                            {getInitials(recipient.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{recipient.name}</p>
                          {recipient.email && (
                            <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredStaff.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Nenhum colaborador encontrado</p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selectedRecipients.length === 0}>
            Iniciar Conversa ({selectedRecipients.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
