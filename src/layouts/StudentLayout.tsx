import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { useStudentAccessCheck } from "@/hooks/useStudentAccessCheck";
import { TermsAcceptanceDialog } from "@/components/student/TermsAcceptanceDialog";
import { Loader2 } from "lucide-react";

export function StudentLayout() {
  const { 
    checking, 
    mustAcceptTerms, 
    student, 
    company 
  } = useStudentAccessCheck();
  
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showTermsDialog = mustAcceptTerms && !termsAccepted && student && company;

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

      {/* Terms Acceptance Dialog */}
      {showTermsDialog && (
        <TermsAcceptanceDialog
          open={true}
          studentId={student.id}
          companyId={company.id}
          companyName={company.name || "a empresa"}
          termsText={company.terms_text}
          regulationsText={company.regulations_text}
          onAccepted={() => setTermsAccepted(true)}
        />
      )}
    </SidebarProvider>
  );
}
