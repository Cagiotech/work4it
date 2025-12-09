import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, LayoutGrid, List, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStudentDialog } from "@/components/company/students/AddStudentDialog";
import { StudentProfileDialog } from "@/components/company/students/StudentProfileDialog";

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

const initialStudents: Student[] = [
  { id: 1, name: "Maria Santos", email: "maria@email.com", phone: "+351 912 345 678", birthDate: "1995-03-15", plan: "Premium", status: "active", trainer: "João Silva", documents: [{ name: "contrato.pdf", type: "pdf", size: "1.2 MB" }], classes: [{ name: "Musculação", date: "2024-01-15", time: "09:00" }] },
  { id: 2, name: "Pedro Costa", email: "pedro@email.com", phone: "+351 923 456 789", birthDate: "1990-07-22", plan: "Basic", status: "active", trainer: "Ana Costa", documents: [], classes: [] },
  { id: 3, name: "Ana Rodrigues", email: "ana@email.com", phone: "+351 934 567 890", birthDate: "1988-11-08", plan: "Premium", status: "pending", trainer: "João Silva", documents: [], classes: [{ name: "Yoga", date: "2024-01-16", time: "18:00" }] },
  { id: 4, name: "Carlos Oliveira", email: "carlos@email.com", phone: "+351 945 678 901", birthDate: "1992-05-30", plan: "Basic", status: "active", trainer: "Marta Reis", documents: [], classes: [] },
  { id: 5, name: "Sofia Ferreira", email: "sofia@email.com", phone: "+351 956 789 012", birthDate: "1997-09-12", plan: "VIP", status: "active", trainer: "Ana Costa", documents: [], classes: [] },
];

export default function Students() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = filterPlan === "all" || student.plan === filterPlan;
        const matchesStatus = filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesPlan && matchesStatus;
      })
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [students, searchTerm, sortOrder, filterPlan, filterStatus]);

  const handleAddStudent = (data: { name: string; email: string; phone: string; birthDate: string }) => {
    const newStudent: Student = {
      id: students.length + 1,
      ...data,
      plan: "Basic",
      status: "pending",
      trainer: "",
      documents: [],
      classes: [],
    };
    setStudents([...students, newStudent]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    setSelectedStudent(updatedStudent);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setProfileDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold">{t("dashboard.students")}</h1>
        <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("students.addStudent")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("students.searchPlaceholder")}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t("students.plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("students.allPlans")}</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t("students.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("students.allStatus")}</SelectItem>
                <SelectItem value="active">{t("students.active")}</SelectItem>
                <SelectItem value="pending">{t("students.pending")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                title={sortOrder === "asc" ? "A-Z" : "Z-A"}
              >
                {sortOrder === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStudentClick(student)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{student.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={student.plan === "Premium" || student.plan === "VIP" ? "default" : "secondary"}>
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
                <div className="mt-3 text-sm text-muted-foreground">
                  <span>{t("students.trainer")}: </span>
                  <span className="font-medium text-foreground">{student.trainer || "-"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.email")}</TableHead>
                <TableHead>{t("auth.phone")}</TableHead>
                <TableHead>{t("students.plan")}</TableHead>
                <TableHead>{t("students.status")}</TableHead>
                <TableHead>{t("students.trainer")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => handleStudentClick(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    <Badge variant={student.plan === "Premium" || student.plan === "VIP" ? "default" : "secondary"}>
                      {student.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{student.trainer || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t("students.noStudentsFound")}
        </div>
      )}

      {/* Dialogs */}
      <AddStudentDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddStudent} />
      <StudentProfileDialog
        student={selectedStudent}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onUpdate={handleUpdateStudent}
      />
    </div>
  );
}
