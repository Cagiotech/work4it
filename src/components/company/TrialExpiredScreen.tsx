import { useNavigate } from "react-router-dom";
import { Clock, CreditCard, LogOut, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-light.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface TrialExpiredScreenProps {
  companyName: string;
  trialEndedAt?: string;
}

export function TrialExpiredScreen({ companyName, trialEndedAt }: TrialExpiredScreenProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number, billingCycle: string) => {
    const formatted = new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);

    const cycleLabels: Record<string, string> = {
      'monthly': '/mês',
      'quarterly': '/trimestre',
      'yearly': '/ano',
      'weekly': '/semana'
    };

    return `${formatted}${cycleLabels[billingCycle] || ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={logo} alt="Cagiotech" className="mx-auto h-12 w-auto mb-6" />
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-4">
              <Clock className="w-10 h-10 text-warning" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Período de Teste Expirado
            </h1>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              O período de teste gratuito de <strong>{companyName}</strong> terminou
              {trialEndedAt && ` em ${formatDate(trialEndedAt)}`}.
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-8 border-warning/30 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <CreditCard className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Subscreva um plano para continuar</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Para continuar a usar todas as funcionalidades da plataforma, escolha um dos planos abaixo. 
                    Todos os seus dados estão seguros e serão mantidos após a subscrição.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          {plansLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-8 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-5/6" />
                      <div className="h-4 bg-muted rounded w-4/6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all hover:shadow-lg hover:border-primary/50 ${
                    index === 1 ? 'border-primary shadow-md md:scale-105' : ''
                  }`}
                >
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      <Crown className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(plan.price, plan.billing_cycle)}
                    </div>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Limits */}
                    <div className="space-y-2 text-sm">
                      {plan.max_students && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Até {plan.max_students} alunos</span>
                        </div>
                      )}
                      {plan.max_staff && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span>Até {plan.max_staff} funcionários</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="space-y-2 text-sm border-t pt-4">
                        {(plan.features as string[]).slice(0, 5).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      className="w-full mt-4" 
                      variant={index === 1 ? "default" : "outline"}
                      onClick={() => {
                        // TODO: Implementar processo de checkout
                        window.open('mailto:suporte@cagiotech.com?subject=Subscrição ' + plan.name, '_blank');
                      }}
                    >
                      Escolher Plano
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">
                  Nenhum plano disponível de momento. Entre em contacto com o suporte.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Precisa de ajuda? Entre em contacto connosco:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a 
                href="mailto:suporte@cagiotech.com" 
                className="text-primary hover:underline"
              >
                suporte@cagiotech.com
              </a>
              <span className="text-muted-foreground">|</span>
              <a 
                href="https://wa.me/351912345678" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Terminar Sessão
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
