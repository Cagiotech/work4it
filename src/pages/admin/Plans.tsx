import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Plus, Edit, Trash2, Users, Building2, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAdminPlans, useManagePlans } from "@/hooks/useAdminData";
import { formatCurrency } from "@/lib/formatters";

export default function AdminPlans() {
  const { data: plans, isLoading } = useAdminPlans();
  const { createPlan, updatePlan, deletePlan } = useManagePlans();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    billing_cycle: "monthly",
    description: "",
    max_students: null as number | null,
    max_staff: null as number | null,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      billing_cycle: "monthly",
      description: "",
      max_students: null,
      max_staff: null,
    });
  };

  const handleCreate = async () => {
    await createPlan.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;
    await updatePlan.mutateAsync({ id: editingPlan.id, ...formData });
    setEditingPlan(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deletePlan.mutateAsync(id);
  };

  const openEditDialog = (plan: any) => {
    setFormData({
      name: plan.name,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      description: plan.description || "",
      max_students: plan.max_students,
      max_staff: plan.max_staff,
    });
    setEditingPlan(plan);
  };

  // Calculate stats
  const totalRevenue = plans?.reduce((sum, plan) => sum + (plan.price * (plan.companyCount || 0)), 0) || 0;
  const mostPopularPlan = plans?.reduce((prev, curr) => 
    (curr.companyCount || 0) > (prev?.companyCount || 0) ? curr : prev
  , plans[0]);
  const totalSubscribers = plans?.reduce((sum, plan) => sum + (plan.companyCount || 0), 0) || 0;
  const averageTicket = totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planos de Assinatura</h1>
            <p className="text-muted-foreground text-sm md:text-base">Gerir os planos e permissões do sistema</p>
          </div>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-32 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Planos de Assinatura</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir os planos e permissões do sistema</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
              <DialogDescription>Configure os detalhes do novo plano de assinatura</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Nome do Plano</Label>
                  <Input
                    id="planName"
                    placeholder="Ex: Premium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planPrice">Preço (€/mês)</Label>
                  <Input
                    id="planPrice"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição do plano"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Máx. Alunos</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    placeholder="Ilimitado"
                    value={formData.max_students || ""}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStaff">Máx. Staff</Label>
                  <Input
                    id="maxStaff"
                    type="number"
                    placeholder="Ilimitado"
                    value={formData.max_staff || ""}
                    onChange={(e) => setFormData({ ...formData, max_staff: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createPlan.isPending || !formData.name}>
                {createPlan.isPending ? "A criar..." : "Criar Plano"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>Atualize os detalhes do plano</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nome do Plano</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice">Preço (€/mês)</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Descrição</Label>
              <Input
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMaxStudents">Máx. Alunos</Label>
                <Input
                  id="editMaxStudents"
                  type="number"
                  placeholder="Ilimitado"
                  value={formData.max_students || ""}
                  onChange={(e) => setFormData({ ...formData, max_students: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaxStaff">Máx. Staff</Label>
                <Input
                  id="editMaxStaff"
                  type="number"
                  placeholder="Ilimitado"
                  value={formData.max_staff || ""}
                  onChange={(e) => setFormData({ ...formData, max_staff: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updatePlan.isPending}>
              {updatePlan.isPending ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{totalSubscribers} subscrições</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plano Mais Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mostPopularPlan?.name || "-"}</div>
            <p className="text-xs text-muted-foreground">{mostPopularPlan?.companyCount || 0} empresas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
            <p className="text-xs text-muted-foreground">por empresa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">ativos no sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      {plans?.length === 0 ? (
        <Card className="p-8 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum plano cadastrado</h3>
          <p className="text-muted-foreground mb-4">Crie o primeiro plano de assinatura</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Plano
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan.id} className={`relative overflow-hidden ${plan.companyCount > 0 ? 'ring-1 ring-primary/20' : ''}`}>
              {plan.companyCount > 0 && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                  {plan.companyCount} {plan.companyCount === 1 ? 'empresa' : 'empresas'}
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description || "Sem descrição"}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar plano?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O plano será permanentemente eliminado.
                            {plan.companyCount > 0 && (
                              <span className="block mt-2 text-destructive font-medium">
                                Atenção: Este plano tem {plan.companyCount} empresa(s) associada(s).
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-muted-foreground">/{plan.billing_cycle === "monthly" ? "mês" : plan.billing_cycle}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                
                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Alunos</span>
                    </div>
                    <span className="font-medium">{plan.max_students || "Ilimitado"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Staff</span>
                    </div>
                    <span className="font-medium">{plan.max_staff || "Ilimitado"}</span>
                  </div>
                </div>

                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recursos:</p>
                      {(plan.features as any[]).map((feature: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {feature.enabled !== false ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={feature.enabled !== false ? "" : "text-muted-foreground"}>
                            {typeof feature === "string" ? feature : feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Badge variant={plan.is_active ? "default" : "secondary"} className="mt-2">
                  {plan.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
