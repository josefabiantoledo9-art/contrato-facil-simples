import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserContracts, deleteContract, ContractListItem } from '@/services/contracts';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { fetchUserProfile, UserProfile } from '@/services/profiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Plus, LogOut, Crown, Clock, CheckCircle2, Trash2, Search } from 'lucide-react';
import PricingModal from '@/components/PricingModal';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contratos, setContratos] = useState<ContractListItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContractListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadContracts = async (p: number, q: string) => {
    if (!user) return;
    try {
      const result = await fetchUserContracts(user.id, p, PAGE_SIZE, q);
      setContratos(result.data);
      setTotalCount(result.count);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar seus contratos. Tente novamente.', variant: 'destructive' });
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContract(deleteTarget.id, user.id);
      toast({ title: 'Contrato excluído', description: 'O contrato foi removido com sucesso.' });
      await loadContracts(page);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir o contrato.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [profileData, contratosResult] = await Promise.all([
          fetchUserProfile(user.id),
          fetchUserContracts(user.id, page, PAGE_SIZE),
        ]);
        if (profileData) setProfile(profileData);
        setContratos(contratosResult.data);
        setTotalCount(contratosResult.count);
      } catch {
        toast({ title: 'Erro', description: 'Erro ao carregar seus contratos. Tente novamente.', variant: 'destructive' });
      }
    };
    loadData();
  }, [user, page]);

  const maxContratos = profile?.plano === 'free' ? 3 : 999;
  const isFreeLimitReached = profile?.plano === 'free' && (profile?.contratos_mes ?? 0) >= 3;

  const handleNewContract = () => {
    if (isFreeLimitReached) {
      setPricingOpen(true);
    } else {
      navigate('/novo-contrato');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">ContratoFácil</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
                <Button size="sm" variant="outline" onClick={() => setPricingOpen(true)}>
                  Fazer upgrade
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Button size="lg" className="w-full sm:w-auto mb-8 bg-success hover:bg-success/90 text-success-foreground" onClick={handleNewContract}>
          <Plus className="h-5 w-5 mr-2" />
          Novo contrato
        </Button>

        <h2 className="text-lg font-semibold text-foreground mb-4">Seus contratos</h2>
        {contratos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum contrato ainda. Crie seu primeiro contrato!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {contratos.map(c => (
                <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/contrato/${c.id}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.titulo}</p>
                        <p className="text-sm text-muted-foreground">{c.tipo} • {new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === 'gerado' ? 'default' : 'secondary'} className={c.status === 'gerado' ? 'bg-success text-success-foreground' : ''}>
                        {c.status === 'gerado' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {c.status === 'gerado' ? 'Gerado' : 'Rascunho'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
