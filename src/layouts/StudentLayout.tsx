import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { useStudentAccessCheck } from "@/hooks/useStudentAccessCheck";
import { TermsAcceptanceDialog } from "@/components/student/TermsAcceptanceDialog";
import { PaymentReminderDialog } from "@/components/student/PaymentReminderDialog";
import { LoadingScreen } from "@/components/LoadingScreen";
import { supabase } from "@/integrations/supabase/client";

interface OverdueSubscription {
  id: string;
  end_date: string;
  payment_status: string | null;
  subscription_plans: {
    name: string;
    price: number;
  };
}

export function StudentLayout() {
  const { 
    checking, 
    mustAcceptTerms, 
    student, 
    company 
  } = useStudentAccessCheck();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPaymentReminder, setShowPaymentReminder] = useState(false);
  const [overdueSubscriptions, setOverdueSubscriptions] = useState<OverdueSubscription[]>([]);
  const [companyMbwayPhone, setCompanyMbwayPhone] = useState<string | null>(null);

  // Check for overdue payments
  useEffect(() => {
    const checkOverduePayments = async () => {
      if (!student?.id || !company?.id) return;

      // Get company MB Way phone
      const { data: companyData } = await supabase
        .from("companies")
        .select("mbway_phone")
        .eq("id", company.id)
        .single();

      if (companyData?.mbway_phone) {
        setCompanyMbwayPhone(companyData.mbway_phone);
      }

      // Get overdue subscriptions
      const today = new Date().toISOString().split("T")[0];
      const { data: subscriptions } = await supabase
        .from("student_subscriptions")
        .select("id, end_date, payment_status, subscription_plans(name, price)")
        .eq("student_id", student.id)
        .or(`payment_status.eq.pending,payment_status.eq.overdue`)
        .lt("end_date", today);

      if (subscriptions && subscriptions.length > 0) {
        setOverdueSubscriptions(subscriptions as OverdueSubscription[]);
        setShowPaymentReminder(true);
      }
    };

    // Check every 3 minutes as per requirement
    checkOverduePayments();
    const interval = setInterval(checkOverduePayments, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [student?.id, company?.id]);

  if (checking) {
    return <LoadingScreen isLoading={true} minDuration={2000}><div /></LoadingScreen>;
  }

  const showTermsDialog = mustAcceptTerms && !termsAccepted && student && company;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
          <StudentHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
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

      {/* Payment Reminder Dialog */}
      {student && overdueSubscriptions.length > 0 && (
        <PaymentReminderDialog
          open={showPaymentReminder}
          onOpenChange={setShowPaymentReminder}
          studentId={student.id}
          companyMbwayPhone={companyMbwayPhone}
          overdueSubscriptions={overdueSubscriptions}
          onProofSubmitted={() => {
            // Optionally refresh or close
          }}
        />
      )}
    </SidebarProvider>
  );
}
