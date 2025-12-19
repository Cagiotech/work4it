import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import logoLight from "@/assets/logo-light.png";

interface Company {
  id: string;
  name: string | null;
  registration_code: string;
  require_student_approval: boolean | null;
}

export default function StudentRegister() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!code) {
        setLoading(false);
        return;
      }

      try {
        // Use secure RPC function to fetch only necessary company info
        const { data, error } = await supabase
          .rpc('get_company_registration_info', { p_registration_code: code });

        if (error) throw error;
        
        // RPC returns array, get first result
        const companyData = Array.isArray(data) && data.length > 0 ? data[0] : null;
        setCompany(companyData);
      } catch (error) {
        console.error('Error fetching company:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As palavras-passe não coincidem");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("A palavra-passe deve ter pelo menos 8 caracteres");
      return;
    }

    if (!company) return;

    setSubmitting(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/new-student`,
          data: {
            full_name: formData.fullName,
            role: 'student',
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Determine initial status based on company settings
        // If company requires approval, set to 'pending_approval'
        // Otherwise, set to 'pending' (pending onboarding completion)
        const initialStatus = company.require_student_approval ? 'pending_approval' : 'pending';
        
        // Create student record
        const { error: studentError } = await supabase
          .from('students')
          .insert([{
            company_id: company.id,
            full_name: formData.fullName,
            email: formData.email,
            user_id: authData.user.id,
            registration_method: 'self_registered',
            password_changed: true, // They set their own password
            status: initialStatus,
          }]);

        if (studentError) {
          console.error('Error creating student:', studentError);
          // If we can't create student, we should inform but account is created
        }

        setSuccess(true);
        
        // If requires approval, show different message
        if (company.require_student_approval) {
          toast.success("Conta criada! Aguarde aprovação da empresa.");
          // Don't redirect to onboarding, show pending message
        } else {
          toast.success("Conta criada com sucesso!");
          // Redirect to student onboarding after a moment
          setTimeout(() => {
            navigate('/new-student');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      if (error.message.includes('already registered')) {
        toast.error("Este email já está registado. Faça login.");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!code || !company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
            <p className="text-muted-foreground">
              Este link de registro não é válido ou expirou. 
              Contacte a sua empresa para obter um novo link.
            </p>
            <Button className="mt-4" onClick={() => navigate('/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
        <DeveloperFooter />
      </div>
    );
  }

  if (success) {
    const requiresApproval = company?.require_student_approval;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${requiresApproval ? 'text-amber-500' : 'text-green-500'}`} />
            <h2 className="text-xl font-bold mb-2">
              {requiresApproval ? 'Registo Submetido!' : 'Conta Criada!'}
            </h2>
            <p className="text-muted-foreground">
              {requiresApproval 
                ? 'O seu registo foi submetido e aguarda aprovação da empresa. Receberá um email quando for aprovado.'
                : 'A sua conta foi criada com sucesso. A redirecionar para completar o seu perfil...'}
            </p>
            {requiresApproval ? (
              <Button className="mt-4" onClick={() => navigate('/login')}>
                Voltar ao Login
              </Button>
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-4" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logoLight} alt="Logo" className="h-12 mx-auto mb-4" />
            <CardTitle>Criar Conta</CardTitle>
            <CardDescription>
              Registar-se em <span className="font-semibold text-primary">{company.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="O seu nome completo"
                  required
                  disabled={submitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Palavra-passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repetir palavra-passe"
                  required
                  disabled={submitting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A criar conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => navigate('/login')}
                >
                  Fazer login
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <DeveloperFooter />
    </div>
  );
}
