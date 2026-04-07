import { supabase } from '@/integrations/supabase/client';
import type { ContractData } from '@/lib/contract-templates';
import type { Json } from '@/integrations/supabase/types';

const SAFE_CONTRACT_COLUMNS = 'id, titulo, tipo, status, created_at' as const;
const DETAIL_CONTRACT_COLUMNS = 'titulo, tipo, status, dados, created_at' as const;

export interface ContractListItem {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  created_at: string;
}

export interface ContractDetail {
  titulo: string;
  tipo: string;
  status: string;
  dados: ContractData;
  created_at: string;
}

export interface PaginatedContracts {
  data: ContractListItem[];
  count: number;
}

export type SortField = 'created_at' | 'titulo' | 'status';
export type SortDir = 'asc' | 'desc';

export async function fetchUserContracts(
  userId: string,
  page = 1,
  pageSize = 10,
  search = '',
  sortField: SortField = 'created_at',
  sortDir: SortDir = 'desc',
): Promise<PaginatedContracts> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('contratos')
    .select(SAFE_CONTRACT_COLUMNS, { count: 'exact' })
    .eq('user_id', userId);

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`titulo.ilike.${term},tipo.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order(sortField, { ascending: sortDir === 'asc' })
    .range(from, to);

  if (error) throw new Error('Erro ao carregar contratos.');
  return { data: data ?? [], count: count ?? 0 };
}

export async function fetchContractById(contractId: string, userId: string): Promise<ContractDetail | null> {
  const { data, error } = await supabase
    .from('contratos')
    .select(DETAIL_CONTRACT_COLUMNS)
    .eq('id', contractId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return { ...data, dados: data.dados as unknown as ContractData };
}

export async function createContract(params: {
  userId: string;
  titulo: string;
  tipo: string;
  dados: ContractData;
  status: 'rascunho' | 'gerado';
}): Promise<void> {
  const { error } = await supabase.from('contratos').insert({
    user_id: params.userId,
    titulo: params.titulo.slice(0, 200),
    tipo: params.tipo.slice(0, 100),
    dados: params.dados as unknown as Json,
    status: params.status,
  });

  if (error) throw new Error('Erro ao salvar contrato.');
}

export async function updateContract(
  contractId: string,
  userId: string,
  updates: { titulo?: string; tipo?: string; dados?: ContractData; status?: 'rascunho' | 'gerado' },
): Promise<void> {
  const sanitized: Record<string, unknown> = {};
  if (updates.titulo !== undefined) sanitized.titulo = updates.titulo.slice(0, 200);
  if (updates.tipo !== undefined) sanitized.tipo = updates.tipo.slice(0, 100);
  if (updates.dados !== undefined) sanitized.dados = updates.dados as unknown as Json;
  if (updates.status !== undefined) sanitized.status = updates.status;

  const { error } = await supabase
    .from('contratos')
    .update(sanitized)
    .eq('id', contractId)
    .eq('user_id', userId);

  if (error) throw new Error('Erro ao atualizar contrato.');
}

export async function deleteContract(contractId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', contractId)
    .eq('user_id', userId);

  if (error) throw new Error('Erro ao excluir contrato.');
}
