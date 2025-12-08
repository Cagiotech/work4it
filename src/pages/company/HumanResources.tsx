import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, Users, UserCheck, UserX } from "lucide-react";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

const mockStaff = [
  { id: 1, name: "João Silva", role: "Personal Trainer", email: "joao@email.com", status: "active", students: 15 },
  { id: 2, name: "Ana Costa", role: "Personal Trainer", email: "ana@email.com", status: "active", students: 12 },
  { id: 3, name: "Pedro Martins", role: "Rececionista", email: "pedro@email.com", status: "active", students: 0 },
  { id: 4, name: "Marta Reis", role: "Personal Trainer", email: "marta@email.com", status: "vacation", students: 8 },
  { id: 5, name: "Carlos Ferreira", role: "Instrutor", email: "carlos@email.com", status: "active", students: 20 },
];

export default function HumanResources() {
  const { t } = useTranslation();

  return (
    <>
      <CompanyHeader title={t("dashboard.hr")} />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Staff"
            value={12}
            icon={Users}
          />
          <StatCard
            title="Personal Trainers"
            value={8}
            icon={UserCheck}
          />
          <StatCard
            title="De Férias"
            value={1}
            icon={UserX}
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar staff..." className="pl-10" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Staff
          </Button>
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle>Equipa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cargo</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Alunos</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStaff.map((member) => (
                    <tr key={member.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={member.role === "Personal Trainer" ? "default" : "secondary"}>
                          {member.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{member.email}</td>
                      <td className="py-3 px-4 text-foreground">{member.students}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline"
                          className={
                            member.status === "active" ? "border-success text-success" :
                            "border-warning text-warning"
                          }
                        >
                          {member.status === "active" ? "Ativo" : "Férias"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">Ver</Button>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
