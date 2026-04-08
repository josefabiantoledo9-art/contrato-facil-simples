import { supabase } from '@/integrations/supabase/client';
import type { ContractData } from '@/lib/contract-templates';
import type { Json } from '@/integrations/supabase/types';

// 🔐 Tipos exportados
export type ContractListItem = {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
  created_at: string;
};

export type ContractDetailData = {
  titulo: string;
  tipo: string;
  status: string;
  dados: ContractData;
  created_at: string;
};

export type SortField = 'created_at' | 'titulo' | 'status';
export type SortDir = 'asc' | 'desc';

// Alias for backward compat
export type { ContractDetailData as ContractDetail };

const SAFE_CONTRACT_COLUMNS = 'id, titulo, tipo, status, created_at' as const;
const DETAIL_CONTRACT_COLUMNS = 'titulo, tipo, status, dados, created_at' as const;

// 🔐 Sanitização segura
function sanitizeText(text: string | undefined | null, max: number) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '')
    .slice(0, max)
    .trim();
}

function sanitizeDados(dados: ContractData): Json {
  return {
    ...dados,
    prestadorNome: sanitizeText(dados?.prestadorNome, 200),
    contratanteNome: sanitizeText(dados?.contratanteNome, 200),
    descricaoServico: sanitizeText(dados?.descricaoServico, 2000),
    cidadeForo: sanitizeText(dados?.cidadeForo, 100),
  } as unknown as Json;
}

// 🔍 LISTAR
export async function fetchUserContracts(
  userId: string,
  page = 1,
  pageSize = 10,
  search = '',
  sortField: SortField = 'created_at',
  sortDir: SortDir = 'desc',
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('contratos')
    .select(SAFE_CONTRACT_COLUMNS, { count: 'exact' });

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`titulo.ilike.${term},tipo.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order(sortField, { ascending: sortDir === 'asc' })
    .range(from, to);

  if (error) {
    console.error(error);
    throw new Error('Erro ao carregar contratos.');
  }

  return { data: (data ?? []) as ContractListItem[], count: count ?? 0 };
}

// 🔍 DETALHE
export async function fetchContractById(contractId: string, userId: string) {
  const { data, error } = await supabase
    .from('contratos')
    .select(DETAIL_CONTRACT_COLUMNS)
    .eq('id', contractId)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as unknown as ContractDetailData | null;
}

// ➕ CRIAR
export async function createContract(params: {
  userId: string;
  titulo: string;
  tipo: string;
  dados: ContractData;
  status: 'rascunho' | 'gerado';
}) {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase.from('contratos').insert({
    user_id: userData.user.id,
    titulo: sanitizeText(params.titulo, 200),
    tipo: sanitizeText(params.tipo, 100),
    dados: sanitizeDados(params.dados),
    status: params.status,
  });

  if (error) {
    console.error(error);
    throw new Error('Erro ao salvar contrato.');
  }
}

// ✏️ UPDATE
export async function updateContract(
  contractId: string,
  updates: {
    titulo?: string;
    tipo?: string;
    dados?: ContractData;
    status?: 'rascunho' | 'gerado';
  },
) {
  const sanitized: Record<string, unknown> = {};

  if (updates.titulo) sanitized.titulo = sanitizeText(updates.titulo, 200);
  if (updates.tipo) sanitized.tipo = sanitizeText(updates.tipo, 100);
  if (updates.dados) sanitized.dados = sanitizeDados(updates.dados);
  if (updates.status) sanitized.status = updates.status;

  const { error } = await supabase
    .from('contratos')
    .update(sanitized)
    .eq('id', contractId);

  if (error) {
    console.error(error);
    throw new Error('Erro ao atualizar contrato.');
  }
}

// ❌ DELETE
export async function deleteContract(contractId: string, userId: string) {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', contractId);

  if (error) {
    console.error(error);
    throw new Error('Erro ao excluir contrato.');
  }
}
