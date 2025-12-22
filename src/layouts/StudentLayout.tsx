import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import { useStudentAccessCheck } from "@/hooks/useStudentAccessCheck";
import { TermsAcceptanceDialog } from "@/components/student/TermsAcceptanceDialog";
import { PaymentReminderDialog } from "@/components/student/PaymentReminderDialog";
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
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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

  // Show loading screen until both checking is done AND min time has elapsed
  if (checking || !minTimeElapsed) {
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
