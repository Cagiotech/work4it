import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { RequireAuth, useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/LoadingScreen";

export function CompanyLayout() {
  const { loading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
  
  return (
    <RequireAuth>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <CompanySidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
            <CompanyHeader />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <Outlet />
            </main>
            <DeveloperFooter />
          </div>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}
