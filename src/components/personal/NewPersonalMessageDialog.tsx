import { useState, useEffect } from "react";
import { Search, Users, GraduationCap, Building2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Recipient {
  id: string;
  name: string;
  type: 'student' | 'company';
  email?: string;
}

interface NewPersonalMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipients: (recipients: Recipient[]) => void;
  staffId: string;
  companyId: string;
}

export function NewPersonalMessageDialog({ 
  open, 
  onOpenChange, 
  onSelectRecipients,
  staffId,
  companyId 
}: NewPersonalMessageDialogProps) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Recipient[]>([]);
  const [company, setCompany] = useState<Recipient | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    if (open && staffId && companyId) {
      fetchRecipients();
    }
  }, [open, staffId, companyId]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      // Fetch company info
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', companyId)
        .single();

      if (companyData) {
        setCompany({
          id: companyData.id,
          name: companyData.name || 'Administração',
          type: 'company'
        });
      }

      // Fetch students assigned to this personal trainer
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, email')
        .eq('personal_trainer_id', staffId)
        .eq('status', 'active');

      if (studentsData) {
        const mappedStudents: Recipient[] = studentsData.map(s => ({
          id: s.id,
          name: s.full_name,
          type: 'student' as const,
          email: s.email || undefined
        }));
        setStudents(mappedStudents.sort((a, b) => a.name.localeCompare(b.name)));
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

  const selectAllStudents = () => {
    const filtered = students.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    const allSelected = filtered.every(r => isSelected(r));
    
    if (allSelected) {
      setSelectedRecipients(prev => 
        prev.filter(r => r.type !== 'student' || !filtered.some(f => f.id === r.id))
      );
    } else {
      setSelectedRecipients(prev => {
        const existing = prev.filter(r => r.type !== 'student' || !filtered.some(f => f.id === r.id));
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
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
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
                      checked={filteredStudents.length > 0 && filteredStudents.every(r => isSelected(r))}
                      onCheckedChange={() => selectAllStudents()}
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

          <TabsContent value="company" className="flex-1 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : company ? (
              <div
                onClick={() => toggleRecipient(company)}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border"
              >
                <Checkbox checked={isSelected(company)} />
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500/10 text-blue-600">
                    {getInitials(company.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-muted-foreground">Administração da Empresa</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Empresa não encontrada</p>
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
