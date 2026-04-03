import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    popular: false,
    features: ['3 contratos por mês', 'Marca d\'água no PDF', '2 tipos de contrato'],
  },
  {
    name: 'Pro',
    price: 'R$ 29',
    period: '/mês',
    popular: true,
    features: ['Contratos ilimitados', 'Sem marca d\'água', 'Todos os 6 tipos', 'Histórico completo', 'Download em PDF e Word'],
  },
  {
    name: 'Agência',
    price: 'R$ 79',
    period: '/mês',
    popular: false,
    features: ['Tudo do Pro', 'Até 5 usuários', 'Logo própria no cabeçalho', 'Templates personalizáveis'],
  },
];

export default function PricingModal({ open, onClose }: PricingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Escolha seu plano</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border-2 p-6 flex flex-col ${
                plan.popular ? 'border-primary bg-primary/5 shadow-lg' : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={`mt-6 w-full ${plan.popular ? 'bg-primary' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                {plan.name === 'Grátis' ? 'Plano atual' : 'Fazer upgrade'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
