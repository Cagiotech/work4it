import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, try to find the user type by email
      // Check if it's a student
      const { data: student } = await supabase
        .from('students')
        .select('id, company_id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (student) {
        // Create password reset request for student
        const { error } = await supabase
          .from('password_reset_requests')
          .insert({
            email: email.toLowerCase(),
            user_type: 'student',
            user_id: student.id,
            company_id: student.company_id,
          });

        if (error) throw error;
        setUserType('student');
        setSubmitted(true);
        return;
      }

      // Check if it's staff
      const { data: staff } = await supabase
        .from('staff')
        .select('id, company_id, position')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (staff) {
        // Create password reset request for staff
        const { error } = await supabase
          .from('password_reset_requests')
          .insert({
            email: email.toLowerCase(),
            user_type: 'staff',
            user_id: staff.id,
            company_id: staff.company_id,
          });

        if (error) throw error;
        setUserType('staff');
        setSubmitted(true);
        return;
      }

      // Check if it's a company owner (profile with company)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, company_id, user_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .maybeSingle();

      // Try to find by checking auth users (we'll just create a company request)
      const { error } = await supabase
        .from('password_reset_requests')
        .insert({
          email: email.toLowerCase(),
          user_type: 'company',
          company_id: null,
        });

      if (error) throw error;
      setUserType('company');
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting reset request:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Decorative */}
        <div className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 rounded-r-[3rem]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 rounded-r-[3rem]" />
          <div className="relative max-w-md text-center animate-fade-in">
            <div className="inline-flex p-5 rounded-3xl bg-white/10 backdrop-blur-sm mb-8">
              <CheckCircle className="h-20 w-20 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">
              Pedido Enviado!
            </h1>
            <p className="text-lg text-primary-foreground/80">
              O seu pedido de recuperação foi registado com sucesso.
            </p>
          </div>
        </div>

        {/* Right side - Success message */}
        <div className="flex flex-1 flex-col bg-background">
          <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
            <div className="mx-auto w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="p-2.5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <img src={logo} alt="Cagiotech" className="h-8 w-auto" />
                  </div>
                  <span className="font-heading text-xl font-bold text-foreground">
                    Cagiotech
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center">
                <div className="inline-flex p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 lg:hidden">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                
                <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
                  Pedido Registado
                </h2>
                
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-left text-sm text-amber-800 dark:text-amber-200">
                      {userType === 'company' ? (
                        <p>
                          O seu pedido será analisado pelo <strong>Administrador da plataforma</strong>. 
                          Em breve receberá uma nova senha ou será contactado.
                        </p>
                      ) : (
                        <p>
                          O seu pedido será analisado pela <strong>empresa responsável</strong>. 
                          Em breve irão liberar o seu acesso ou entrar em contacto consigo.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-8">
                  O email <strong>{email}</strong> foi registado para recuperação de acesso.
                </p>

                <Link to="/login">
                  <Button className="w-full h-14 text-base font-semibold rounded-2xl">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <DeveloperFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="relative hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:items-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 rounded-r-[3rem]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 rounded-r-[3rem]" />
        <div className="relative max-w-md text-center animate-fade-in">
          <div className="inline-flex p-5 rounded-3xl bg-white/10 backdrop-blur-sm mb-8">
            <img src={logo} alt="Cagiotech" className="h-20 w-auto brightness-0 invert" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-4">
            Recuperar Acesso
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-10">
            Não se preocupe, vamos ajudá-lo a recuperar o acesso à sua conta.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="p-2.5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <img src={logo} alt="Cagiotech" className="h-8 w-auto" />
                </div>
                <span className="font-heading text-xl font-bold text-foreground">
                  Cagiotech
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Form */}
            <div className="mb-8">
              <h2 className="font-heading text-3xl font-bold text-foreground">
                Esqueceu a Senha?
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Insira o email usado no cadastro. O responsável irá analisar o seu pedido e liberar o acesso.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium text-sm">
                  Email do Cadastro
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.pt"
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <h4 className="font-medium text-sm mb-2">Como funciona?</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary">1.</span>
                    Insira o email utilizado no cadastro
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary">2.</span>
                    O responsável receberá o seu pedido
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-primary">3.</span>
                    Após aprovação, receberá uma nova senha
                  </li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                size="lg" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Pedido de Recuperação'
                )}
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Login
                </Link>
              </div>
            </form>
          </div>
        </div>
        
        <DeveloperFooter />
      </div>
    </div>
  );
};

export default ForgotPassword;
