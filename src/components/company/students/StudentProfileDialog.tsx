import { useState } from "react";
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

export function StudentProfileDialog({ student, open, onOpenChange, onUpdate }: StudentProfileDialogProps) {
  const { t } = useTranslation();
  const [editData, setEditData] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && student) {
      setEditData({ ...student });
    }
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

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {student.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{student.name}</DialogTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant={student.plan === "Premium" ? "default" : "secondary"}>
                  {student.plan}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    student.status === "active"
                      ? "border-green-500 text-green-600"
                      : "border-yellow-500 text-yellow-600"
                  }
                >
                  {student.status === "active" ? t("students.active") : t("students.pending")}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t("students.profile")}</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("students.planTrainer")}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{t("students.documents")}</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t("students.classes")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("students.fullName")}</Label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("auth.phone")}</Label>
                <Input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("students.birthDate")}</Label>
                <Input
                  type="date"
                  value={editData.birthDate}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleSave}>{t("common.save")}</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>{t("common.edit")}</Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("students.selectPlan")}</Label>
                <Select
                  value={editData.plan}
                  onValueChange={(value) => setEditData({ ...editData, plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.name}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("students.assignTrainer")}</Label>
                <Select
                  value={editData.trainer}
                  onValueChange={(value) => setEditData({ ...editData, trainer: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTrainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.name}>
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>{t("common.save")}</Button>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {t("students.uploadDocuments")}
                  <Button size="sm" className="gap-1">
                    <Upload className="h-4 w-4" />
                    {t("students.upload")}
                  </Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t("students.maxFileSize")}</p>
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
                    {t("students.noDocuments")}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("students.linkedClasses")}</CardTitle>
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
                    {t("students.noClasses")}
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
