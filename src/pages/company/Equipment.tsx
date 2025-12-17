import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dumbbell, Plus, Search, AlertTriangle, CheckCircle, Wrench, Tag, Pencil, Trash2, Eye, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { EquipmentDialog } from "@/components/company/equipment/EquipmentDialog";
import { CategoryDialog } from "@/components/company/equipment/CategoryDialog";
import { EquipmentDetailsDialog } from "@/components/company/equipment/EquipmentDetailsDialog";

interface EquipmentCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

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
  created_at: string;
  equipment_categories?: {
    name: string;
    color: string;
  } | null;
}

export default function Equipment() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Dialog states
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | null>(null);

  useEffect(() => {
    if (profile?.company_id) {
      fetchData();
    }
  }, [profile?.company_id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEquipment(), fetchCategories()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from("equipment")
      .select("*, equipment_categories(name, color)")
      .eq("company_id", profile?.company_id)
      .order("name");

    if (error) {
      console.error("Error fetching equipment:", error);
      return;
    }
    setEquipment(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("equipment_categories")
      .select("*")
      .eq("company_id", profile?.company_id)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }
    setCategories(data || []);
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
      toast.success("Equipamento eliminado com sucesso");
      fetchEquipment();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast.error("Erro ao eliminar equipamento");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("equipment_categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Categoria eliminada com sucesso");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Erro ao eliminar categoria");
    }
  };

  // Filter equipment
  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Stats
  const totalEquipment = equipment.length;
  const operationalCount = equipment.filter((e) => e.status === "operational").length;
  const maintenanceCount = equipment.filter((e) => e.status === "maintenance").length;
  const brokenCount = equipment.filter((e) => e.status === "broken").length;
  const totalValue = equipment.reduce((sum, e) => sum + (e.current_value || 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5" />;
      case "maintenance":
        return <Wrench className="h-5 w-5" />;
      case "broken":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-success/10 text-success";
      case "maintenance":
        return "bg-warning/10 text-warning";
      case "broken":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "operational":
        return "Operacional";
      case "maintenance":
        return "Manutenção";
      case "broken":
        return "Avariado";
      case "retired":
        return "Aposentado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total de Equipamentos" value={totalEquipment} icon={Dumbbell} />
        <StatCard title="Operacionais" value={operationalCount} icon={CheckCircle} className="border-l-4 border-l-success" />
        <StatCard title="Em Manutenção" value={maintenanceCount} icon={Wrench} className="border-l-4 border-l-warning" />
        <StatCard title="Avariados" value={brokenCount} icon={AlertTriangle} className="border-l-4 border-l-destructive" />
        <StatCard title="Valor Total" value={`${totalValue.toFixed(0)}€`} icon={Package} />
      </div>

      {/* Categories Section */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categorias
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setCategoryDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma categoria criada</p>
            ) : (
              categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className="py-1.5 px-3 cursor-pointer hover:bg-accent group"
                  style={{ borderColor: cat.color, color: cat.color }}
                >
                  {cat.name}
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(cat);
                        setCategoryDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar categoria?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser revertida. Equipamentos desta categoria ficarão sem categoria.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </span>
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar equipamento..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="operational">Operacional</SelectItem>
              <SelectItem value="maintenance">Em Manutenção</SelectItem>
              <SelectItem value="broken">Avariado</SelectItem>
              <SelectItem value="retired">Aposentado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setSelectedEquipment(null);
            setEquipmentDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Adicionar Equipamento
        </Button>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-40" />
            </Card>
          ))}
        </div>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum equipamento encontrado</p>
            <p className="text-sm">Comece por adicionar equipamentos ao seu ginásio</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      {item.equipment_categories && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs"
                          style={{ borderColor: item.equipment_categories.color, color: item.equipment_categories.color }}
                        >
                          {item.equipment_categories.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedEquipment(item);
                              setEquipmentDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar equipamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser revertida. Todos os registos de manutenção também serão eliminados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEquipment(item.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {(item.brand || item.model) && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {[item.brand, item.model].filter(Boolean).join(" - ")}
                  </p>
                )}

                {item.location && (
                  <p className="text-xs text-muted-foreground mb-2">📍 {item.location}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor atual</p>
                    <p className="text-sm font-medium text-foreground">{item.current_value?.toFixed(2)}€</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.status === "operational"
                        ? "border-success text-success"
                        : item.status === "maintenance"
                        ? "border-warning text-warning"
                        : item.status === "broken"
                        ? "border-destructive text-destructive"
                        : ""
                    }
                  >
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EquipmentDialog
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
        equipment={selectedEquipment}
        categories={categories}
        onSuccess={fetchEquipment}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      <EquipmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        equipment={selectedEquipment}
        onEdit={() => {
          setDetailsDialogOpen(false);
          setEquipmentDialogOpen(true);
        }}
        onRefresh={fetchEquipment}
      />
    </div>
  );
}
