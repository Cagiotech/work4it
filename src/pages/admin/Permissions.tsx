import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Building2, Dumbbell, Eye, Edit, Trash, Plus, Settings, Save } from "lucide-react";

const roles = [
  {
    id: 1,
    name: "Super Admin",
    description: "Acesso total ao sistema",
    users: 2,
    color: "bg-red-500/10 text-red-600",
    permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      companies: { view: true, create: true, edit: true, delete: true },
      plans: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: 2,
    name: "Admin Empresa",
    description: "Gestão completa da empresa",
    users: 48,
    color: "bg-purple-500/10 text-purple-600",
    permissions: {
      users: { view: true, create: true, edit: true, delete: false },
      companies: { view: true, create: false, edit: true, delete: false },
      plans: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
      settings: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    id: 3,
    name: "Personal Trainer",
    description: "Gestão de alunos e treinos",
    users: 156,
    color: "bg-green-500/10 text-green-600",
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      companies: { view: false, create: false, edit: false, delete: false },
      plans: { view: false, create: false, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: true, create: false, edit: true, delete: false },
    },
  },
  {
    id: 4,
    name: "Aluno",
    description: "Acesso básico ao sistema",
    users: 1041,
    color: "bg-blue-500/10 text-blue-600",
    permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      companies: { view: false, create: false, edit: false, delete: false },
      plans: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
      settings: { view: true, create: false, edit: true, delete: false },
    },
  },
];

const modules = [
  { key: "users", name: "Utilizadores", icon: Users },
  { key: "companies", name: "Empresas", icon: Building2 },
  { key: "plans", name: "Planos", icon: Shield },
  { key: "reports", name: "Relatórios", icon: Eye },
  { key: "settings", name: "Definições", icon: Settings },
];

export default function AdminPermissions() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de Permissões</h1>
          <p className="text-muted-foreground text-sm md:text-base">Configurar funções e permissões do sistema</p>
        </div>
        <Button className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Funções</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${role.color}`}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{role.users} utilizadores</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {modules.map((module) => {
                      const perms = role.permissions[module.key as keyof typeof role.permissions];
                      const activePerms = Object.entries(perms).filter(([_, v]) => v).length;
                      
                      return (
                        <div key={module.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <module.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{module.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {perms.view && <Badge variant="outline" className="text-xs px-1.5">Ver</Badge>}
                            {perms.create && <Badge variant="outline" className="text-xs px-1.5">Criar</Badge>}
                            {perms.edit && <Badge variant="outline" className="text-xs px-1.5">Editar</Badge>}
                            {perms.delete && <Badge variant="outline" className="text-xs px-1.5">Eliminar</Badge>}
                            {activePerms === 0 && <span className="text-xs text-muted-foreground">Sem acesso</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Permissões
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>Visão geral de todas as permissões por função</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Módulo</th>
                      <th className="text-left p-3 font-medium">Ação</th>
                      {roles.map((role) => (
                        <th key={role.id} className="text-center p-3 font-medium">{role.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => (
                      <>
                        {["view", "create", "edit", "delete"].map((action, actionIndex) => (
                          <tr key={`${module.key}-${action}`} className={actionIndex === 0 ? "border-t" : ""}>
                            {actionIndex === 0 && (
                              <td rowSpan={4} className="p-3 font-medium border-r bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <module.icon className="h-4 w-4" />
                                  {module.name}
                                </div>
                              </td>
                            )}
                            <td className="p-3 text-muted-foreground capitalize">{
                              action === "view" ? "Ver" :
                              action === "create" ? "Criar" :
                              action === "edit" ? "Editar" : "Eliminar"
                            }</td>
                            {roles.map((role) => (
                              <td key={role.id} className="text-center p-3">
                                <Switch
                                  checked={role.permissions[module.key as keyof typeof role.permissions][action as keyof typeof role.permissions.users]}
                                  className="scale-75"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-6">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
