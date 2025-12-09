import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";

export function StudentLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <StudentHeader />
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            <Outlet />
          </main>
          <DeveloperFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}
