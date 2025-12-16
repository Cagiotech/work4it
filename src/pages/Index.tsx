import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
  Instagram,
  Heart,
  Zap
} from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Users, title: 'Gestão de Alunos', description: 'Perfis completos com anamnese, treinos e nutrição.' },
    { icon: Calendar, title: 'Aulas e Agenda', description: 'Calendário visual com inscrições e presenças.' },
    { icon: DollarSign, title: 'Financeiro', description: 'Faturação automática e controlo de pagamentos.' },
    { icon: UserCog, title: 'Recursos Humanos', description: 'Equipa, horários, férias e folha de pagamento.' },
    { icon: Dumbbell, title: 'Planos de Treino', description: 'Treinos personalizados para cada aluno.' },
    { icon: Apple, title: 'Nutrição', description: 'Planos alimentares com macros detalhados.' },
    { icon: BarChart3, title: 'Dashboard', description: 'KPIs em tempo real e relatórios PDF.' },
    { icon: MessageSquare, title: 'Comunicação', description: 'Chat integrado entre toda a equipa.' },
  ];

  const benefits = [
    { icon: Clock, title: 'Poupe 15h/semana', description: 'Automatize tarefas repetitivas.' },
    { icon: Shield, title: 'Dados Seguros', description: 'Encriptação e backups diários.' },
    { icon: Smartphone, title: 'App para Alunos', description: 'Acesso mobile a treinos e aulas.' },
    { icon: BarChart3, title: 'Relatórios', description: 'Decisões baseadas em dados.' },
    { icon: Users, title: 'Multi-Utilizador', description: 'Permissões por função.' },
    { icon: Star, title: 'Suporte Premium', description: 'Ajuda em português.' },
  ];

  const plans = [
    {
      name: 'Starter',
      description: 'Para academias em crescimento',
      price: '29',
      features: ['Até 100 alunos', 'Gestão de aulas', 'Dashboard básico', 'Suporte por email', '1 utilizador admin'],
      featured: false
    },
    {
      name: 'Professional',
      description: 'Para academias estabelecidas',
      price: '79',
      features: ['Até 500 alunos', 'Todos os módulos', 'Dashboard avançado', 'App para alunos', 'Suporte prioritário', '5 utilizadores admin', 'Relatórios PDF'],
      featured: true
    },
    {
      name: 'Enterprise',
      description: 'Para redes e franchises',
      price: '199',
      features: ['Alunos ilimitados', 'Multi-unidades', 'API personalizada', 'Gestor dedicado', 'SLA garantido', 'Utilizadores ilimitados', 'White-label'],
      featured: false
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Cagiotech" className="h-9 w-auto" />
            <span className="font-heading text-xl font-bold text-foreground">Cagiotech</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Benefícios</a>
            <a href="#precos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Preços</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="font-medium">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[100px]" />
          
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium animate-fade-in">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Software de gestão fitness
              </Badge>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight animate-fade-in [animation-delay:100ms]">
                <span className="text-foreground">Das planilhas ao </span>
                <span className="text-gradient">controlo total</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
                Centralize alunos, aulas, financeiro e equipa numa plataforma simples e completa – feita para quem quer gerir com excelência.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in [animation-delay:300ms]">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-primary">
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="mt-4 text-sm text-muted-foreground animate-fade-in [animation-delay:400ms]">
                Sem cartão de crédito • Configuração em 5 minutos
              </p>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in [animation-delay:500ms]">
              {[
                { value: '500+', label: 'Academias' },
                { value: '25k+', label: 'Alunos' },
                { value: '100k+', label: 'Aulas' },
                { value: '99%', label: 'Satisfação' },
              ].map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-xl bg-card border border-border/50">
                  <div className="font-heading text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="funcionalidades" className="py-20 lg:py-28 bg-muted/30">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Módulos</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Tudo num único lugar
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Todas as ferramentas que precisa para gerir o seu negócio fitness
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="group border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-20 lg:py-28">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Benefícios</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Mais controlo, menos stress
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-5 rounded-xl bg-muted/30 border border-border/50">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precos" className="py-20 lg:py-28 bg-muted/30">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Preços</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Planos simples e transparentes
              </h2>
              <p className="mt-3 text-muted-foreground">Sem taxas escondidas. Cancele quando quiser.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden transition-all duration-300 ${
                    plan.featured 
                      ? 'border-primary bg-card shadow-xl shadow-primary/10 lg:scale-105' 
                      : 'border-border/50 bg-card/50'
                  }`}
                >
                  {plan.featured && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                      <Badge className="absolute top-4 right-4">Popular</Badge>
                    </>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-3">
                      <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/register" className="block">
                      <Button 
                        variant={plan.featured ? "default" : "outline"} 
                        className="w-full"
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
        <section id="faq" className="py-20 lg:py-28">
          <div className="container">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">FAQ</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-xl px-5 bg-card data-[state=open]:border-primary/30">
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Pronto para transformar a sua gestão?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Junte-se a centenas de academias que já confiam no Cagiotech.
              </p>
              <div className="mt-8">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-primary">
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50">
        <div className="container py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Cagiotech" className="h-8 w-auto" />
                <span className="font-heading text-lg font-bold text-foreground">Cagiotech</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Software de gestão completo para academias, boxes e estúdios fitness.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#funcionalidades" className="text-muted-foreground hover:text-primary transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="text-muted-foreground hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contacto</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de Serviço</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Cagiotech. Todos os direitos reservados.
            </p>
            <a 
              href="https://instagram.com/newdester.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Desenvolvido com <Heart className="h-3.5 w-3.5 text-destructive fill-destructive" /> por 
              <span className="font-medium">Newdester</span>
              <Instagram className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
