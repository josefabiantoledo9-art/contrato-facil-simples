import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, ShieldCheck } from 'lucide-react';

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">ContratoFácil</span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-1">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Button>
          )}
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
