import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { User, Briefcase, Building2, MapPin, ArrowRight, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    rolePosition: '',
    companyName: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1 && !formData.fullName) {
      toast.error('Por favor, insira o seu nome');
      return;
    }
    if (step === 2 && !formData.rolePosition) {
      toast.error('Por favor, insira o seu cargo');
      return;
    }
    if (step === 3 && !formData.companyName) {
      toast.error('Por favor, insira o nome da empresa');
      return;
    }
    setStep(step + 1);
  };

  const handleSkip = () => {
    if (step === 4) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: formData.companyName,
          address: formData.address || null,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Update profile with company data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          role_position: formData.rolePosition,
          company_id: company.id,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast.success('Dados da empresa salvos com sucesso!');
      navigate('/company');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      field: 'fullName',
      label: 'Qual é o seu nome?',
      placeholder: 'Digite o seu nome completo',
      icon: User,
      required: true,
    },
    {
      field: 'rolePosition',
      label: 'Qual é o seu cargo?',
      placeholder: 'Ex: Diretor, Gerente, Proprietário',
      icon: Briefcase,
      required: true,
    },
    {
      field: 'companyName',
      label: 'Qual é o nome da empresa?',
      placeholder: 'Nome da sua empresa',
      icon: Building2,
      required: true,
    },
    {
      field: 'address',
      label: 'Qual é o endereço da empresa?',
      placeholder: 'Endereço completo',
      icon: MapPin,
      required: false,
    },
  ];

  const currentStep = steps[step - 1];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="Cagiotech" className="mx-auto h-16 w-auto" />
            <h1 className="mt-6 font-heading text-2xl font-bold text-foreground">
              Complete o seu cadastro
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Passo {step} de {steps.length}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8 flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                {currentStep.label}
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor={currentStep.field} className="sr-only">
                  {currentStep.label}
                </Label>
                <Input
                  id={currentStep.field}
                  name={currentStep.field}
                  type="text"
                  value={formData[currentStep.field as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={currentStep.placeholder}
                  className="text-center text-lg py-6"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                {!currentStep.required && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleSkip}
                    disabled={loading}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Pular
                  </Button>
                )}
                
                {step < steps.length ? (
                  <Button
                    type="button"
                    variant="hero"
                    className={currentStep.required ? 'w-full' : 'flex-1'}
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
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Finalizar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeveloperFooter />
    </div>
  );
};

export default Onboarding;
