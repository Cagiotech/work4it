import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';
import { LogoMarquee } from '@/components/landing/LogoMarquee';
import logo from '@/assets/logo-light.png';
import { 
  ArrowRight, 
  Users, 
  Calendar, 
  DollarSign, 
  UserCog, 
  Dumbbell, 
  Apple,
  BarChart3,
  MessageSquare,
  Shield,
  Smartphone,
  Clock,
  Check,
  Star,
  Zap,
  Sparkles
} from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Users, title: 'Gestão de Alunos', description: 'Perfis completos com anamnese, treinos e nutrição personalizada.', gradient: 'from-orange-500 to-red-500' },
    { icon: Calendar, title: 'Aulas e Agenda', description: 'Calendário visual com inscrições automáticas e controlo de presenças.', gradient: 'from-emerald-500 to-teal-500' },
    { icon: DollarSign, title: 'Financeiro', description: 'Faturação automática, controlo de pagamentos e relatórios.', gradient: 'from-yellow-500 to-amber-500' },
    { icon: UserCog, title: 'Recursos Humanos', description: 'Equipa, horários, férias e folha de pagamento integrada.', gradient: 'from-violet-500 to-purple-500' },
    { icon: Dumbbell, title: 'Planos de Treino', description: 'Treinos personalizados com exercícios detalhados.', gradient: 'from-rose-500 to-pink-500' },
    { icon: Apple, title: 'Nutrição', description: 'Planos alimentares com macros e receitas.', gradient: 'from-lime-500 to-green-500' },
    { icon: BarChart3, title: 'Dashboard', description: 'KPIs em tempo real e relatórios PDF automáticos.', gradient: 'from-cyan-500 to-blue-500' },
    { icon: MessageSquare, title: 'Comunicação', description: 'Chat integrado entre equipa e alunos.', gradient: 'from-fuchsia-500 to-pink-500' },
  ];

  const benefits = [
    { icon: Clock, title: 'Poupe 15h/semana', description: 'Automatize tarefas repetitivas e foque no que importa.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Shield, title: 'Dados Seguros', description: 'Encriptação de ponta e backups automáticos diários.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Smartphone, title: 'App para Alunos', description: 'Acesso mobile a treinos, aulas e pagamentos.', color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { icon: BarChart3, title: 'Relatórios', description: 'Decisões baseadas em dados reais do seu negócio.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: Users, title: 'Multi-Utilizador', description: 'Permissões personalizadas por função e equipa.', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { icon: Star, title: 'Suporte Premium', description: 'Ajuda em português com resposta rápida.', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  const plans = [
    {
      name: 'Starter',
      description: 'Para academias em crescimento',
      price: '29',
      features: ['Até 100 alunos', 'Gestão de aulas', 'Dashboard básico', 'Suporte por email', '1 utilizador admin'],
      featured: false,
      gradient: 'from-slate-600 to-slate-800'
    },
    {
      name: 'Professional',
      description: 'Para academias estabelecidas',
      price: '79',
      features: ['Até 500 alunos', 'Todos os módulos', 'Dashboard avançado', 'App para alunos', 'Suporte prioritário', '5 utilizadores admin', 'Relatórios PDF'],
      featured: true,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      name: 'Enterprise',
      description: 'Para redes e franchises',
      price: '199',
      features: ['Alunos ilimitados', 'Multi-unidades', 'API personalizada', 'Gestor dedicado', 'SLA garantido', 'Utilizadores ilimitados', 'White-label'],
      featured: false,
      gradient: 'from-violet-600 to-purple-800'
    }
  ];

  const faqs = [
    { question: 'Posso testar antes de comprar?', answer: 'Sim! Oferecemos 14 dias de teste grátis em todos os planos, sem necessidade de cartão de crédito.' },
    { question: 'Quanto tempo demora a configurar?', answer: 'A configuração inicial leva cerca de 5-10 minutos. A nossa equipa ajuda na migração de dados.' },
    { question: 'Os dados são seguros?', answer: 'Absolutamente. Utilizamos encriptação de ponta a ponta e backups automáticos diários.' },
    { question: 'Posso importar dados de outro sistema?', answer: 'Sim, suportamos importação via CSV/Excel e oferecemos migração assistida.' },
    { question: 'Funciona em telemóvel?', answer: 'Sim! A plataforma é totalmente responsiva e os alunos têm app dedicada.' },
    { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, sem fidelização. Cancele quando quiser sem taxas adicionais.' },
  ];

  const useCases = [
    { title: 'Gestão de Alunos', description: 'Perfis completos e acompanhamento' },
    { title: 'Agendamento de Aulas', description: 'Calendário inteligente' },
    { title: 'Controlo Financeiro', description: 'Pagamentos automatizados' },
    { title: 'Planos de Treino', description: 'Treinos personalizados' },
    { title: 'Nutrição', description: 'Planos alimentares' },
    { title: 'Comunicação', description: 'Chat integrado' },
    { title: 'RH e Equipa', description: 'Gestão de colaboradores' },
    { title: 'Relatórios', description: 'Analytics em tempo real' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Cagiotech" className="h-9 w-auto" />
            <span className="font-heading text-xl font-bold text-foreground hidden sm:inline">Cagiotech</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#casos-uso" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Casos de Uso</a>
            <a href="#precos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Preços</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium hidden sm:inline-flex">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg shadow-orange-500/25">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
          <AnimatedBackground />
          
          <div className="container relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 animate-fade-in">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">Software de Gestão Fitness #1</span>
              </div>

              {/* Main headline - Pingback style */}
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight animate-fade-in [animation-delay:100ms]">
                <span className="text-white drop-shadow-lg">GESTÃO</span>
              </h1>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight animate-fade-in [animation-delay:200ms] mt-2">
                <span className="text-white/70 drop-shadow-md">PARA QUEM</span>
              </h1>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight animate-fade-in [animation-delay:300ms] mt-2">
                <span className="text-white/50 drop-shadow-sm">CRESCE</span>
              </h1>

              {/* CTA Button */}
              <div className="mt-12 animate-fade-in [animation-delay:400ms]">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="h-14 px-10 text-lg font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all hover:scale-105"
                  >
                    Testar Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Marquee */}
        <LogoMarquee />

        {/* Use Cases Section - Pingback style tags */}
        <section id="casos-uso" className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                A Cagiotech é para QUEM Faz:
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {['EDUCAÇÃO', 'CRM', 'INTEGRAÇÕES', 'AUTOMAÇÕES', 'PAGAMENTOS', 'TREINOS', 'NUTRIÇÃO', 'MARKETING'].map((tag, index) => (
                <div 
                  key={index}
                  className="px-6 py-3 rounded-full bg-card border border-border/50 text-foreground font-bold text-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Cards */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Casos de Uso</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Quer ver como tudo acontece na prática?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Explore os casos de uso que mostram o poder do Cagiotech em ação.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {useCases.map((useCase, index) => (
                <Card 
                  key={index} 
                  className="group cursor-pointer border-border/50 bg-card hover:bg-gradient-to-br hover:from-orange-500 hover:to-red-500 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground group-hover:text-white transition-colors">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-white/80 mt-1 transition-colors">{useCase.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="funcionalidades" className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Módulos</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Tudo num único lugar
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Todas as ferramentas que precisa para gerir o seu negócio fitness
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group border-border/50 bg-card hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  <CardContent className="p-6 relative">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className={`absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-3xl group-hover:opacity-25 transition-opacity duration-500`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-20">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Benefícios</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Mais controlo, menos stress
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className={`h-12 w-12 rounded-xl ${benefit.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precos" className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Preços</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Planos que se adaptam a você
              </h2>
              <p className="mt-3 text-muted-foreground">Planos flexíveis, completos e no tamanho do seu momento.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden transition-all duration-500 ${
                    plan.featured 
                      ? 'border-2 border-orange-500 bg-card shadow-2xl shadow-orange-500/20 lg:scale-105' 
                      : 'border-border/50 bg-card/50 hover:shadow-xl'
                  }`}
                >
                  {plan.featured && (
                    <>
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${plan.gradient}`} />
                      <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">Popular</Badge>
                    </>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-5xl font-black text-foreground">€{plan.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <div className={`h-5 w-5 rounded-full bg-gradient-to-br ${plan.featured ? 'from-orange-500 to-red-500' : 'from-emerald-500 to-teal-500'} flex items-center justify-center flex-shrink-0`}>
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/register" className="block">
                      <Button 
                        className={`w-full h-12 font-bold ${
                          plan.featured 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg' 
                            : ''
                        }`}
                        variant={plan.featured ? "default" : "outline"}
                      >
                        {plan.name === 'Enterprise' ? 'Contactar Vendas' : 'Começar Grátis'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">FAQ</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`} 
                    className="border border-border/50 rounded-2xl px-6 bg-card data-[state=open]:border-primary/30 data-[state=open]:shadow-lg transition-all"
                  >
                    <AccordionTrigger className="text-left font-bold hover:no-underline py-5 text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-white">
                Pronto para transformar a sua gestão?
              </h2>
              <p className="mt-6 text-xl text-white/80">
                Junte-se a centenas de academias que já confiam no Cagiotech.
              </p>
              <div className="mt-10">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="h-14 px-10 text-lg font-bold rounded-full bg-white text-orange-600 hover:bg-white/90 shadow-2xl transition-all hover:scale-105"
                  >
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="mt-4 text-white/60 text-sm">Sem cartão de crédito • Configuração em 5 minutos</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card">
        <div className="container py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Cagiotech" className="h-10 w-auto" />
                <span className="font-heading text-2xl font-bold text-foreground">Cagiotech</span>
              </Link>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Software de gestão completo para academias, boxes e estúdios fitness. 
                Simplifique a sua operação e foque no crescimento do seu negócio.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">Produto</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#funcionalidades" className="text-muted-foreground hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="text-muted-foreground hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de Serviço</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cagiotech. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Desenvolvido com 💙 por{" "}
              <a
                href="https://instagram.com/newdester.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium transition-colors"
              >
                Newdester
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
