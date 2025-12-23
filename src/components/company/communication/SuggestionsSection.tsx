import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Lightbulb, Plus, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  is_public: boolean;
  created_at: string;
  admin_notes: string | null;
}

interface SuggestionsSectionProps {
  companyId: string;
  userId: string;
}

export function SuggestionsSection({ companyId, userId }: SuggestionsSectionProps) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [publicSuggestions, setPublicSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: "feature",
  });

  useEffect(() => {
    loadSuggestions();
  }, [companyId]);

  const loadSuggestions = async () => {
    setLoading(true);

    // Load company suggestions
    const { data: companySuggestions } = await supabase
      .from("feature_suggestions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    // Load public suggestions from other companies
    const { data: publicData } = await supabase
      .from("feature_suggestions")
      .select("*")
      .eq("is_public", true)
      .neq("company_id", companyId)
      .order("created_at", { ascending: false });

    setSuggestions(companySuggestions || []);
    setPublicSuggestions(publicData || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newSuggestion.title.trim() || !newSuggestion.description.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("feature_suggestions").insert({
      company_id: companyId,
      submitted_by: userId,
      title: newSuggestion.title,
      description: newSuggestion.description,
      category: newSuggestion.category,
      status: "pending",
      is_public: false,
    });

    if (error) {
      toast.error("Erro ao enviar sugestão");
    } else {
      toast.success("Sugestão enviada com sucesso!");
      setNewSuggestion({ title: "", description: "", category: "feature" });
      setShowDialog(false);
      loadSuggestions();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeitado
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="gap-1 bg-blue-500/20 text-blue-600 border-blue-500/30">
            <Clock className="h-3 w-3" />
            Em Desenvolvimento
          </Badge>
        );
      case "completed":
        return (
          <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
            <CheckCircle className="h-3 w-3" />
            Implementado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "feature":
        return "Funcionalidade";
      case "improvement":
        return "Melhoria";
      case "bug":
        return "Bug";
      case "other":
        return "Outro";
      default:
        return category;
    }
  };

  const SuggestionCard = ({ suggestion }: { suggestion: Suggestion }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-foreground truncate">{suggestion.title}</h4>
              {getStatusBadge(suggestion.status)}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(suggestion.category)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(suggestion.created_at).toLocaleDateString("pt-PT")}
              </span>
            </div>
            {suggestion.admin_notes && (
              <div className="mt-3 p-2 bg-muted rounded text-sm">
                <span className="font-medium">Nota do Admin:</span> {suggestion.admin_notes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Sugestões & Roadmap</h3>
        </div>
        <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Sugestão
        </Button>
      </div>

      <Tabs defaultValue="mine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mine">Minhas Sugestões</TabsTrigger>
          <TabsTrigger value="public">Roadmap Público</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : suggestions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ainda não enviou nenhuma sugestão</p>
                <p className="text-sm">Clique em "Nova Sugestão" para começar</p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : publicSuggestions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ainda não há sugestões públicas</p>
              </CardContent>
            </Card>
          ) : (
            publicSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Nova Sugestão
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={newSuggestion.title}
                onChange={(e) =>
                  setNewSuggestion({ ...newSuggestion, title: e.target.value })
                }
                placeholder="Título da sugestão"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={newSuggestion.category}
                onValueChange={(value) =>
                  setNewSuggestion({ ...newSuggestion, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Funcionalidade</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={newSuggestion.description}
                onChange={(e) =>
                  setNewSuggestion({ ...newSuggestion, description: e.target.value })
                }
                placeholder="Descreva a sua sugestão em detalhe..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Sugestão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
