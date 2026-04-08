const sanitizeText = (text: string, maxLength: number) => {
  return text
    .replace(/<[^>]*>?/gm, '') // remove HTML
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '') // remove caracteres perigosos
    .slice(0, maxLength)
    .trim();
};

const sanitizeDados = (dados: ContractData): ContractData => {
  return {
    ...dados,
    prestadorNome: sanitizeText(dados.prestadorNome, MAX_NAME_LENGTH),
    contratanteNome: sanitizeText(dados.contratanteNome, MAX_NAME_LENGTH),
    descricaoServico: sanitizeText(dados.descricaoServico, 2000),
    cidadeForo: sanitizeText(dados.cidadeForo, 100),
    clausulasAdicionais: (dados.clausulasAdicionais ?? []).map(c => ({
      titulo: sanitizeText(c.titulo || '', 100),
      texto: sanitizeText(c.texto, 1000),
    })),
  };
};

const saveContract = async (status: 'rascunho' | 'gerado') => {
  if (!user || !selectedType) return;

  setSaving(true);

  try {
    const tipoLabel =
      CONTRACT_TYPES.find(t => t.id === selectedType)?.label ?? selectedType;

    // 🔐 sanitiza tudo antes de salvar
    const dadosSeguros = sanitizeDados(dados);

    // 🔐 NÃO envia userId (RLS resolve isso no banco)
    await createContract({
      titulo: `${tipoLabel} — ${dadosSeguros.contratanteNome || 'Sem nome'}`,
      tipo: tipoLabel,
      dados: dadosSeguros,
      status,
    });

    // ⚠️ ideal: mover isso para backend (edge function futuramente)
    await incrementContractCount(user.id);

    toast({
      title: 'Contrato salvo!',
      description:
        status === 'gerado'
          ? 'Contrato gerado com sucesso.'
          : 'Rascunho salvo.',
    });

    navigate('/dashboard');
  } catch {
    toast({
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar o contrato.',
      variant: 'destructive',
    });
  } finally {
    setSaving(false);
  }
};
