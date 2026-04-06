import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  plano: string;
  contratos_mes: number;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('plano, contratos_mes')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function incrementContractCount(userId: string): Promise<void> {
  const profile = await fetchUserProfile(userId);
  const current = profile?.contratos_mes ?? 0;

  const { error } = await supabase
    .from('profiles')
    .update({ contratos_mes: current + 1 })
    .eq('user_id', userId);

  if (error) throw new Error('Erro ao atualizar perfil.');
}
