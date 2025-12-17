import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Pencil, Trash2, Plus, Wrench, Calendar, Euro, MapPin, Tag, Info } from "lucide-react";
import { MaintenanceDialog } from "./MaintenanceDialog";

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  status: string;
  purchase_date: string | null;
  purchase_value: number;
  current_value: number;
  warranty_expiry: string | null;
  location: string | null;
  notes: string | null;
  category_id: string | null;
  equipment_categories?: {
    name: string;
    color: string;
  } | null;
}

interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  maintenance_type: string;
  description: string | null;
  performed_by: string | null;
  performed_at: string;
  next_maintenance_date: string | null;
  cost: number;
  notes: string | null;
  status: string;
}

interface EquipmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onEdit: () => void;
  onRefresh: () => void;
}

export function EquipmentDetailsDialog({ 
  open, 
  onOpenChange, 
  equipment, 
  onEdit,
  onRefresh 
}: EquipmentDetailsDialogProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    if (open && equipment) {
      fetchMaintenanceRecords();
    }
  }, [open, equipment]);

  const fetchMaintenanceRecords = async () => {
    if (!equipment) return;
    setLoadingMaintenance(true);
    try {
      const { data, error } = await supabase
        .from("equipment_maintenance")
        .select("*")
        .eq("equipment_id", equipment.id)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      setMaintenanceRecords(data || []);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    try {
      const { error } = await supabase.from("equipment_maintenance").delete().eq("id", id);
      if (error) throw error;
      toast.success("Registo de manutenção eliminado");
      fetchMaintenanceRecords();
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      toast.error("Erro ao eliminar registo");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      operational: { label: "Operacional", variant: "default" },
      maintenance: { label: "Em Manutenção", variant: "secondary" },
      broken: { label: "Avariado", variant: "destructive" },
      retired: { label: "Aposentado", variant: "outline" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMaintenanceTypeBadge = (type: string) => {
    const typeConfig: Record<string, string> = {
      preventive: "Preventiva",
      corrective: "Corretiva",
      inspection: "Inspeção",
      cleaning: "Limpeza",
      replacement: "Substituição",
    };
    return typeConfig[type] || type;
  };

  const getMaintenanceStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Agendada", variant: "outline" },
      in_progress: { label: "Em Progresso", variant: "secondary" },
      completed: { label: "Concluída", variant: "default" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalMaintenanceCost = maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0);

  if (!equipment) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl">{equipment.name}</DialogTitle>
                {getStatusBadge(equipment.status)}
              </div>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="maintenance">Manutenção ({maintenanceRecords.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Informações Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {equipment.equipment_categories && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Categoria:</span>
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: equipment.equipment_categories.color, color: equipment.equipment_categories.color }}
                        >
                          {equipment.equipment_categories.name}
                        </Badge>
                      </div>
                    )}
                    {equipment.brand && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Marca:</span>
                        <span>{equipment.brand}</span>
                      </div>
                    )}
                    {equipment.model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Modelo:</span>
                        <span>{equipment.model}</span>
                      </div>
                    )}
                    {equipment.serial_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nº Série:</span>
                        <span className="font-mono">{equipment.serial_number}</span>
                      </div>
                    )}
                    {equipment.location && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Localização:</span>
                        <span>{equipment.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Informações Financeiras
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {equipment.purchase_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data de Compra:</span>
                        <span>{format(new Date(equipment.purchase_date), "dd/MM/yyyy", { locale: pt })}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor de Compra:</span>
                      <span className="font-semibold">{equipment.purchase_value?.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Atual:</span>
                      <span className="font-semibold">{equipment.current_value?.toFixed(2)}€</span>
                    </div>
                    {equipment.warranty_expiry && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Garantia até:</span>
                        <span>{format(new Date(equipment.warranty_expiry), "dd/MM/yyyy", { locale: pt })}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Total em Manutenção:</span>
                      <span className="font-semibold text-destructive">{totalMaintenanceCost.toFixed(2)}€</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {equipment.description && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{equipment.description}</p>
                  </CardContent>
                </Card>
              )}

              {equipment.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{equipment.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Histórico de manutenções deste equipamento
                </p>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedMaintenance(null);
                    setMaintenanceDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registar Manutenção
                </Button>
              </div>

              {maintenanceRecords.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum registo de manutenção encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.performed_at), "dd/MM/yyyy", { locale: pt })}
                          </TableCell>
                          <TableCell>{getMaintenanceTypeBadge(record.maintenance_type)}</TableCell>
                          <TableCell>{getMaintenanceStatusBadge(record.status)}</TableCell>
                          <TableCell>{record.cost?.toFixed(2)}€</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedMaintenance(record);
                                  setMaintenanceDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar registo?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser revertida.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMaintenance(record.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <MaintenanceDialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
        maintenance={selectedMaintenance}
        equipmentId={equipment.id}
        equipmentName={equipment.name}
        onSuccess={() => {
          fetchMaintenanceRecords();
          onRefresh();
        }}
      />
    </>
  );
}
