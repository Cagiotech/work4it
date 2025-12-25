import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Mail,
  Send,
  Clock,
  CheckCircle,
  Plus,
  Megaphone,
  Bell,
  FileText,
  Building2,
  Users,
  GraduationCap,
  UserCog,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminCommunications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingComm, setEditingComm] = useState<any>(null);
  const [viewingComm, setViewingComm] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "announcement",
    target_audience: "all",
    scheduled_for: "",
  });

  // Fetch communications
  const { data: communications, isLoading } = useQuery({
    queryKey: ["admin-communications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_communications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create/Update communication
  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const commData = {
        title: data.title,
        content: data.content,
        type: data.type,
        target_audience: data.target_audience,
        scheduled_for: data.scheduled_for || null,
        status: data.scheduled_for ? "scheduled" : "draft",
      };

      if (data.id) {
        const { error } = await supabase
          .from("admin_communications")
          .update(commData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_communications").insert(commData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingComm ? "Comunicação atualizada" : "Comunicação criada");
      setShowDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-communications"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Send communication
  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      // Here you would integrate with an email service
      // For now, we just update the status
      const { error } = await supabase
        .from("admin_communications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comunicação enviada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-communications"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar: " + error.message);
    },
  });

  // Delete communication
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_communications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comunicação eliminada");
      queryClient.invalidateQueries({ queryKey: ["admin-communications"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      type: "announcement",
      target_audience: "all",
      scheduled_for: "",
    });
    setEditingComm(null);
  };

  const openEdit = (comm: any) => {
    setEditingComm(comm);
    setForm({
      title: comm.title,
      content: comm.content,
      type: comm.type,
      target_audience: comm.target_audience,
      scheduled_for: comm.scheduled_for ? comm.scheduled_for.split("T")[0] : "",
    });
    setShowDialog(true);
  };

  // Stats
  const totalComms = communications?.length || 0;
  const sentComms = communications?.filter((c) => c.status === "sent").length || 0;
  const scheduledComms = communications?.filter((c) => c.status === "scheduled").length || 0;
  const draftComms = communications?.filter((c) => c.status === "draft").length || 0;

  const filteredComms = communications?.filter((comm) => {
    if (activeTab === "all") return true;
    return comm.status === activeTab;
  }) || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="h-4 w-4" />;
      case "newsletter":
        return <Mail className="h-4 w-4" />;
      case "notification":
        return <Bell className="h-4 w-4" />;
      case "changelog":
        return <FileText className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      announcement: "Anúncio",
      newsletter: "Newsletter",
      notification: "Notificação",
      changelog: "Changelog",
    };
    return labels[type] || type;
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "all":
        return <Users className="h-4 w-4" />;
      case "companies":
        return <Building2 className="h-4 w-4" />;
      case "staff":
        return <UserCog className="h-4 w-4" />;
      case "students":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all: "Todos",
      companies: "Empresas",
      staff: "Staff",
      students: "Alunos",
    };
    return labels[audience] || audience;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Agendado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            Rascunho
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Comunicações</h1>
          <p className="text-muted-foreground">Gestão de comunicações em massa</p>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Comunicações</h1>
          <p className="text-muted-foreground">
            Envie anúncios, newsletters e notificações para as empresas
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Comunicação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sentComms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledComms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rascunhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftComms}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="draft">Rascunhos</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
          <TabsTrigger value="sent">Enviadas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredComms.length === 0 ? (
            <Card className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma comunicação</h3>
              <p className="text-muted-foreground">
                {activeTab === "all"
                  ? "Crie a primeira comunicação"
                  : `Nenhuma comunicação com estado "${activeTab}"`}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredComms.map((comm) => (
                <Card key={comm.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(comm.type)}
                          <Badge variant="outline">{getTypeLabel(comm.type)}</Badge>
                        </div>
                        <CardTitle className="text-lg">{comm.title}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingComm(comm)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                          {comm.status !== "sent" && (
                            <>
                              <DropdownMenuItem onClick={() => openEdit(comm)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendMutation.mutate(comm.id)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Agora
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(comm.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {comm.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getAudienceIcon(comm.target_audience)}
                        {getAudienceLabel(comm.target_audience)}
                      </div>
                      {getStatusBadge(comm.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {comm.sent_at
                        ? `Enviado em ${new Date(comm.sent_at).toLocaleString("pt-PT")}`
                        : comm.scheduled_for
                        ? `Agendado para ${new Date(comm.scheduled_for).toLocaleString("pt-PT")}`
                        : `Criado em ${new Date(comm.created_at).toLocaleString("pt-PT")}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingComm ? "Editar Comunicação" : "Nova Comunicação"}
            </DialogTitle>
            <DialogDescription>
              Crie uma comunicação para enviar às empresas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ex: Nova funcionalidade disponível"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Anúncio</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="notification">Notificação</SelectItem>
                    <SelectItem value="changelog">Changelog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audiência</Label>
                <Select
                  value={form.target_audience}
                  onValueChange={(v) => setForm({ ...form, target_audience: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="companies">Apenas Empresas</SelectItem>
                    <SelectItem value="staff">Apenas Staff</SelectItem>
                    <SelectItem value="students">Apenas Alunos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                placeholder="Escreva o conteúdo da comunicação..."
                className="min-h-32"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Agendar para (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_for}
                onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate({ ...form, id: editingComm?.id })}
              disabled={saveMutation.isPending}
            >
              Guardar Rascunho
            </Button>
            <Button
              onClick={() => {
                saveMutation.mutate({ ...form, id: editingComm?.id });
                // Would trigger send after save
              }}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "A guardar..." : "Enviar Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingComm} onOpenChange={() => setViewingComm(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {viewingComm && getTypeIcon(viewingComm.type)}
              <Badge variant="outline">
                {viewingComm && getTypeLabel(viewingComm.type)}
              </Badge>
              {viewingComm && getStatusBadge(viewingComm.status)}
            </div>
            <DialogTitle>{viewingComm?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {viewingComm && getAudienceIcon(viewingComm.target_audience)}
              Audiência: {viewingComm && getAudienceLabel(viewingComm.target_audience)}
            </div>
            <ScrollArea className="h-64">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{viewingComm?.content}</p>
              </div>
            </ScrollArea>
            {viewingComm?.sent_at && (
              <p className="text-sm text-muted-foreground">
                Enviado em: {new Date(viewingComm.sent_at).toLocaleString("pt-PT")}
                {viewingComm.sent_count > 0 && ` para ${viewingComm.sent_count} destinatários`}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
