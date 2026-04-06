import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createContract } from '@/services/contracts';
import { incrementContractCount } from '@/services/profiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, ArrowRight, Download, Save, Pencil, Briefcase, Code, Palette, Users, Lock, Handshake, Plus, Trash2 } from 'lucide-react';
import { CONTRACT_TYPES, ContractType, ContractData, ClausulaAdicional, INITIAL_CONTRACT_DATA, generateContractText } from '@/lib/contract-templates';
import { validateDocument } from '@/lib/validators';
import { generatePDF } from '@/lib/pdf';

const MAX_TEXT_LENGTH = 500;
const MAX_NAME_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 300;

const iconMap: Record<string, any> = { Briefcase, Code, Palette, Users, Lock, Handshake };

function formatDocumentMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NewContract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ContractType | null>(null);
  const [dados, setDados] = useState<ContractData>(INITIAL_CONTRACT_DATA);
  const [saving, setSaving] = useState(false);

  const prestadorDocValidation = useMemo(() => validateDocument(dados.prestadorDocumento), [dados.prestadorDocumento]);
  const contratanteDocValidation = useMemo(() => validateDocument(dados.contratanteDocumento), [dados.contratanteDocumento]);

  const updateField = (field: keyof ContractData, value: string) => {
    setDados(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (field: 'prestadorDocumento' | 'contratanteDocumento', value: string) => {
    updateField(field, formatDocumentMask(value));
  };

  const handleCurrencyChange = (value: string) => {
    updateField('valorTotal', formatCurrencyInput(value));
  };

  const clausulas = dados.clausulasAdicionais ?? [];

  const addClausula = () => {
    setDados(prev => ({
      ...prev,
      clausulasAdicionais: [...(prev.clausulasAdicionais ?? []), { titulo: '', texto: '' }],
    }));
  };

  const updateClausula = (index: number, field: keyof ClausulaAdicional, value: string) => {
    setDados(prev => {
      const updated = [...(prev.clausulasAdicionais ?? [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, clausulasAdicionais: updated };
    });
  };

  const removeClausula = (index: number) => {
    setDados(prev => {
      const updated = [...(prev.clausulasAdicionais ?? [])];
      updated.splice(index, 1);
      return { ...prev, clausulasAdicionais: updated };
    });
  };

  const requiredFields: { key: keyof ContractData; label: string }[] = [
    { key: 'prestadorNome', label: 'Nome do prestador' },
    { key: 'prestadorDocumento', label: 'CPF/CNPJ do prestador' },
    { key: 'prestadorEndereco', label: 'Endereço do prestador' },
    { key: 'contratanteNome', label: 'Nome do contratante' },
    { key: 'contratanteDocumento', label: 'CPF/CNPJ do contratante' },
    { key: 'contratanteEndereco', label: 'Endereço do contratante' },
    { key: 'descricaoServico', label: 'Descrição do serviço' },
    { key: 'valorTotal', label: 'Valor total' },
    { key: 'dataInicio', label: 'Data de início' },
    { key: 'prazoEntrega', label: 'Prazo de entrega' },
    { key: 'cidadeForo', label: 'Cidade do foro' },
  ];

  const handleAdvanceToStep3 = () => {
    for (const { key, label } of requiredFields) {
      if (!dados[key] || !String(dados[key]).trim()) {
        toast({ title: 'Campo obrigatório', description: `Preencha o campo "${label}".`, variant: 'destructive' });
        return;
      }
    }
    if (!prestadorDocValidation.valid) {
      toast({ title: 'Documento inválido', description: `CPF/CNPJ do prestador: ${prestadorDocValidation.error}`, variant: 'destructive' });
      return;
    }
    if (!contratanteDocValidation.valid) {
      toast({ title: 'Documento inválido', description: `CPF/CNPJ do contratante: ${contratanteDocValidation.error}`, variant: 'destructive' });
      return;
    }
    for (let i = 0; i < clausulas.length; i++) {
      if (!clausulas[i].texto.trim()) {
        toast({ title: 'Cláusula incompleta', description: `Preencha o texto da cláusula adicional ${i + 1} ou remova-a.`, variant: 'destructive' });
        return;
      }
    }
    setStep(3);
  };

  const contractText = selectedType ? generateContractText(selectedType, dados) : '';

  const downloadPDF = () => {
    generatePDF(contractText, `contrato-${selectedType}.pdf`);
  };

  const saveContract = async (status: 'rascunho' | 'gerado') => {
    if (!user || !selectedType) return;
    setSaving(true);
    try {
      const tipoLabel = CONTRACT_TYPES.find(t => t.id === selectedType)?.label ?? selectedType;

      await createContract({
        userId: user.id,
        titulo: `${tipoLabel} — ${(dados.contratanteNome || 'Sem nome').slice(0, MAX_NAME_LENGTH)}`,
        tipo: tipoLabel,
        dados,
        status,
      });

      await incrementContractCount(user.id);

      toast({ title: 'Contrato salvo!', description: status === 'gerado' ? 'Contrato gerado com sucesso.' : 'Rascunho salvo.' });
      navigate('/dashboard');
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Não foi possível salvar o contrato. Tente novamente.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">Novo Contrato</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          {['Tipo', 'Dados', 'Preview'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > i + 1 ? 'bg-success text-success-foreground' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === i + 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-1" />
      </div>

      <main className="container mx-auto px-4 pb-8 max-w-3xl">
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {CONTRACT_TYPES.map((type) => {
              const Icon = iconMap[type.icon] ?? FileText;
              return (
                <Card key={type.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedType === type.id ? 'ring-2 ring-primary border-primary' : ''}`} onClick={() => setSelectedType(type.id as ContractType)}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{type.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <div className="col-span-full flex justify-end mt-4">
              <Button disabled={!selectedType} onClick={() => setStep(2)}>
                Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Dados do Prestador</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo <span className="text-destructive">*</span></Label>
                    <Input value={dados.prestadorNome} onChange={e => updateField('prestadorNome', e.target.value)} placeholder="Nome do prestador" />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF ou CNPJ <span className="text-destructive">*</span></Label>
                    <Input value={dados.prestadorDocumento} onChange={e => handleDocumentChange('prestadorDocumento', e.target.value)} placeholder="000.000.000-00" />
                    {dados.prestadorDocumento && !prestadorDocValidation.valid && (
                      <p className="text-sm text-destructive">{prestadorDocValidation.error}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço <span className="text-destructive">*</span></Label>
                  <Input value={dados.prestadorEndereco} onChange={e => updateField('prestadorEndereco', e.target.value)} placeholder="Rua, número, cidade, estado" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Dados do Contratante</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo <span className="text-destructive">*</span></Label>
                    <Input value={dados.contratanteNome} onChange={e => updateField('contratanteNome', e.target.value)} placeholder="Nome do contratante" />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF ou CNPJ <span className="text-destructive">*</span></Label>
                    <Input value={dados.contratanteDocumento} onChange={e => handleDocumentChange('contratanteDocumento', e.target.value)} placeholder="000.000.000-00" />
                    {dados.contratanteDocumento && !contratanteDocValidation.valid && (
                      <p className="text-sm text-destructive">{contratanteDocValidation.error}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço <span className="text-destructive">*</span></Label>
                  <Input value={dados.contratanteEndereco} onChange={e => updateField('contratanteEndereco', e.target.value)} placeholder="Rua, número, cidade, estado" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Detalhes do Contrato</h3>
                <div className="space-y-2">
                  <Label>Descrição detalhada do serviço <span className="text-destructive">*</span></Label>
                  <Textarea value={dados.descricaoServico} onChange={e => updateField('descricaoServico', e.target.value)} placeholder="Descreva os serviços a serem prestados..." rows={4} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor total (R$) <span className="text-destructive">*</span></Label>
                    <Input value={dados.valorTotal} onChange={e => handleCurrencyChange(e.target.value)} placeholder="5.000,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={dados.formaPagamento} onValueChange={v => updateField('formaPagamento', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avista">À vista</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de início <span className="text-destructive">*</span></Label>
                    <Input type="date" value={dados.dataInicio} onChange={e => updateField('dataInicio', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo de entrega <span className="text-destructive">*</span></Label>
                    <Input type="date" value={dados.prazoEntrega} onChange={e => updateField('prazoEntrega', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Multa por rescisão (%)</Label>
                    <Input value={dados.multaRescisao} onChange={e => updateField('multaRescisao', e.target.value)} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade do foro <span className="text-destructive">*</span></Label>
                    <Input value={dados.cidadeForo} onChange={e => updateField('cidadeForo', e.target.value)} placeholder="São Paulo - SP" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cláusulas adicionais */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Cláusulas adicionais</h3>
                    <p className="text-sm text-muted-foreground mt-1">Adicione cláusulas personalizadas ao contrato (opcional)</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addClausula}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>

                {clausulas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    Nenhuma cláusula adicional. Clique em "Adicionar" para incluir uma.
                  </p>
                )}

                {clausulas.map((clausula, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Cláusula adicional {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeClausula(index)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Título da cláusula</Label>
                      <Input
                        value={clausula.titulo}
                        onChange={e => updateClausula(index, 'titulo', e.target.value)}
                        placeholder="Ex: Da Exclusividade, Das Revisões, Do Reajuste..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto da cláusula <span className="text-destructive">*</span></Label>
                      <Textarea
                        value={clausula.texto}
                        onChange={e => updateClausula(index, 'texto', e.target.value)}
                        placeholder="Descreva o conteúdo desta cláusula..."
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleAdvanceToStep3}>
                Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-6">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">{contractText}</pre>
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button variant="outline" onClick={() => saveContract('rascunho')} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> Salvar rascunho
              </Button>
              <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => { downloadPDF(); saveContract('gerado'); }} disabled={saving}>
                <Download className="h-4 w-4 mr-1" /> Baixar PDF
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
