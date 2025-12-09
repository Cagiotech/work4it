import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const todayClasses = [
  { id: 1, time: "08:00", student: "Maria Santos", type: "Musculação", attended: true },
  { id: 2, time: "09:30", student: "Pedro Costa", type: "Funcional", attended: true },
  { id: 3, time: "11:00", student: "Ana Ferreira", type: "Pilates", attended: true },
  { id: 4, time: "14:00", student: "João Oliveira", type: "Musculação", attended: null },
  { id: 5, time: "16:00", student: "Sofia Rodrigues", type: "HIIT", attended: null },
  { id: 6, time: "17:30", student: "Miguel Almeida", type: "Funcional", attended: null },
];

const weeklyStats = [
  { day: "Segunda", total: 6, present: 5, absent: 1 },
  { day: "Terça", total: 4, present: 4, absent: 0 },
  { day: "Quarta", total: 5, present: 4, absent: 1 },
  { day: "Quinta", total: 4, present: 3, absent: 1 },
  { day: "Sexta", total: 5, present: 5, absent: 0 },
  { day: "Sábado", total: 2, present: 2, absent: 0 },
];

const studentAttendance = [
  { name: "Maria Santos", total: 12, present: 11, rate: 92 },
  { name: "Pedro Costa", total: 12, present: 10, rate: 83 },
  { name: "Ana Ferreira", total: 12, present: 12, rate: 100 },
  { name: "João Oliveira", total: 8, present: 6, rate: 75 },
  { name: "Sofia Rodrigues", total: 10, present: 9, rate: 90 },
  { name: "Miguel Almeida", total: 10, present: 8, rate: 80 },
];

export default function PersonalAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classes, setClasses] = useState(todayClasses);
  const [filterMonth, setFilterMonth] = useState("current");

  const handleAttendanceChange = (id: number, attended: boolean) => {
    setClasses(classes.map(cls => 
      cls.id === id ? { ...cls, attended } : cls
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lista de Presença</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Registar e acompanhar a presença dos alunos
          </p>
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Today's Classes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Aulas de Hoje
            </CardTitle>
            <CardDescription>Marcar presença dos alunos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    cls.attended === true
                      ? "bg-green-500/5 border-green-500/20"
                      : cls.attended === false
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="font-bold">{cls.time}</span>
                    <span className="text-xs text-muted-foreground">{cls.type}</span>
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {cls.student.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-medium">{cls.student}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={cls.attended === true ? "default" : "outline"}
                      size="sm"
                      className={cls.attended === true ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => handleAttendanceChange(cls.id, true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="hidden md:inline">Presente</span>
                    </Button>
                    <Button
                      variant={cls.attended === false ? "default" : "outline"}
                      size="sm"
                      className={cls.attended === false ? "bg-red-600 hover:bg-red-700" : ""}
                      onClick={() => handleAttendanceChange(cls.id, false)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="hidden md:inline">Falta</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Semanal</CardTitle>
            <CardDescription>Taxa de presença por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyStats.map((day) => (
                <div key={day.day} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(day.present / day.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {day.present}/{day.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance Overview */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Taxa de Presença por Aluno</CardTitle>
            <CardDescription>Acompanhamento mensal de presenças</CardDescription>
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Este Mês</SelectItem>
              <SelectItem value="last">Mês Passado</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {studentAttendance.map((student) => (
              <div
                key={student.name}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {student.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.present}/{student.total} aulas
                  </p>
                </div>
                <Badge
                  variant={student.rate >= 90 ? "default" : student.rate >= 75 ? "secondary" : "destructive"}
                  className={`${
                    student.rate >= 90
                      ? "bg-green-600"
                      : student.rate >= 75
                      ? "bg-yellow-600"
                      : ""
                  }`}
                >
                  {student.rate}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
