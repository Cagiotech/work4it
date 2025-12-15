import { useState, useEffect } from "react";
import { Apple, Flame, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  calories_target: number | null;
  protein_target: number | null;
  carbs_target: number | null;
  fat_target: number | null;
  meals: string | null;
  notes: string | null;
  is_active: boolean | null;
}

export default function NutritionPlan() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);

  useEffect(() => {
    const fetchNutritionPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get student ID
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        // Fetch active nutrition plan
        const { data: planData } = await supabase
          .from('student_nutrition_plans')
          .select('*')
          .eq('student_id', studentData.id)
          .eq('is_active', true)
          .maybeSingle();

        if (planData) {
          setPlan(planData);
        }
      }

      setLoading(false);
    };

    fetchNutritionPlan();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Apple className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sem Plano Nutricional</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ainda não tem um plano nutricional atribuído. 
              O seu Personal Trainer pode criar um plano personalizado para si.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card className="bg-gradient-card border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Apple className="h-6 w-6 md:h-7 md:w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                  {plan.title}
                </h2>
                <Badge className="bg-success text-success-foreground">Ativo</Badge>
              </div>
              {plan.description && (
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  {plan.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macros Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {plan.calories_target && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Calorias</p>
                  <p className="text-xl font-bold text-foreground">{plan.calories_target}</p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {plan.protein_target && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-500">P</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Proteína</p>
                  <p className="text-xl font-bold text-foreground">{plan.protein_target}g</p>
                  <p className="text-xs text-muted-foreground">/dia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {plan.carbs_target && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-500">C</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hidratos</p>
                  <p className="text-xl font-bold text-foreground">{plan.carbs_target}g</p>
                  <p className="text-xs text-muted-foreground">/dia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {plan.fat_target && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-yellow-500">G</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gordura</p>
                  <p className="text-xl font-bold text-foreground">{plan.fat_target}g</p>
                  <p className="text-xs text-muted-foreground">/dia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Meals */}
      {plan.meals && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Refeições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {plan.meals}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {plan.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Notas e Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {plan.notes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
