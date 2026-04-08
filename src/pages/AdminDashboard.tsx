import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { fetchAllContracts, fetchAllProfiles, adminDeleteContract, fetchAdminStats, AdminContract, AdminUser } from '@/services/admin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowLeft, FileText, Users, Trash2, Search, ShieldCheck, CheckCircle2, Clock, BarChart3 } from 'lucide-react';

const PAGE_SIZE = 15;

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [contractsCount, setContractsCount] = useState(0);
  const [contractPage, setContractPage] = useState(1);
  const [contractSearch, setContractSearch] = useState('');
  const [contractSearchDebounced, setContractSearchDebounced] = useState('');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [userPage, setUserPage] = useState(1);

  const [stats, setStats] = useState({ totalContracts: 0, totalUsers: 0 });
  const [deleteTarget, setDeleteTarget] = useState<AdminContract | null>(null);
  const [deleting, setDeleting] = useState(false);

  const contractTotalPages = Math.max(1, Math.ceil(contractsCount / PAGE_SIZE));
  const userTotalPages = Math.max(1, Math.ceil(usersCount / PAGE_SIZE));

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setContractSearchDebounced(contractSearch);
      setContractPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [contractSearch]);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para acessar esta área.', variant: 'destructive' });
      navigate('/dashboard');
    }
  }, [adminLoading, isAdmin]);

  // Load stats
  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminStats().then(setStats).catch(console.error);
  }, [isAdmin]);

  // Load contracts
  useEffect(() => {
    if (!isAdmin) return;
    fetchAllContracts(contractPage, PAGE_SIZE, contractSearchDebounced)
      .then(({ data, count }) => { setContracts(data); setContractsCount(count); })
      .catch(() => toast({ title: 'Erro', description: 'Erro ao carregar contratos.', variant: 'destructive' }));
  }, [isAdmin, contractPage, contractSearchDebounced]);

  // Load users
  useEffect(() => {
    if (!isAdmin) return;
    fetchAllProfiles(userPage, PAGE_SIZE)
      .then(({ data, count }) => { setUsers(data); setUsersCount(count); })
      .catch(() => toast({ title: 'Erro', description: 'Erro ao carregar usuários.', variant: 'destructive' }));
  }, [isAdmin, userPage]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteContract(deleteTarget.id);
      toast({ title: 'Contrato excluído', description: 'Contrato removido com sucesso.' });
      const result = await fetchAllContracts(contractPage, PAGE_SIZE, contractSearchDebounced);
      setContracts(result.data);
      setContractsCount(result.count);
      fetchAdminStats().then(setStats);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir o contrato.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">Painel Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalContracts}</p>
                <p className="text-sm text-muted-foreground">Contratos totais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/50 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalUsers > 0 ? (stats.totalContracts / stats.totalUsers).toFixed(1) : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Média por usuário</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="contracts">
          <TabsList className="mb-4">
            <TabsTrigger value="contracts" className="gap-2">
              <FileText className="h-4 w-4" /> Contratos
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Usuários
            </TabsTrigger>
          </TabsList>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou tipo..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
              <span className="text-sm text-muted-foreground">{contractsCount} contratos</span>
            </div>

            {contracts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum contrato encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{c.titulo}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.tipo} • {new Date(c.created_at).toLocaleDateString('pt-BR')} • Dono: {c.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge
                          variant={c.status === 'gerado' ? 'default' : 'secondary'}
                          className={c.status === 'gerado' ? 'bg-success text-success-foreground' : ''}
                        >
                          {c.status === 'gerado' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {c.status === 'gerado' ? 'Gerado' : 'Rascunho'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {contractTotalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setContractPage(Math.max(1, contractPage - 1))}
                      className={contractPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: contractTotalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - contractPage) <= 2 || p === 1 || p === contractTotalPages)
                    .map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === contractPage} onClick={() => setContractPage(p)} className="cursor-pointer">
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setContractPage(Math.min(contractTotalPages, contractPage + 1))}
                      className={contractPage >= contractTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground">{usersCount} usuários cadastrados</span>
            </div>

            {users.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum usuário encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <Card key={u.user_id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.email ?? 'Sem email'}</p>
                          <p className="text-xs text-muted-foreground">
                            Cadastro: {new Date(u.created_at).toLocaleDateString('pt-BR')} • {u.contratos_mes} contratos este mês
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{u.plano}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {userTotalPages > 1 && (
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setUserPage(Math.max(1, userPage - 1))}
                      className={userPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: userTotalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - userPage) <= 2 || p === 1 || p === userTotalPages)
                    .map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === userPage} onClick={() => setUserPage(p)} className="cursor-pointer">
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setUserPage(Math.min(userTotalPages, userPage + 1))}
                      className={userPage >= userTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.titulo}&quot;? Esta ação não pode ser desfeita.
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
