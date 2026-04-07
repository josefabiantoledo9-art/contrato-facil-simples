import { UserProfile } from '@/services/profiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Crown } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
  onUpgradeClick: () => void;
}

export default function StatsCards({ profile, onUpgradeClick }: Props) {
  const maxContratos = profile?.plano === 'free' ? 3 : 999;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <Card className="flex-1">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contratos este mês</p>
            <p className="text-lg font-semibold text-foreground">
              {profile?.contratos_mes ?? 0} de {maxContratos === 999 ? '∞' : maxContratos}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="text-lg font-semibold text-foreground capitalize">{profile?.plano ?? 'free'}</p>
            </div>
          </div>
          {profile?.plano === 'free' && (
            <Button size="sm" variant="outline" onClick={onUpgradeClick}>
              Fazer upgrade
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
