import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeveloperFooter } from '@/components/DeveloperFooter';
import logo from '@/assets/logo-light.png';
import { Eye, EyeOff, Lock, CheckCircle, Sparkles, Briefcase, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffInfo {
  id: string;
  full_name: string;
  position: string | null;
  email: string;
  company_id: string;
  companyName?: string;
}

const StaffOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadStaffInfo();
  }, []);

  const loadStaffInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: staff, error } = await supabase
        .from('staff')
        .select('id, full_name, position, email, company_id, password_changed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !staff) {
        toast.error('Erro ao carregar dados do colaborador');
        navigate('/login');
        return;
      }

      // If password already changed, redirect to appropriate panel
      if (staff.password_changed) {
        redirectToPanel(staff.position);
        return;
      }

      // Get company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', staff.company_id)
        .single();

      setStaffInfo({
        ...staff,
        companyName: company?.name || 'a empresa'
      });
    } catch (error) {
      console.error('Error loading staff info:', error);
      toast.error('Erro ao carregar informações');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const redirectToPanel = (position: string | null) => {
    const personalPositions = ['personal trainer', 'instrutor'];
    if (position && personalPositions.includes(position.toLowerCase())) {
      navigate('/personal');
    } else {
      navigate('/company');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setSaving(true);

    try {
      // Update password in auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // Mark password as changed
      const { error: staffError } = await supabase
        .from('staff')
        .update({ password_changed: true })
        .eq('id', staffInfo?.id);

      if (staffError) throw staffError;

      toast.success('Senha alterada com sucesso! Bem-vindo à equipa!');
      
      // Redirect based on position
      redirectToPanel(staffInfo?.position || null);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          {/* Welcome Animation */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex p-4 rounded-3xl bg-primary/10 mb-6">
              <img src={logo} alt="Cagiotech" className="h-16 w-auto" />
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Bem-vindo à Equipa!
              </h1>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </div>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Olá <span className="font-semibold text-primary">{staffInfo?.full_name}</span>! 
              Estamos muito felizes por tê-lo(a) como parte da equipa de{' '}
              <span className="font-semibold">{staffInfo?.companyName}</span>.
            </p>
          </div>

          {/* Position Card */}
          <Card className="mb-6 border-primary/20 bg-primary/5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">O seu cargo</p>
                  <p className="text-xl font-bold text-foreground">
                    {staffInfo?.position || 'Colaborador'}
                  </p>
                </div>
                {(staffInfo?.position?.toLowerCase().includes('personal') || 
                  staffInfo?.position?.toLowerCase() === 'instrutor') && (
                  <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Acesso ao Painel Personal</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change Card */}
          <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto p-3 rounded-2xl bg-primary/10 w-fit mb-2">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Altere a sua Senha</CardTitle>
              <CardDescription>
                Por segurança, altere a sua senha temporária para começar a utilizar a plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      A guardar...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Começar a Trabalhar
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <DeveloperFooter />
    </div>
  );
};

export default StaffOnboarding;
