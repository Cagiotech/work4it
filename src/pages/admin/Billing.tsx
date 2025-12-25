import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Receipt,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Percent,
  Tag,
  Calendar,
  Building2,
  Download,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

export default function AdminBilling() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 0,
    max_uses: null as number | null,
    valid_until: "",
  });

  // Fetch invoices
  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invoices")
        .select(`
          *,
          companies:company_id (name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch coupons
  const { data: coupons, isLoading: loadingCoupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscriptions for stats
  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions-billing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_subscriptions")
        .select(`
          *,
          admin_plans:plan_id (name, price)
        `)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Create/Update coupon mutation
  const saveCouponMutation = useMutation({
    mutationFn: async (data: typeof couponForm & { id?: string }) => {
      const couponData = {
        code: data.code.toUpperCase(),
        description: data.description,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_uses: data.max_uses,
        valid_until: data.valid_until || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("admin_coupons")
          .update(couponData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_coupons").insert(couponData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingCoupon ? "Cupão atualizado" : "Cupão criado");
      setShowCouponDialog(false);
      resetCouponForm();
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cupão eliminado");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Mark invoice as paid
  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("admin_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fatura marcada como paga");
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const resetCouponForm = () => {
    setCouponForm({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      max_uses: null,
      valid_until: "",
    });
    setEditingCoupon(null);
  };

  const openEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      valid_until: coupon.valid_until ? coupon.valid_until.split("T")[0] : "",
    });
    setShowCouponDialog(true);
  };

  // Stats
  const totalMRR = subscriptions?.reduce((sum, s) => sum + Number((s.admin_plans as any)?.price || 0), 0) || 0;
  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter((i) => i.status === "paid").length || 0;
  const pendingInvoices = invoices?.filter((i) => i.status === "pending").length || 0;
  const overdueInvoices = invoices?.filter((i) => i.status === "overdue").length || 0;
  const activeCoupons = coupons?.filter((c) => c.is_active).length || 0;

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = (invoice.companies as any)?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredCoupons = coupons?.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coupon.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const isLoading = loadingInvoices || loadingCoupons;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Faturação</h1>
          <p className="text-muted-foreground">Gestão de faturas e cupões</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Faturação</h1>
        <p className="text-muted-foreground">Gestão de faturas, pagamentos e cupões de desconto</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMRR)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingInvoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-600" />
              Cupões Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{activeCoupons}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2">
            <Tag className="h-4 w-4" />
            Cupões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por empresa..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="paid">Pagas</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Fatura</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma fatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>{(invoice.companies as any)?.name}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell>
                            {invoice.due_date
                              ? new Date(invoice.due_date).toLocaleDateString("pt-PT")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "default"
                                  : invoice.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {invoice.status === "paid"
                                ? "Paga"
                                : invoice.status === "overdue"
                                ? "Em Atraso"
                                : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {invoice.status !== "paid" && (
                                  <DropdownMenuItem
                                    onClick={() => markPaidMutation.mutate(invoice.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descarregar PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          {/* Coupon Actions */}
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cupões..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowCouponDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cupão
            </Button>
          </div>

          {/* Coupons Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCoupons.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cupão</h3>
                <p className="text-muted-foreground">Crie o primeiro cupão de desconto</p>
              </Card>
            ) : (
              filteredCoupons.map((coupon) => (
                <Card key={coupon.id} className={!coupon.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                        <CardDescription>{coupon.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditCoupon(coupon)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteCouponMutation.mutate(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {coupon.discount_type === "percentage" ? (
                          <>
                            <Percent className="h-3 w-3 mr-1" />
                            {coupon.discount_value}%
                          </>
                        ) : (
                          formatCurrency(coupon.discount_value)
                        )}
                      </Badge>
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Usos: {coupon.current_uses}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : " (ilimitado)"}
                      </p>
                      {coupon.valid_until && (
                        <p>
                          Válido até: {new Date(coupon.valid_until).toLocaleDateString("pt-PT")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Coupon Dialog */}
      <Dialog open={showCouponDialog} onOpenChange={(open) => {
        setShowCouponDialog(open);
        if (!open) resetCouponForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Editar Cupão" : "Novo Cupão de Desconto"}
            </DialogTitle>
            <DialogDescription>
              Crie um cupão de desconto para as empresas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                placeholder="Ex: DESCONTO20"
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Ex: 20% de desconto no primeiro mês"
                value={couponForm.description}
                onChange={(e) =>
                  setCouponForm({ ...couponForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select
                  value={couponForm.discount_type}
                  onValueChange={(v) =>
                    setCouponForm({ ...couponForm, discount_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentagem</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  placeholder={couponForm.discount_type === "percentage" ? "20" : "10.00"}
                  value={couponForm.discount_value || ""}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      discount_value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máximo de Usos</Label>
                <Input
                  type="number"
                  placeholder="Ilimitado"
                  value={couponForm.max_uses || ""}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      max_uses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Válido Até</Label>
                <Input
                  type="date"
                  value={couponForm.valid_until}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, valid_until: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouponDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                saveCouponMutation.mutate({
                  ...couponForm,
                  id: editingCoupon?.id,
                })
              }
              disabled={saveCouponMutation.isPending}
            >
              {saveCouponMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
