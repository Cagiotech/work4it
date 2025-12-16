import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PersonalSidebar } from "@/components/personal/PersonalSidebar";
import { PersonalHeader } from "@/components/personal/PersonalHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";

export default function PersonalLayout() {
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
