import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Megaphone, Plus, Edit, Trash, Target } from "lucide-react";
import { useAdminBanners, useManageBanners } from "@/hooks/useAdminData";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const targetColors: Record<string, string> = {
  "all": "bg-purple-500/10 text-purple-600",
  "companies": "bg-blue-500/10 text-blue-600",
  "students": "bg-green-500/10 text-green-600",
  "staff": "bg-orange-500/10 text-orange-600",
};

const targetLabels: Record<string, string> = {
  "all": "Todos",
  "companies": "Empresas",
  "students": "Alunos",
  "staff": "Staff",
};

export default function AdminEvents() {
  const { data: banners, isLoading } = useAdminBanners();
  const { createBanner, updateBanner, deleteBanner } = useManageBanners();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    image_url: "",
    link_url: "",
    link_text: "",
    target_audience: "all",
    starts_at: "",
    ends_at: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      image_url: "",
      link_url: "",
      link_text: "",
      target_audience: "all",
      starts_at: "",
      ends_at: "",
      is_active: true,
    });
  };

  const handleCreate = async () => {
    await createBanner.mutateAsync({
      ...formData,
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
    } as any);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingBanner) return;
    await updateBanner.mutateAsync({
      id: editingBanner.id,
      ...formData,
      starts_at: formData.starts_at || null,
      ends_at: formData.ends_at || null,
    });
    setEditingBanner(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteBanner.mutateAsync(id);
  };

  const openEditDialog = (banner: any) => {
    setFormData({
      title: banner.title,
      message: banner.message,
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      link_text: banner.link_text || "",
      target_audience: banner.target_audience,
      starts_at: banner.starts_at ? banner.starts_at.split("T")[0] : "",
      ends_at: banner.ends_at ? banner.ends_at.split("T")[0] : "",
      is_active: banner.is_active ?? true,
    });
    setEditingBanner(banner);
  };

  const getBannerStatus = (banner: any) => {
    if (!banner.is_active) return { label: "Inativo", color: "bg-gray-600" };
    const now = new Date();
    const starts = banner.starts_at ? new Date(banner.starts_at) : null;
    const ends = banner.ends_at ? new Date(banner.ends_at) : null;
    
    if (starts && starts > now) return { label: "Agendado", color: "bg-blue-600" };
    if (ends && ends < now) return { label: "Expirado", color: "bg-gray-600" };
    return { label: "Ativo", color: "bg-green-600" };
  };

  // Stats
  const activeBanners = banners?.filter(b => {
    const status = getBannerStatus(b);
    return status.label === "Ativo";
  }).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Banners e Anúncios</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir banners e anúncios do sistema</p>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Banners e Anúncios</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerir banners e anúncios do sistema</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Novo Banner</DialogTitle>
              <DialogDescription>Configure o banner para exibir aos utilizadores</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="bannerTitle">Título</Label>
                <Input
                  id="bannerTitle"
                  placeholder="Título do banner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bannerMessage">Mensagem</Label>
                <Textarea
                  id="bannerMessage"
                  placeholder="Mensagem do banner"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Público Alvo</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="companies">Empresas</SelectItem>
                      <SelectItem value="students">Alunos</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link (opcional)</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  />
                </div>
              </div>
              {formData.link_url && (
                <div className="space-y-2">
                  <Label>Texto do Link</Label>
                  <Input
                    placeholder="Saiba mais"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createBanner.isPending || !formData.title || !formData.message}>
                {createBanner.isPending ? "A criar..." : "Criar Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Banner</DialogTitle>
            <DialogDescription>Atualize as informações do banner</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Público Alvo</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="companies">Empresas</SelectItem>
                    <SelectItem value="students">Alunos</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updateBanner.isPending}>
              {updateBanner.isPending ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Banners Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBanners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banners?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {banners?.filter(b => getBannerStatus(b).label === "Agendado").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expirados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {banners?.filter(b => getBannerStatus(b).label === "Expirado").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banners Grid */}
      {banners?.length === 0 ? (
        <Card className="p-8 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum banner criado</h3>
          <p className="text-muted-foreground mb-4">Crie o primeiro banner para exibir aos utilizadores</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Banner
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners?.map((banner) => {
            const status = getBannerStatus(banner);
            return (
              <Card key={banner.id} className="overflow-hidden">
                {banner.image_url && (
                  <div className="aspect-[3/1] bg-muted relative">
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    <Badge className={`absolute top-2 right-2 ${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{banner.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{banner.message}</CardDescription>
                    </div>
                    {!banner.image_url && (
                      <Badge className={status.color}>{status.label}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={targetColors[banner.target_audience] || targetColors.all}>
                      <Target className="h-3 w-3 mr-1" />
                      {targetLabels[banner.target_audience] || "Todos"}
                    </Badge>
                    {banner.starts_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(banner.starts_at), "dd MMM", { locale: pt })}
                        {banner.ends_at && ` - ${format(new Date(banner.ends_at), "dd MMM yyyy", { locale: pt })}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(banner)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar banner?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O banner será permanentemente eliminado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(banner.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
