import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Activity,
  Lock,
  Unlock,
  Key,
  Building2,
  User,
  FileText,
  Download,
  RefreshCw,
  XCircle,
  Info,
  AlertCircle,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSecurity() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("alerts");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterActionType, setFilterActionType] = useState("all");

  // Fetch system alerts
  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["system-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Fetch company logs for additional context
  const { data: companyLogs } = useQuery({
    queryKey: ["admin-company-logs-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_company_logs")
        .select(`
          *,
          companies:company_id (name)
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("system_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta resolvido");
      queryClient.invalidateQueries({ queryKey: ["system-alerts"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Stats
  const totalAlerts = alerts?.length || 0;
  const unresolvedAlerts = alerts?.filter((a) => !a.is_resolved).length || 0;
  const criticalAlerts = alerts?.filter((a) => a.severity === "critical" && !a.is_resolved).length || 0;
  const totalLogs = (auditLogs?.length || 0) + (companyLogs?.length || 0);

  // Filter alerts
  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  }) || [];

  // Combine and filter logs
  const allLogs = [
    ...(auditLogs || []).map((log) => ({
      ...log,
      source: "admin",
      company_name: null,
    })),
    ...(companyLogs || []).map((log) => ({
      ...log,
      admin_id: log.performed_by,
      source: "company",
      company_name: (log.companies as any)?.name,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.company_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterActionType === "all" || log.action_type === filterActionType;
    return matchesSearch && matchesType;
  });

  // Get unique action types
  const actionTypes = [...new Set(allLogs.map((log) => log.action_type))];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "warning":
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Aviso</Badge>;
      case "info":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Info</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case "block":
        return <Lock className="h-4 w-4 text-red-500" />;
      case "unblock":
        return <Unlock className="h-4 w-4 text-green-500" />;
      case "password_reset":
        return <Key className="h-4 w-4 text-blue-500" />;
      case "data_export":
        return <Download className="h-4 w-4 text-purple-500" />;
      case "login":
        return <User className="h-4 w-4 text-green-500" />;
      case "logout":
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      block: "Bloqueio",
      unblock: "Desbloqueio",
      password_reset: "Reset de Senha",
      data_export: "Exportação de Dados",
      login: "Login",
      logout: "Logout",
      subscription_change: "Alteração de Plano",
    };
    return labels[type] || type;
  };

  const isLoading = loadingAlerts || loadingLogs;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Segurança</h1>
          <p className="text-muted-foreground">Monitorização e auditoria do sistema</p>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Segurança e Auditoria</h1>
        <p className="text-muted-foreground">
          Monitorize alertas do sistema e histórico de ações administrativas
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className={criticalAlerts > 0 ? "border-red-500/50 bg-red-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${criticalAlerts > 0 ? "text-red-500" : ""}`} />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalAlerts > 0 ? "text-red-500" : ""}`}>
              {criticalAlerts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Por Resolver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{unresolvedAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas
            {unresolvedAlerts > 0 && (
              <Badge variant="destructive" className="ml-1">{unresolvedAlerts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Activity className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar alertas..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tudo em ordem!</h3>
              <p className="text-muted-foreground">Nenhum alerta ativo no momento</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`${
                    !alert.is_resolved
                      ? alert.severity === "critical"
                        ? "border-red-500/50 bg-red-500/5"
                        : alert.severity === "warning"
                        ? "border-orange-500/50 bg-orange-500/5"
                        : ""
                      : "opacity-60"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{alert.title}</h4>
                            {getSeverityBadge(alert.severity)}
                            {alert.is_resolved && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.created_at).toLocaleString("pt-PT")}
                          </p>
                        </div>
                      </div>
                      {!alert.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          disabled={resolveAlertMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar logs..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterActionType} onValueChange={setFilterActionType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Tipo de Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Ações</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getActionTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={`${log.source}-${log.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionTypeIcon(log.action_type)}
                              <span className="font-medium">
                                {getActionTypeLabel(log.action_type)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.company_name || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {(log as any).action_details?.reason ||
                                (log as any).details?.description ||
                                "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString("pt-PT")}
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
      </Tabs>
    </div>
  );
}
