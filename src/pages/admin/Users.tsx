import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "@/components/ui/alert-dialog";
import {
  Search,
  Users,
  Building2,
  GraduationCap,
  UserCog,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  Key,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  type: 'owner' | 'staff' | 'student';
  company_name: string | null;
  company_id: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const allUsers: UserData[] = [];

      // Get company owners (profiles with company_id)
      const { data: profiles } = await supabase
        .from("profiles")
        .select(`
          id,
          user_id,
          full_name,
          company_id,
          created_at,
          companies:company_id (name)
        `)
        .not("company_id", "is", null);

      if (profiles) {
        for (const profile of profiles) {
          // Check if this user is the company owner
          const { data: company } = await supabase
            .from("companies")
            .select("created_by")
            .eq("id", profile.company_id!)
            .single();

          if (company?.created_by === profile.user_id) {
            allUsers.push({
              id: profile.id,
              email: "", // Will be fetched separately if needed
              full_name: profile.full_name || "Sem nome",
              type: "owner",
              company_name: (profile.companies as any)?.name || null,
              company_id: profile.company_id,
              is_active: true,
              created_at: profile.created_at,
              user_id: profile.user_id,
            });
          }
        }
      }

      // Get all staff
      const { data: staff } = await supabase
        .from("staff")
        .select(`
          id,
          user_id,
          full_name,
          email,
          company_id,
          is_active,
          created_at,
          companies:company_id (name)
        `);

      if (staff) {
        staff.forEach((s) => {
          allUsers.push({
            id: s.id,
            email: s.email,
            full_name: s.full_name,
            type: "staff",
            company_name: (s.companies as any)?.name || null,
            company_id: s.company_id,
            is_active: s.is_active ?? true,
            created_at: s.created_at,
            user_id: s.user_id,
          });
        });
      }

      // Get all students
      const { data: students } = await supabase
        .from("students")
        .select(`
          id,
          user_id,
          full_name,
          email,
          company_id,
          status,
          created_at,
          companies:company_id (name)
        `);

      if (students) {
        students.forEach((s) => {
          allUsers.push({
            id: s.id,
            email: s.email || "",
            full_name: s.full_name,
            type: "student",
            company_name: (s.companies as any)?.name || null,
            company_id: s.company_id,
            is_active: s.status === "active",
            created_at: s.created_at,
            user_id: s.user_id,
          });
        });
      }

      return allUsers.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || user.type === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && user.is_active) ||
      (filterStatus === "inactive" && !user.is_active);
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  // Stats
  const totalUsers = users?.length || 0;
  const totalOwners = users?.filter((u) => u.type === "owner").length || 0;
  const totalStaff = users?.filter((u) => u.type === "staff").length || 0;
  const totalStudents = users?.filter((u) => u.type === "student").length || 0;
  const activeUsers = users?.filter((u) => u.is_active).length || 0;

  const handleResetPassword = async () => {
    if (!selectedUser?.user_id || !newPassword || newPassword.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("admin-reset-password", {
        body: { userId: selectedUser.user_id, newPassword },
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso");
      setShowResetPasswordDialog(false);
      setNewPassword("");
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      if (selectedUser.type === "staff") {
        await supabase
          .from("staff")
          .update({ is_active: !selectedUser.is_active })
          .eq("id", selectedUser.id);
      } else if (selectedUser.type === "student") {
        await supabase
          .from("students")
          .update({ status: selectedUser.is_active ? "inactive" : "active" })
          .eq("id", selectedUser.id);
      }

      toast.success(
        selectedUser.is_active ? "Utilizador suspenso" : "Utilizador reativado"
      );
      setShowSuspendDialog(false);
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "owner":
        return <Building2 className="h-4 w-4" />;
      case "staff":
        return <UserCog className="h-4 w-4" />;
      case "student":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "owner":
        return "Proprietário";
      case "staff":
        return "Staff";
      case "student":
        return "Aluno";
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "owner":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "staff":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "student":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Utilizadores</h1>
          <p className="text-muted-foreground">Gestão global de utilizadores</p>
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Utilizadores</h1>
        <p className="text-muted-foreground">Gestão global de todos os utilizadores do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Proprietários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalOwners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStaff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, email ou empresa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="owner">Proprietários</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="student">Alunos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum utilizador encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={`${user.type}-${user.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeBadgeColor(user.type)}>
                          {getTypeIcon(user.type)}
                          <span className="ml-1">{getTypeLabel(user.type)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.company_name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.user_id && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowResetPasswordDialog(true);
                                }}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Alterar Senha
                              </DropdownMenuItem>
                            )}
                            {user.type !== "owner" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowSuspendDialog(true);
                                }}
                              >
                                {user.is_active ? (
                                  <>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Suspender
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Reativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
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

      {/* Reset Password Dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </AlertDialogTitle>
            <AlertDialogDescription>
              Alterar a senha de {selectedUser?.full_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleResetPassword} disabled={isProcessing}>
              {isProcessing ? "A processar..." : "Alterar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedUser?.is_active ? (
                <>
                  <Lock className="h-5 w-5 text-red-500" />
                  Suspender Utilizador
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5 text-green-500" />
                  Reativar Utilizador
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.is_active
                ? `Tem a certeza que deseja suspender ${selectedUser?.full_name}? O utilizador não poderá aceder ao sistema.`
                : `Tem a certeza que deseja reativar ${selectedUser?.full_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant={selectedUser?.is_active ? "destructive" : "default"}
              onClick={handleToggleSuspend}
              disabled={isProcessing}
            >
              {isProcessing
                ? "A processar..."
                : selectedUser?.is_active
                ? "Suspender"
                : "Reativar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
