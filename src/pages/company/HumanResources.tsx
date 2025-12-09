import { useTranslation } from "react-i18next";
import { Plus, Search, Filter, Users, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";

const mockStaff = [
  { id: 1, name: "João Silva", role: "Personal Trainer", email: "joao@email.com", status: "active", students: 15 },
  { id: 2, name: "Ana Costa", role: "Personal Trainer", email: "ana@email.com", status: "active", students: 12 },
  { id: 3, name: "Pedro Martins", role: "Rececionista", email: "pedro@email.com", status: "active", students: 0 },
  { id: 4, name: "Marta Reis", role: "Personal Trainer", email: "marta@email.com", status: "vacation", students: 8 },
];

export default function HumanResources() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Staff" value={12} icon={Users} />
        <StatCard title="Personal Trainers" value={8} icon={UserCheck} />
        <StatCard title="De Férias" value={1} icon={UserX} />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar staff..." className="pl-10" /></div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Adicionar Staff</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Equipa</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockStaff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback className="bg-primary/10 text-primary">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div><p className="font-medium">{member.name}</p><p className="text-xs text-muted-foreground">{member.role}</p></div>
                </div>
                <Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status === "active" ? "Ativo" : "Férias"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
