import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  status: string | null;
  start_date: string;
  end_date: string;
  payment_status: string | null;
  subscription_plans: {
    name: string;
    price: number;
    description: string | null;
    duration_days: number;
  };
}

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get student ID
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        // Fetch all subscriptions
        const { data: subsData } = await supabase
          .from('student_subscriptions')
          .select('*, subscription_plans(name, price, description, duration_days)')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false });

        if (subsData) {
          setSubscriptions(subsData);
          const active = subsData.find(s => s.status === 'active');
          if (active) {
            setActiveSubscription(active);
          }
        }
      }

      setLoading(false);
    };

    fetchPayments();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Ativo</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Expirado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-500">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pendente'}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="border-success text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="border-red-500 text-red-500">Em Atraso</Badge>;
      default:
        return <Badge variant="outline">{status || '-'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      {activeSubscription ? (
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                      {activeSubscription.subscription_plans?.name || 'Plano Ativo'}
                    </h2>
                    {getStatusBadge(activeSubscription.status)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Válido até: {formatDate(activeSubscription.end_date)}
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  €{activeSubscription.subscription_plans?.price || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeSubscription.subscription_plans?.duration_days || 30} dias
                </p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Início: {formatDate(activeSubscription.start_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Dias restantes: 
                  </span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {getDaysRemaining(activeSubscription.end_date)} dias
                  </Badge>
                </div>
              </div>
              {activeSubscription.subscription_plans?.description && (
                <p className="text-sm text-muted-foreground mt-3">
                  {activeSubscription.subscription_plans.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sem Plano Ativo</h2>
            <p className="text-muted-foreground">
              Não tem nenhum plano de subscrição ativo. 
              Contacte a receção para ativar um plano.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Histórico de Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div 
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-xl border border-border gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {sub.subscription_plans?.name || 'Plano'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(sub.start_date)} - {formatDate(sub.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="font-semibold text-foreground">
                      €{sub.subscription_plans?.price || 0}
                    </span>
                    {getStatusBadge(sub.status)}
                    {getPaymentStatusBadge(sub.payment_status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {subscriptions.length === 0 && !activeSubscription && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum histórico de pagamentos encontrado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
