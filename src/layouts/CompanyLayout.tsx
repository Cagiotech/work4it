import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { CompanyHeader } from "@/components/company/CompanyHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { RequireAuth } from "@/hooks/useAuth";

export function CompanyLayout() {
  return (
    <RequireAuth>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <CompanySidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <CompanyHeader />
            <main className="flex-1 p-3 md:p-6 overflow-auto">
              <Outlet />
            </main>
            <DeveloperFooter />
          </div>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}
