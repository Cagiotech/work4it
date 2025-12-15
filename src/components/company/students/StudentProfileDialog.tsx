import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, FileText, Calendar, Upload, Trash2 } from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  plan: string;
  status: string;
  trainer: string;
  documents?: { name: string; type: string; size: string }[];
  classes?: { name: string; date: string; time: string }[];
}

interface StudentProfileDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (student: Student) => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const mockTrainers = [
  { id: 1, name: "João Silva" },
  { id: 2, name: "Ana Costa" },
  { id: 3, name: "Marta Reis" },
];

const mockPlans = [
  { id: 1, name: "Basic" },
  { id: 2, name: "Premium" },
  { id: 3, name: "VIP" },
];

export function StudentProfileDialog({ 
  student, 
  open, 
  onOpenChange, 
  onUpdate,
  onDelete,
  canEdit = true,
  canDelete = true,
}: StudentProfileDialogProps) {
  const { t } = useTranslation();
  const [editData, setEditData] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open && student) {
      setEditData({ ...student });
    }
  }, [open, student]);

  const handleOpen = (isOpen: boolean) => {
    setIsEditing(false);
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (editData) {
      onUpdate(editData);
      setIsEditing(false);
    }
  };

  if (!student || !editData) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-600">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-500 text-red-600">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">{student.name}</DialogTitle>
              <div className="flex gap-2 mt-1">
                {getStatusBadge(student.status)}
              </div>
            </div>
            {canDelete && onDelete && (
              <Button 
                variant="outline" 
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Aulas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={editData.birthDate}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData({ ...editData, status: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {canEdit && (
              <div className="flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => {
                      setEditData({ ...student });
                      setIsEditing(false);
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Salvar</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Editar</Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Documentos
                  <Button size="sm" className="gap-1">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Máximo 10MB por arquivo</p>
              </CardHeader>
              <CardContent>
                {student.documents && student.documents.length > 0 ? (
                  <div className="space-y-2">
                    {student.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.size}</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum documento anexado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Aulas Vinculadas</CardTitle>
              </CardHeader>
              <CardContent>
                {student.classes && student.classes.length > 0 ? (
                  <div className="space-y-2">
                    {student.classes.map((cls, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cls.date} - {cls.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma aula vinculada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
