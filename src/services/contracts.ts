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

export async function fetchUserContracts(
  userId: string,
  page = 1,
  pageSize = 10,
): Promise<PaginatedContracts> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('contratos')
    .select(SAFE_CONTRACT_COLUMNS, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
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

export async function deleteContract(contractId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', contractId)
    .eq('user_id', userId);

  if (error) throw new Error('Erro ao excluir contrato.');
}
