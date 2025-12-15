import { useState, useEffect } from "react";
import { Calendar, Dumbbell, Apple, CreditCard, MessageCircle, User, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface StudentData {
  id: string;
  full_name: string;
  email: string | null;
  status: string | null;
  enrollment_date: string | null;
  company_id: string;
  companies?: {
    name: string | null;
  };
}

interface SubscriptionData {
  id: string;
  status: string | null;
  end_date: string;
  subscription_plans: {
    name: string;
  };
}

interface NutritionPlan {
  id: string;
  title: string;
  is_active: boolean | null;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Fetch student data with company info
        const { data: studentData } = await supabase
          .from('students')
          .select('*, companies(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (studentData) {
          setStudent(studentData);

          // Fetch active subscription
          const { data: subData } = await supabase
            .from('student_subscriptions')
            .select('*, subscription_plans(name)')
            .eq('student_id', studentData.id)
            .eq('status', 'active')
            .maybeSingle();

          if (subData) {
            setSubscription(subData);
          }

          // Fetch active nutrition plan
          const { data: nutritionData } = await supabase
            .from('student_nutrition_plans')
            .select('id, title, is_active')
            .eq('student_id', studentData.id)
            .eq('is_active', true)
            .maybeSingle();

          if (nutritionData) {
            setNutritionPlan(nutritionData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickActions = [
    { icon: Calendar, label: "Aulas", href: "/student/classes", color: "bg-blue-500/10 text-blue-500" },
    { icon: Apple, label: "Nutrição", href: "/student/nutrition", color: "bg-green-500/10 text-green-500" },
    { icon: CreditCard, label: "Pagamentos", href: "/student/payments", color: "bg-purple-500/10 text-purple-500" },
    { icon: MessageCircle, label: "Chat", href: "/student/chat", color: "bg-orange-500/10 text-orange-500" },
  ];

  const getFirstName = (fullName: string) => {
    return fullName?.split(' ')[0] || 'Aluno';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
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
      {/* Welcome Message */}
      <div className="bg-gradient-primary rounded-2xl p-4 md:p-6 text-primary-foreground">
        <h2 className="font-heading text-xl md:text-2xl font-bold mb-2">
          Olá, {student ? getFirstName(student.full_name) : 'Aluno'}! 👋
        </h2>
        <p className="opacity-90 text-sm md:text-base">
          {student?.companies?.name ? `Bem-vindo ao ${student.companies.name}` : 'Bem-vindo ao seu painel'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {quickActions.map((action, index) => (
          <Link key={index} to={action.href}>
            <div className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className={`h-10 w-10 md:h-12 md:w-12 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground">{action.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <User className="h-5 w-5 text-primary" />
              Meus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground text-sm">Nome</span>
              <span className="font-medium text-sm">{student?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="font-medium text-sm">{student?.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground text-sm">Status</span>
              <Badge variant="outline" className={
                student?.status === 'active' 
                  ? "border-green-500 text-green-600" 
                  : "border-gray-500 text-gray-600"
              }>
                {student?.status === 'active' ? 'Ativo' : student?.status || '-'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground text-sm">Membro desde</span>
              <span className="font-medium text-sm">{formatDate(student?.enrollment_date || null)}</span>
            </div>
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link to="/student/settings">Editar Perfil</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Meu Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-3">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="font-semibold text-lg text-primary">
                    {subscription.subscription_plans?.name || 'Plano Ativo'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Válido até {formatDate(subscription.end_date)}
                  </p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground text-sm">Dias restantes</span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {getDaysRemaining(subscription.end_date)} dias
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/student/payments">Ver Pagamentos</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum plano ativo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contacte a receção para ativar um plano
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Plan Card */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Apple className="h-5 w-5 text-primary" />
              Plano Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nutritionPlan ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20">
                  <h3 className="font-semibold text-green-600">{nutritionPlan.title}</h3>
                  <Badge variant="outline" className="border-green-500 text-green-600 mt-2">
                    Ativo
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/student/nutrition">Ver Detalhes</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Apple className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Sem plano nutricional</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O seu personal trainer pode criar um plano para si
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Os seus documentos e termos assinados
              </p>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/student/settings">Ver Documentos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
