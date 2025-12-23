import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { User, Briefcase, Building2, MapPin, ArrowRight, ArrowLeft, Check, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roleOptions = [
  { value: 'proprietario', label: 'Proprietário' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'gerente', label: 'Gerente Geral' },
  { value: 'gerente_operacional', label: 'Gerente Operacional' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'personal_trainer', label: 'Personal Trainer' },
  { value: 'instrutor', label: 'Instrutor' },
  { value: 'outro', label: 'Outro' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    rolePosition: '',
    companyName: '',
    address: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/login');
        return;
      }

      // First check if user is a student - redirect them to student area
      const { data: studentData } = await supabase
        .from('students')
        .select('id, status, registration_method')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (studentData) {
        // User is a student, redirect appropriately
        if (studentData.registration_method === 'self_registered' && studentData.status === 'pending') {
          navigate('/onboarding-new-student');
        } else {
          navigate('/student');
        }
        return;
      }

      // Check if user is staff - redirect them to company area
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (staffData) {
        navigate('/company');
        return;
      }

      // Check company owner profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate('/company');
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value: string) => {
    const selectedRole = roleOptions.find(r => r.value === value);
    setFormData({ ...formData, rolePosition: selectedRole?.label || value });
  };

  const handleNext = () => {
    if (step === 1 && !formData.fullName.trim()) {
      toast.error('Por favor, insira o seu nome');
      return;
    }
    if (step === 2 && !formData.rolePosition) {
      toast.error('Por favor, selecione o seu cargo');
      return;
    }
    if (step === 3 && !formData.companyName.trim()) {
      toast.error('Por favor, insira o nome da empresa');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      const user = session.user;

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([
          {
            name: formData.companyName.trim(),
            address: formData.address.trim() || null,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (companyError) throw companyError;

      // Update profile with company data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim(),
          role_position: formData.rolePosition,
          company_id: company.id,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast.success('Cadastro concluído com sucesso!');
      navigate('/company');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 4;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Back to Login Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={async () => {
                await supabase.auth.signOut({ scope: 'local' });
                navigate('/login');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <img src={logo} alt="Cagiotech" className="mx-auto h-12 w-auto" />
            <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">
              Bem-vindo à Cagiotech
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete seu cadastro para começar
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      s < step
                        ? 'bg-primary text-primary-foreground'
                        : s === step
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s < step ? <Check className="h-5 w-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-12 sm:w-20 h-1 mx-1 rounded ${
                        s < step ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Passo {step} de {totalSteps}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Qual é o seu nome?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe seu nome completo
                  </p>
                </div>
                <div>
                  <Label htmlFor="fullName" className="sr-only">Nome completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Digite seu nome completo"
                    className="text-center text-lg h-12"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Role */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Briefcase className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Qual é o seu cargo?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selecione sua função na empresa
                  </p>
                </div>
                <div>
                  <Label htmlFor="rolePosition" className="sr-only">Cargo</Label>
                  <Select
                    value={roleOptions.find(r => r.label === formData.rolePosition)?.value || ''}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione seu cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Company Name */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Qual é o nome da empresa?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nome do seu ginásio, academia ou estúdio
                  </p>
                </div>
                <div>
                  <Label htmlFor="companyName" className="sr-only">Nome da empresa</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Ex: Academia Fitness Plus"
                    className="text-center text-lg h-12"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 4: Address */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    Qual é o endereço? (Opcional)
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pode pular se preferir adicionar depois
                  </p>
                </div>
                <div>
                  <Label htmlFor="address" className="sr-only">Endereço</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Rua, número, cidade..."
                    className="text-center text-lg h-12"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  variant="hero"
                  className={`h-12 ${step === 1 ? 'w-full' : 'flex-1'}`}
                  onClick={handleNext}
                  disabled={loading}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="hero"
                  className="flex-1 h-12"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Finalizar Cadastro
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Summary */}
          {step > 1 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Seus dados:</p>
              <div className="flex flex-wrap gap-2">
                {formData.fullName && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {formData.fullName}
                  </span>
                )}
                {formData.rolePosition && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {formData.rolePosition}
                  </span>
                )}
                {formData.companyName && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {formData.companyName}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <DeveloperFooter />
    </div>
  );
};

export default Onboarding;
