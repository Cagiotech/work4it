import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle, XCircle, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import logoLight from "@/assets/logo-light.png";

export default function StudentPendingApproval() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }

      const { data: student, error } = await supabase
        .from('students')
        .select('status, companies(name)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        navigate('/login');
        return;
      }

      setStatus(student.status);
      setCompanyName((student.companies as any)?.name || '');

      // If approved (active or pending onboarding), redirect appropriately
      if (student.status === 'active') {
        toast.success("Conta aprovada!");
        navigate('/student');
        return;
      }
      
      if (student.status === 'pending') {
        // Pending onboarding - self-registered student approved
        toast.success("Conta aprovada! Complete o seu perfil.");
        navigate('/onboarding-new-student');
        return;
      }

      if (student.status === 'rejected') {
        // Student was rejected
        toast.error("O seu registo foi rejeitado pela empresa.");
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Set up realtime subscription to watch for status changes
    const channel = supabase
      .channel('student-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus && newStatus !== 'pending_approval') {
            checkStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isRejected = status === 'rejected';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoLight} alt="Logo" className="h-10 mx-auto mb-4" />
            <div className={`h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isRejected ? 'bg-destructive/10' : 'bg-amber-500/10'
            }`}>
              {isRejected ? (
                <XCircle className="h-8 w-8 text-destructive" />
              ) : (
                <Clock className="h-8 w-8 text-amber-500" />
              )}
            </div>
            <CardTitle>
              {isRejected ? 'Registo Rejeitado' : 'Aguardando Aprovação'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isRejected ? (
              <>
                <p className="text-muted-foreground">
                  Infelizmente, o seu registo em <span className="font-semibold">{companyName}</span> foi rejeitado.
                </p>
                <p className="text-sm text-muted-foreground">
                  Entre em contacto com a empresa para mais informações.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  O seu registo em <span className="font-semibold">{companyName}</span> está aguardando aprovação.
                </p>
                <p className="text-sm text-muted-foreground">
                  Receberá uma notificação assim que a empresa aprovar o seu pedido.
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={checkStatus}
                  disabled={checking}
                  className="w-full"
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A verificar...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Verificar Status
                    </>
                  )}
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
      <DeveloperFooter />
    </div>
  );
}
