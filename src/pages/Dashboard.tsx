import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserContracts, deleteContract, ContractListItem, SortField, SortDir } from '@/services/contracts';
import { fetchUserProfile, UserProfile } from '@/services/profiles';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import PricingModal from '@/components/PricingModal';
import ContractsChart from '@/components/ContractsChart';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import ContractList from '@/components/dashboard/ContractList';

const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user } = useAuth();
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
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [profileData, contratosResult] = await Promise.all([
          fetchUserProfile(user.id),
          fetchUserContracts(user.id, page, PAGE_SIZE, searchDebounced, sortField, sortDir),
        ]);
        if (profileData) setProfile(profileData);
        setContratos(contratosResult.data);
        setTotalCount(contratosResult.count);
      } catch {
        toast({ title: 'Erro', description: 'Erro ao carregar seus contratos. Tente novamente.', variant: 'destructive' });
      }
    };
    loadData();
  }, [user, page, searchDebounced, sortField, sortDir]);

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContract(deleteTarget.id, user.id);
      toast({ title: 'Contrato excluído', description: 'O contrato foi removido com sucesso.' });
      const result = await fetchUserContracts(user.id, page, PAGE_SIZE, searchDebounced, sortField, sortDir);
      setContratos(result.data);
      setTotalCount(result.count);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir o contrato.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const isFreeLimitReached = profile?.plano === 'free' && (profile?.contratos_mes ?? 0) >= 3;

  const handleNewContract = () => {
    if (isFreeLimitReached) {
      setPricingOpen(true);
    } else {
      navigate('/novo-contrato');
    }
  };

  const handleSortChange = (field: SortField, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <StatsCards profile={profile} onUpgradeClick={() => setPricingOpen(true)} />

        <Button size="lg" className="w-full sm:w-auto mb-8 bg-success hover:bg-success/90 text-success-foreground" onClick={handleNewContract}>
          <Plus className="h-5 w-5 mr-2" />
          Novo contrato
        </Button>

        <ContractsChart contratos={contratos} />

        <ContractList
          contratos={contratos}
          search={search}
          onSearchChange={setSearch}
          sortField={sortField}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onDeleteClick={setDeleteTarget}
        />
      </main>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

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
