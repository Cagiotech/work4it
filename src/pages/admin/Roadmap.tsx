import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThumbsUp, ThumbsDown, MessageCircle, MoreVertical, CheckCircle, Clock, Circle, ArrowUp } from "lucide-react";
import { useFeatureSuggestions, useManageSuggestions } from "@/hooks/useAdminData";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

const statusColors: Record<string, string> = {
  "pending": "bg-yellow-500/10 text-yellow-600",
  "approved": "bg-blue-500/10 text-blue-600",
  "in_progress": "bg-purple-500/10 text-purple-600",
  "completed": "bg-green-500/10 text-green-600",
  "rejected": "bg-red-500/10 text-red-600",
};

const statusLabels: Record<string, string> = {
  "pending": "Pendente",
  "approved": "Aprovado",
  "in_progress": "Em Desenvolvimento",
  "completed": "Concluído",
  "rejected": "Rejeitado",
};

const categoryColors: Record<string, string> = {
  "feature": "bg-blue-500/10 text-blue-600",
  "bug": "bg-red-500/10 text-red-600",
  "improvement": "bg-green-500/10 text-green-600",
  "integration": "bg-purple-500/10 text-purple-600",
};

const categoryLabels: Record<string, string> = {
  "feature": "Funcionalidade",
  "bug": "Bug",
  "improvement": "Melhoria",
  "integration": "Integração",
};

export default function AdminRoadmap() {
  const { data: suggestions, isLoading } = useFeatureSuggestions();
  const { updateSuggestion } = useManageSuggestions();
  const [filter, setFilter] = useState("all");

  const filteredSuggestions = suggestions?.filter(
    (s) => filter === "all" || s.status === filter
  ) || [];

  const handleStatusChange = async (id: string, status: string) => {
    await updateSuggestion.mutateAsync({ id, status });
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    await updateSuggestion.mutateAsync({ id, is_public: !isPublic });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Roadmap</h1>
          <p className="text-muted-foreground text-sm md:text-base">Sugestões dos utilizadores e plano de desenvolvimento</p>
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Roadmap</h1>
          <p className="text-muted-foreground text-sm md:text-base">Sugestões dos utilizadores e plano de desenvolvimento</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sugestões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suggestions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {suggestions?.filter(s => s.status === "pending").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {suggestions?.filter(s => s.status === "in_progress").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {suggestions?.filter(s => s.status === "completed").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="in_progress">Em Desenvolvimento</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suggestions List */}
      {filteredSuggestions.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filter === "all" ? "Nenhuma sugestão recebida" : "Nenhuma sugestão encontrada"}
          </h3>
          <p className="text-muted-foreground">
            {filter === "all" 
              ? "As sugestões das empresas aparecerão aqui" 
              : "Tente ajustar os filtros"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Votes */}
                  <div className="flex md:flex-col items-center gap-2 md:gap-1 md:min-w-[60px]">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="font-bold">{(suggestion as any).upVotes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span className="font-bold">{(suggestion as any).downVotes || 0}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      Net: {(suggestion as any).netVotes || 0}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                        <p className="text-muted-foreground mt-1">{suggestion.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={statusColors[suggestion.status] || statusColors.pending}>
                          {statusLabels[suggestion.status] || suggestion.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(suggestion.id, "approved")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                              Aprovar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(suggestion.id, "in_progress")}>
                              <Clock className="h-4 w-4 mr-2 text-purple-600" />
                              Em Desenvolvimento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(suggestion.id, "completed")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Concluído
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(suggestion.id, "rejected")}>
                              <Circle className="h-4 w-4 mr-2 text-red-600" />
                              Rejeitar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublic(suggestion.id, suggestion.is_public || false)}>
                              {suggestion.is_public ? "Tornar Privado" : "Tornar Público"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {((suggestion as any).companies?.name || "?").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{(suggestion as any).companies?.name || "Empresa"}</span>
                      </div>
                      {suggestion.category && (
                        <Badge variant="outline" className={categoryColors[suggestion.category] || "bg-gray-500/10 text-gray-600"}>
                          {categoryLabels[suggestion.category] || suggestion.category}
                        </Badge>
                      )}
                      {suggestion.is_public && (
                        <Badge variant="secondary" className="text-xs">Público</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true, locale: pt })}
                      </span>
                    </div>

                    {suggestion.admin_notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Notas Admin:</span> {suggestion.admin_notes}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
