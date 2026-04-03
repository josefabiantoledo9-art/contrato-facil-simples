import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Shield, Zap, CheckCircle2 } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">ContratoFácil</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/auth')}>Entrar</Button>
          <Button onClick={() => navigate('/auth')}>Criar conta</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 sm:py-24 text-center max-w-3xl">
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight">
          Contratos profissionais em <span className="text-primary">minutos</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Gere contratos jurídicos prontos para uso. Ideal para freelancers e pequenas empresas brasileiras.
        </p>
        <Button size="lg" className="mt-8 bg-success hover:bg-success/90 text-success-foreground" onClick={() => navigate('/auth')}>
          Começar grátis <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: 'Rápido', desc: 'Preencha os dados e tenha seu contrato pronto em 3 etapas simples.' },
            { icon: Shield, title: 'Seguro', desc: 'Textos em português jurídico com cláusulas padrão do mercado.' },
            { icon: CheckCircle2, title: 'Profissional', desc: 'PDF formatado pronto para assinar e enviar ao seu cliente.' },
          ].map(f => (
            <div key={f.title} className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">{f.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ContratoFácil — Todos os direitos reservados.
      </footer>
    </div>
  );
}
