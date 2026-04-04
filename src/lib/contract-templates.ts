export const CONTRACT_TYPES = [
  { id: 'prestacao-servico', label: 'Prestação de Serviço', icon: 'Briefcase', description: 'Contrato para prestação de serviços em geral' },
  { id: 'desenvolvimento-software', label: 'Desenvolvimento de Software', icon: 'Code', description: 'Contrato para projetos de desenvolvimento' },
  { id: 'criacao-conteudo', label: 'Criação de Conteúdo / Design', icon: 'Palette', description: 'Contrato para criação de conteúdo e design' },
  { id: 'consultoria', label: 'Consultoria', icon: 'Users', description: 'Contrato de consultoria empresarial' },
  { id: 'nda', label: 'NDA (Acordo de Sigilo)', icon: 'Lock', description: 'Acordo de confidencialidade e sigilo' },
  { id: 'parceria-comercial', label: 'Parceria Comercial', icon: 'Handshake', description: 'Contrato de parceria entre empresas' },
] as const;

export type ContractType = typeof CONTRACT_TYPES[number]['id'];

export interface ContractData {
  prestadorNome: string;
  prestadorDocumento: string;
  prestadorEndereco: string;
  contratanteNome: string;
  contratanteDocumento: string;
  contratanteEndereco: string;
  descricaoServico: string;
  valorTotal: string;
  formaPagamento: 'avista' | 'parcelado' | 'mensal';
  dataInicio: string;
  prazoEntrega: string;
  multaRescisao: string;
  cidadeForo: string;
}

export const INITIAL_CONTRACT_DATA: ContractData = {
  prestadorNome: '',
  prestadorDocumento: '',
  prestadorEndereco: '',
  contratanteNome: '',
  contratanteDocumento: '',
  contratanteEndereco: '',
  descricaoServico: '',
  valorTotal: '',
  formaPagamento: 'avista',
  dataInicio: '',
  prazoEntrega: '',
  multaRescisao: '10',
  cidadeForo: '',
};

export function generateContractText(tipo: ContractType, dados: ContractData): string {
  const tipoLabel = CONTRACT_TYPES.find(t => t.id === tipo)?.label ?? tipo;
  const pagamentoLabel = dados.formaPagamento === 'avista' ? 'à vista' : dados.formaPagamento === 'parcelado' ? 'parcelado' : 'mensal';

  return `CONTRATO DE ${tipoLabel.toUpperCase()}

Pelo presente instrumento particular, as partes abaixo qualificadas:

CONTRATANTE: ${dados.contratanteNome}, inscrito(a) no CPF/CNPJ sob o nº ${dados.contratanteDocumento}, com endereço em ${dados.contratanteEndereco}, doravante denominado(a) CONTRATANTE;

CONTRATADO(A): ${dados.prestadorNome}, inscrito(a) no CPF/CNPJ sob o nº ${dados.prestadorDocumento}, com endereço em ${dados.prestadorEndereco}, doravante denominado(a) CONTRATADO(A);

Têm entre si justo e contratado o seguinte:

CLÁUSULA PRIMEIRA — DO OBJETO
O presente contrato tem por objeto a prestação dos seguintes serviços pelo(a) CONTRATADO(A) ao CONTRATANTE: ${dados.descricaoServico}.

CLÁUSULA SEGUNDA — DAS OBRIGAÇÕES DO CONTRATADO(A)
O(A) CONTRATADO(A) se compromete a:
a) Executar os serviços descritos na Cláusula Primeira com zelo, diligência e boa técnica profissional;
b) Cumprir os prazos estabelecidos neste contrato;
c) Manter sigilo sobre todas as informações confidenciais do CONTRATANTE;
d) Comunicar imediatamente ao CONTRATANTE qualquer impedimento à execução dos serviços.

CLÁUSULA TERCEIRA — DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a:
a) Fornecer ao(à) CONTRATADO(A) todas as informações e materiais necessários à execução dos serviços;
b) Efetuar os pagamentos nas condições e prazos estipulados;
c) Comunicar de forma clara e objetiva suas expectativas e requisitos.

CLÁUSULA QUARTA — DO VALOR E FORMA DE PAGAMENTO
O valor total dos serviços objeto deste contrato é de R$ ${formatCurrency(dados.valorTotal)} (${extenso(dados.valorTotal)}), a ser pago na modalidade ${pagamentoLabel}.
${dados.formaPagamento === 'parcelado' ? 'As parcelas serão definidas de comum acordo entre as partes.' : ''}
${dados.formaPagamento === 'mensal' ? 'O pagamento será realizado mensalmente até o dia 10 de cada mês subsequente à prestação do serviço.' : ''}

CLÁUSULA QUINTA — DO PRAZO
O presente contrato terá início em ${formatDate(dados.dataInicio)}, com prazo de entrega previsto para ${formatDate(dados.prazoEntrega)}.

CLÁUSULA SEXTA — DA RESCISÃO
O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação por escrito com antecedência mínima de 15 (quinze) dias.
Em caso de rescisão antecipada sem justa causa, a parte que der causa à rescisão pagará à outra uma multa equivalente a ${dados.multaRescisao}% (${extensoPercent(dados.multaRescisao)} por cento) do valor total do contrato.

CLÁUSULA SÉTIMA — DA CONFIDENCIALIDADE
As partes se obrigam a manter em sigilo todas as informações confidenciais obtidas em razão deste contrato, não podendo divulgá-las a terceiros sem autorização prévia e por escrito da parte titular da informação.

CLÁUSULA OITAVA — DO FORO
As partes elegem o foro da comarca de ${dados.cidadeForo} para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.

E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.

${dados.cidadeForo}, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.


___________________________________
${dados.contratanteNome}
CONTRATANTE


___________________________________
${dados.prestadorNome}
CONTRATADO(A)`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '___/___/______';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(valor: string): string {
  if (!valor) return '___';
  const num = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return valor;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function extenso(valor: string): string {
  if (!valor) return '___';
  const num = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return valor;

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const inteiro = Math.floor(num);
  const centavos = Math.round((num - inteiro) * 100);

  if (inteiro === 0 && centavos === 0) return 'zero reais';

  const extensoGrupo = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    if (n < 10) return unidades[n];
    if (n < 20) return especiais[n - 10];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? dezenas[d] : `${dezenas[d]} e ${unidades[u]}`;
    }
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (resto === 0) return n === 100 ? 'cem' : centenas[c];
    return `${centenas[c]} e ${extensoGrupo(resto)}`;
  };

  const partes: string[] = [];
  let resto = inteiro;

  const milhoes = Math.floor(resto / 1000000);
  resto = resto % 1000000;
  const milhares = Math.floor(resto / 1000);
  resto = resto % 1000;
  const cents = resto;

  if (milhoes > 0) {
    partes.push(milhoes === 1 ? 'um milhão' : `${extensoGrupo(milhoes)} milhões`);
  }
  if (milhares > 0) {
    partes.push(`${extensoGrupo(milhares)} mil`);
  }
  if (cents > 0) {
    partes.push(extensoGrupo(cents));
  }

  let resultado = partes.join(', ');
  if (inteiro > 0) resultado += inteiro === 1 ? ' real' : ' reais';

  if (centavos > 0) {
    resultado += ` e ${extensoGrupo(centavos)} centavo${centavos === 1 ? '' : 's'}`;
  }

  return resultado;
}

function extensoPercent(valor: string): string {
  if (!valor) return '___';
  return valor;
}
