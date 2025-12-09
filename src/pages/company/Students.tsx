import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mockStudents = [
  { id: 1, name: "Maria Santos", email: "maria@email.com", plan: "Premium", status: "active", trainer: "João Silva" },
  { id: 2, name: "Pedro Costa", email: "pedro@email.com", plan: "Basic", status: "active", trainer: "Ana Costa" },
  { id: 3, name: "Ana Rodrigues", email: "ana@email.com", plan: "Premium", status: "pending", trainer: "João Silva" },
  { id: 4, name: "Carlos Oliveira", email: "carlos@email.com", plan: "Basic", status: "active", trainer: "Marta Reis" },
];

export default function Students() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Pesquisar alunos..." className="pl-10" /></div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Adicionar Aluno</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockStudents.map((student) => (
          <Card key={student.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar><AvatarFallback className="bg-primary/10 text-primary">{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div><h3 className="font-semibold">{student.name}</h3><p className="text-sm text-muted-foreground">{student.email}</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={student.plan === "Premium" ? "default" : "secondary"}>{student.plan}</Badge>
                <Badge variant="outline" className={student.status === "active" ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"}>{student.status === "active" ? "Ativo" : "Pendente"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
