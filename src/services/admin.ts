import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  user_id: string;
  email: string | null;
  plano: string;
  contratos_mes: number;
  created_at: string;
}

export interface AdminContract {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

// Check if current user is admin
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return !!data;
}

// Fetch all contracts (admin only - RLS enforces this)
export async function fetchAllContracts(
  page = 1,
  pageSize = 20,
  search = '',
): Promise<{ data: AdminContract[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('contratos')
    .select('id, titulo, tipo, status, created_at, user_id', { count: 'exact' });

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`titulo.ilike.${term},tipo.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error(error);
    throw new Error('Erro ao carregar contratos.');
  }

  return { data: (data ?? []) as AdminContract[], count: count ?? 0 };
}

// Fetch all profiles (admin only - RLS enforces this)
export async function fetchAllProfiles(
  page = 1,
  pageSize = 20,
): Promise<{ data: AdminUser[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('user_id, email, plano, contratos_mes, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error(error);
    throw new Error('Erro ao carregar usuários.');
  }

  return { data: (data ?? []) as AdminUser[], count: count ?? 0 };
}

// Admin delete contract
export async function adminDeleteContract(contractId: string): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', contractId);

  if (error) {
    console.error(error);
    throw new Error('Erro ao excluir contrato.');
  }
}

// Get admin stats
export async function fetchAdminStats(): Promise<{
  totalContracts: number;
  totalUsers: number;
}> {
  const [contractsRes, usersRes] = await Promise.all([
    supabase.from('contratos').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalContracts: contractsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
  };
}
