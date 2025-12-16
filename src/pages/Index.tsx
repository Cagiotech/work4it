import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logo from '@/assets/logo-light.png';
import { 
  ArrowRight, 
  Play, 
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
  ChevronRight,
  Instagram,
  Heart
} from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Cagiotech" className="h-10 w-auto" />
            <span className="font-heading text-xl font-bold text-foreground">
              Cagiotech
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6 animate-fade-in">
                <Dumbbell className="h-4 w-4" />
                <span>Software de gestão para academias, boxes e estúdios fitness</span>
              </div>

              {/* Headline */}
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in [animation-delay:100ms]">
                <span className="text-foreground">Das planilhas ao</span>{' '}
                <span className="text-primary">controle total</span>{' '}
                <span className="text-foreground">do seu negócio fitness</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl mx-auto animate-fade-in [animation-delay:200ms]">
                O Cagiotech centraliza alunos, aulas, financeiro e equipa numa plataforma brasileira, 
                simples e completa – feita para quem quer gerir com excelência e sem stress.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in [animation-delay:300ms]">
                <Link to="/register">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-14 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    Começar Teste Grátis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="gap-2 h-14 text-base border-2">
                  <Play className="h-5 w-5" />
                  Ver Demonstração
                </Button>
              </div>

              {/* Trust Badge */}
              <p className="mt-6 text-sm text-muted-foreground animate-fade-in [animation-delay:400ms]">
                ✓ Sem cartão de crédito · ✓ Configuração em 5 minutos · ✓ Suporte incluído
              </p>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 animate-fade-in [animation-delay:500ms]">
              {[
                { value: '500+', label: 'Academias' },
                { value: '25k+', label: 'Alunos Geridos' },
                { value: '100k+', label: 'Aulas Agendadas' },
                { value: '99%', label: 'Satisfação' },
              ].map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-2xl bg-card/50 border border-border/50">
                  <div className="font-heading text-3xl font-bold text-primary sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="funcionalidades" className="py-20 lg:py-32 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">Módulos</Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Tudo que precisa para gerir o seu negócio fitness
              </h2>
              <p className="mt-4 text-muted-foreground">
                Centralize alunos, aulas, equipa e financeiro num único lugar
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  icon: Users, 
                  title: 'Gestão de Alunos',
                  description: 'Perfis completos, anamnese, planos de treino e nutrição, documentos e histórico.',
                  color: 'bg-blue-500'
                },
                { 
                  icon: Calendar, 
                  title: 'Aulas e Agendamentos',
                  description: 'Calendário visual, inscrições online, controlo de presenças e capacidade.',
                  color: 'bg-green-500'
                },
                { 
                  icon: DollarSign, 
                  title: 'Financeiro Completo',
                  description: 'Faturação automática, controlo de pagamentos, relatórios e exportação.',
                  color: 'bg-yellow-500'
                },
                { 
                  icon: UserCog, 
                  title: 'Recursos Humanos',
                  description: 'Gestão de equipa, horários, férias, folha de pagamento e avaliações.',
                  color: 'bg-purple-500'
                },
                { 
                  icon: Dumbbell, 
                  title: 'Planos de Treino',
                  description: 'Crie e atribua treinos personalizados com exercícios, séries e repetições.',
                  color: 'bg-red-500'
                },
                { 
                  icon: Apple, 
                  title: 'Nutrição',
                  description: 'Planos alimentares com macros, refeições detalhadas e acompanhamento.',
                  color: 'bg-orange-500'
                },
                { 
                  icon: BarChart3, 
                  title: 'Dashboard Analítico',
                  description: 'KPIs em tempo real, gráficos interativos e relatórios exportáveis em PDF.',
                  color: 'bg-cyan-500'
                },
                { 
                  icon: MessageSquare, 
                  title: 'Comunicação',
                  description: 'Chat integrado entre alunos, personal trainers e administração.',
                  color: 'bg-pink-500'
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
                >
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} text-white transition-transform group-hover:scale-110`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-20 lg:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">Benefícios</Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Mais controlo, menos stress. Mais tempo para o que importa.
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Clock, title: 'Poupe até 15h/semana', description: 'Automatize tarefas repetitivas e foque no crescimento do negócio.' },
                { icon: Shield, title: 'Dados Seguros', description: 'Encriptação de ponta a ponta e backups automáticos diários.' },
                { icon: Smartphone, title: 'App para Alunos', description: 'Os alunos acedem a treinos, aulas e pagamentos pelo telemóvel.' },
                { icon: BarChart3, title: 'Relatórios Completos', description: 'Tome decisões baseadas em dados com dashboards intuitivos.' },
                { icon: Users, title: 'Multi-Utilizador', description: 'Permissões granulares por função para toda a equipa.' },
                { icon: Star, title: 'Suporte Premium', description: 'Equipa de suporte em português disponível para ajudar.' },
              ].map((benefit, index) => (
                <div key={index} className="flex gap-4 p-6 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precos" className="py-20 lg:py-32 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">Preços</Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Planos que crescem com o seu negócio
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sem taxas escondidas. Cancele quando quiser.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
              {/* Starter Plan */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Starter</CardTitle>
                  <CardDescription>Para academias em crescimento</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">€29</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Até 100 alunos',
                      'Gestão de aulas',
                      'Dashboard básico',
                      'Suporte por email',
                      '1 utilizador admin',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="block">
                    <Button variant="outline" className="w-full mt-4">
                      Começar Grátis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Plan - Featured */}
              <Card className="border-primary bg-card relative overflow-hidden shadow-xl shadow-primary/10 scale-105">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Professional</CardTitle>
                  <CardDescription>Para academias estabelecidas</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">€79</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Até 500 alunos',
                      'Todos os módulos',
                      'Dashboard avançado',
                      'App para alunos',
                      'Suporte prioritário',
                      '5 utilizadores admin',
                      'Relatórios PDF',
                      'Integrações',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="block">
                    <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                      Começar Grátis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Enterprise</CardTitle>
                  <CardDescription>Para redes e franchises</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">€199</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      'Alunos ilimitados',
                      'Multi-unidades',
                      'API personalizada',
                      'Gestor de conta dedicado',
                      'SLA garantido',
                      'Utilizadores ilimitados',
                      'White-label disponível',
                      'Onboarding personalizado',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-4">
                    Contactar Vendas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 lg:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="outline" className="mb-4 text-primary border-primary/30">FAQ</Badge>
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Principais Dúvidas
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {[
                  {
                    question: 'Posso testar antes de pagar?',
                    answer: 'Sim! Oferecemos 14 dias de teste grátis em todos os planos, sem necessidade de cartão de crédito. Experimente todas as funcionalidades antes de decidir.'
                  },
                  {
                    question: 'Quanto tempo leva para começar a usar?',
                    answer: 'A configuração inicial leva cerca de 5 minutos. O sistema é intuitivo e temos tutoriais em vídeo para todas as funcionalidades. A maioria dos clientes está operacional em menos de 24 horas.'
                  },
                  {
                    question: 'Os meus dados estão seguros?',
                    answer: 'Absolutamente. Utilizamos encriptação de ponta a ponta, backups automáticos diários e os nossos servidores estão em conformidade com RGPD. Os seus dados nunca são partilhados com terceiros.'
                  },
                  {
                    question: 'Posso importar dados de outras plataformas?',
                    answer: 'Sim! Suportamos importação de alunos via CSV ou Excel. A nossa equipa de suporte pode ajudar no processo de migração sem custo adicional.'
                  },
                  {
                    question: 'O app funciona em qualquer dispositivo?',
                    answer: 'Sim. O Cagiotech funciona em computador, tablet e telemóvel. Os alunos também têm acesso a uma app dedicada para iOS e Android.'
                  },
                  {
                    question: 'Posso cancelar a qualquer momento?',
                    answer: 'Claro! Não há fidelização nem taxas de cancelamento. Pode cancelar a subscrição a qualquer momento directamente no painel de configurações.'
                  },
                  {
                    question: 'Como funciona o suporte?',
                    answer: 'Oferecemos suporte em português via chat e email. No plano Professional e Enterprise, o suporte é prioritário com tempo de resposta garantido em até 4 horas.'
                  },
                  {
                    question: 'É possível personalizar com a minha marca?',
                    answer: 'Sim! No plano Enterprise oferecemos opção white-label completa. Nos outros planos, pode personalizar cores e adicionar o logótipo da sua academia.'
                  },
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-xl px-6 bg-card/50">
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
        <section className="py-20 lg:py-32 bg-primary/5 border-y border-primary/10">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Pronto para transformar a gestão da sua academia?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Junte-se a centenas de academias que já simplificaram a sua gestão com o Cagiotech.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-14 text-base font-semibold shadow-lg shadow-primary/25">
                    Começar Agora - É Grátis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Configuração em 5 minutos · Sem cartão de crédito · Suporte incluído
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-12">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Cagiotech" className="h-8 w-auto" />
                <span className="font-heading text-lg font-bold text-foreground">Cagiotech</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Software de gestão completo para academias, boxes e estúdios fitness.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#precos" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Serviço</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">RGPD</a></li>
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
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Desenvolvido com <Heart className="h-4 w-4 text-blue-500 fill-blue-500" /> por{' '}
              <span className="font-medium text-foreground">Newdester</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;