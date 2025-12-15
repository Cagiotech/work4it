import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronRight, ChevronLeft, User, Phone, MapPin, Heart, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeveloperFooter } from "@/components/DeveloperFooter";
import logoLight from "@/assets/logo-light.png";

interface StudentData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  nationality: string | null;
  nif: string | null;
  citizen_card: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  company_id: string;
}

export default function StudentOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState<StudentData | null>(null);
  
  const [formData, setFormData] = useState({
    // Step 1 - Personal
    phone: "",
    birthDate: "",
    gender: "",
    nationality: "Portuguesa",
    // Step 2 - Address
    address: "",
    postalCode: "",
    city: "",
    country: "Portugal",
    // Step 3 - Documents
    nif: "",
    citizenCard: "",
    // Step 4 - Emergency
    emergencyContact: "",
    emergencyPhone: "",
  });

  useEffect(() => {
    const fetchStudent = async () => {
      // First check if there's a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // No session, redirect to login
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          // Check if student actually needs onboarding
          // Only self-registered students with 'pending' status need onboarding
          // 'pending_approval' means waiting for company approval, not onboarding
          if (data.registration_method !== 'self_registered' || (data.status !== 'pending' && data.status !== 'active')) {
            // Already completed onboarding, company-added student, or waiting for approval
            navigate('/student');
            return;
          }
          
          setStudent(data);
          setFormData({
            phone: data.phone || "",
            birthDate: data.birth_date || "",
            gender: data.gender || "",
            nationality: data.nationality || "Portuguesa",
            address: data.address || "",
            postalCode: data.postal_code || "",
            city: data.city || "",
            country: data.country || "Portugal",
            nif: data.nif || "",
            citizenCard: data.citizen_card || "",
            emergencyContact: data.emergency_contact || "",
            emergencyPhone: data.emergency_phone || "",
          });
        } else {
          // No student record found, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [navigate]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!student) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          phone: formData.phone || null,
          birth_date: formData.birthDate || null,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          address: formData.address || null,
          postal_code: formData.postalCode || null,
          city: formData.city || null,
          country: formData.country || null,
          nif: formData.nif || null,
          citizen_card: formData.citizenCard || null,
          emergency_contact: formData.emergencyContact || null,
          emergency_phone: formData.emergencyPhone || null,
          status: 'active', // Activate the student
        })
        .eq('id', student.id);

      if (error) throw error;
      
      toast.success("Perfil completo!");
      navigate('/student');
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || "Erro ao guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Sessão Inválida</h2>
            <p className="text-muted-foreground">
              Não foi possível encontrar os seus dados. Faça login novamente.
            </p>
            <Button className="mt-4" onClick={() => navigate('/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Pessoal", icon: User },
    { number: 2, title: "Morada", icon: MapPin },
    { number: 3, title: "Documentos", icon: User },
    { number: 4, title: "Emergência", icon: Heart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <img src={logoLight} alt="Logo" className="h-10 mx-auto mb-4" />
            <CardTitle>Complete o seu Perfil</CardTitle>
            <CardDescription>
              Olá {student.full_name.split(' ')[0]}! Preencha os seus dados para continuar.
            </CardDescription>
            
            {/* Progress Steps */}
            <div className="flex justify-center gap-2 mt-4">
              {steps.map((s) => (
                <div
                  key={s.number}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    step === s.number
                      ? "bg-primary text-primary-foreground"
                      : step > s.number
                      ? "bg-green-500/20 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <s.icon className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Step 1 - Personal Info */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Género</Label>
                    <Select 
                      value={formData.gender || "__none__"} 
                      onValueChange={(value) => setFormData({ ...formData, gender: value === "__none__" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Prefiro não dizer</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidade</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="Portuguesa"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 - Address */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Morada</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, andar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="0000-000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Lisboa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Portugal"
                  />
                </div>
              </>
            )}

            {/* Step 3 - Documents */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF (Número de Identificação Fiscal)</Label>
                  <Input
                    id="nif"
                    value={formData.nif}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    placeholder="000000000"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citizenCard">Cartão de Cidadão</Label>
                  <Input
                    id="citizenCard"
                    value={formData.citizenCard}
                    onChange={(e) => setFormData({ ...formData, citizenCard: e.target.value })}
                    placeholder="00000000 0 XX0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Estes dados são opcionais mas podem ser necessários para a faturação.
                </p>
              </>
            )}

            {/* Step 4 - Emergency Contact */}
            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Nome do Contacto de Emergência</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Nome da pessoa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="+351 912 345 678"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este contacto será utilizado em caso de emergência durante as atividades.
                </p>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              {step < 4 ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      Concluir
                      <CheckCircle className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <DeveloperFooter />
    </div>
  );
}
