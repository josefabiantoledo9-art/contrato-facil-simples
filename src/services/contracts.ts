import { supabase } from '@/integrations/supabase/client';
import type { ContractData } from '@/lib/contract-templates';
import type { Json } from '@/integrations/supabase/types';

const SAFE_CONTRACT_COLUMNS = 'id, titulo, tipo, status, created_at' as const;
const DETAIL_CONTRACT_COLUMNS = 'titulo, tipo, status, dados, created_at' as const;

// 🔐 Sanitização central
function sanitizeText(text: string, max: number) {
  return text
    .replace(/<[^>]*>?/gm, '')
    .slice(0, max)
    .trim();
}

// 🔐 Sanitização de dados
function sanitizeDados(dados: ContractData): Json {
  return {
    ...dados,
    prestadorNome: sanitizeText(dados.prestadorNome, 200),
    contratanteNome: sanitizeText(dados.contratanteNome, 200),
    descricaoServico: sanitizeText(dados.descricaoServico, 2000),
    cidadeForo: sanitizeText(dados.cidadeForo, 100),
  } as unknown as Json;
}

// 🔍 LISTAR (RLS já protege — não precisa userId)
export async function fetchUserContracts(
  page = 1,
  pageSize = 10,
  search = '',
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
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error('Erro ao carregar contratos.');
  return { data: data ?? [], count: count ?? 0 };
}

// 🔍 DETALHE
export async function fetchContractById(contractId: string) {
  const { data, error } = await supabase
    .from('contratos')
    .select(DETAIL_CONTRACT_COLUMNS)
    .eq('id', contractId)
    .single();

  if (error || !data) return null;
  return data;
}

// ➕ CRIAR
export async function createContract(params: {
  titulo: string;
  tipo: string;
  dados: ContractData;
  status: 'rascunho' | 'gerado';
}) {
  const { error } = await supabase.from('contratos').insert({
    // 🔐 NÃO passa user_id (RLS resolve)
    titulo: sanitizeText(params.titulo, 200),
    tipo: sanitizeText(params.tipo, 100),
    dados: sanitizeDados(params.dados),
    status: params.status,
  });

  if (error) throw new Error('Erro ao salvar contrato.');
}

// ✏️ UPDATE
export async function updateContract(
  contractId: string,
  updates: { titulo?: string; tipo?: string; dados?: ContractData; status?: 'rascunho' | 'gerado' },
) {
  const sanitized: any = {};

  if (updates.titulo) sanitized.titulo = sanitizeText(updates.titulo, 200);
  if (updates.tipo) sanitized.tipo = sanitizeText(updates.tipo, 100);
  if (updates.dados) sanitized.dados = sanitizeDados(updates.dados);
  if (updates.status) sanitized.status = updates.status;

  const { error } = await supabase
    .from('contratos')
    .update(sanitized)
    .eq('id', contractId);

  if (error) throw new Error('Erro ao atualizar contrato.');
}

// ❌ DELETE
export async function deleteContract(contractId: string) {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', contractId);

  if (error) throw new Error('Erro ao excluir contrato.');
}
