import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PersonalSidebar } from "@/components/personal/PersonalSidebar";
import { PersonalHeader } from "@/components/personal/PersonalHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { useAuth } from "@/hooks/useAuth";
import { useStaffAccessCheck } from "@/hooks/useStaffAccessCheck";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PersonalLayout() {
  const { user, loading: authLoading } = useAuth();
  const { checking, staff } = useStaffAccessCheck();
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

  const loading = authLoading || checking;

  // Show loading screen until both auth is loaded AND min time has elapsed
  if (loading || !minTimeElapsed) {
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

  // Show access denied if not staff member
  if (!staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldX className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Não tem permissão para aceder a esta área. Esta secção é restrita a colaboradores.
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            Voltar à página inicial
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PersonalSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
          <PersonalHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
          <DeveloperFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
