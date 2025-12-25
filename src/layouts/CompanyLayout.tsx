import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { AdminBanner } from "@/components/shared/AdminBanner";
import { BlockedCompanyScreen } from "@/components/company/BlockedCompanyScreen";
import { TrialExpiredScreen } from "@/components/company/TrialExpiredScreen";
import { useAuth } from "@/hooks/useAuth";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CompanyLayout() {
  const { user, profile, company, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!authLoading && user && profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [authLoading, user, profile, navigate]);

  // Show loading screen until both auth is loaded AND min time has elapsed
  if (authLoading || !minTimeElapsed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-primary/20" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-muted-foreground text-sm font-medium">A carregar...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has completed onboarding and has a company
  if (!user || !profile?.onboarding_completed) {
    return null;
  }

  // Show access denied if not a company owner (no company_id)
  if (!profile?.company_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Não tem permissão para aceder a esta área. Esta secção é restrita a proprietários de empresas.
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Voltar à página inicial
          </Button>
        </div>
      </div>
    );
  }

  // Show blocked screen if company is blocked
  if (company?.is_blocked) {
    return (
      <BlockedCompanyScreen 
        companyName={company.name || "Sua empresa"} 
        blockedReason={company.blocked_reason}
      />
    );
  }

  // Check if trial has expired and no active subscription
  const isTrialExpired = () => {
    if (!company) return false;
    if (company.has_active_subscription) return false;
    if (!company.trial_ends_at) return false;
    
    const trialEndDate = new Date(company.trial_ends_at);
    const now = new Date();
    return now > trialEndDate;
  };

  // Show trial expired screen
  if (isTrialExpired()) {
    return (
      <TrialExpiredScreen 
        companyName={company?.name || "Sua empresa"} 
        trialEndedAt={company?.trial_ends_at || undefined}
      />
    );
  }

  // Calculate days remaining in trial
  const getTrialDaysRemaining = () => {
    if (!company?.trial_ends_at || company?.has_active_subscription) return null;
    const trialEndDate = new Date(company.trial_ends_at);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CompanySidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
          <CompanyHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {/* Trial Banner */}
            {trialDaysRemaining !== null && trialDaysRemaining <= 7 && (
              <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
                trialDaysRemaining <= 3 
                  ? 'bg-destructive/10 border border-destructive/30' 
                  : 'bg-warning/10 border border-warning/30'
              }`}>
                <div className="flex items-center gap-3">
                  <Badge variant={trialDaysRemaining <= 3 ? "destructive" : "secondary"}>
                    {trialDaysRemaining === 0 
                      ? 'Último dia!' 
                      : `${trialDaysRemaining} dia${trialDaysRemaining > 1 ? 's' : ''}`}
                  </Badge>
                  <span className="text-sm font-medium">
                    {trialDaysRemaining === 0 
                      ? 'O seu período de teste termina hoje. Subscreva um plano para continuar.'
                      : `O seu período de teste termina em ${trialDaysRemaining} dia${trialDaysRemaining > 1 ? 's' : ''}. Subscreva um plano para manter o acesso.`
                    }
                  </span>
                </div>
              </div>
            )}
            <AdminBanner audience="companies" />
            <Outlet />
          </main>
          <DeveloperFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}