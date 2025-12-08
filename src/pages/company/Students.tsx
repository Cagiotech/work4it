import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockStudents = [
  { id: 1, name: "Maria Santos", email: "maria@email.com", plan: "Premium", status: "active", trainer: "João Silva", avatar: "" },
  { id: 2, name: "Pedro Costa", email: "pedro@email.com", plan: "Basic", status: "active", trainer: "Ana Costa", avatar: "" },
  { id: 3, name: "Ana Rodrigues", email: "ana@email.com", plan: "Premium", status: "pending", trainer: "João Silva", avatar: "" },
  { id: 4, name: "Carlos Oliveira", email: "carlos@email.com", plan: "Basic", status: "active", trainer: "Marta Reis", avatar: "" },
  { id: 5, name: "Sofia Martins", email: "sofia@email.com", plan: "Premium", status: "inactive", trainer: "Pedro Silva", avatar: "" },
];

export default function Students() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.students")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar alunos..." className="pl-10" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Aluno
          </Button>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Personal</p>
                    <p className="text-sm font-medium text-foreground">{student.trainer}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={student.plan === "Premium" ? "default" : "secondary"}>
                      {student.plan}
                    </Badge>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={
                          student.status === "active" ? "border-success text-success" :
                          student.status === "pending" ? "border-warning text-warning" :
                          "border-destructive text-destructive"
                        }
                      >
                        {student.status === "active" ? "Ativo" : 
                         student.status === "pending" ? "Pendente" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
