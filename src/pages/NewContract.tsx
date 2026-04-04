import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, ArrowRight, Download, Save, Pencil, Briefcase, Code, Palette, Users, Lock, Handshake } from 'lucide-react';
import { CONTRACT_TYPES, ContractType, ContractData, INITIAL_CONTRACT_DATA, generateContractText } from '@/lib/contract-templates';
import { validateDocument } from '@/lib/validators';
import jsPDF from 'jspdf';

const iconMap: Record<string, any> = { Briefcase, Code, Palette, Users, Lock, Handshake };

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

  const step2Valid = prestadorDocValidation.valid && contratanteDocValidation.valid && dados.descricaoServico.trim().length > 0;

  const updateField = (field: keyof ContractData, value: string) => {
    setDados(prev => ({ ...prev, [field]: value }));
  };

  const contractText = selectedType ? generateContractText(selectedType, dados) : '';

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 6;
    const bottomMargin = 25;

    // Split the contract into paragraphs (double newline)
    const paragraphs = contractText.split('\n\n');

    let y = 25;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - bottomMargin) {
        doc.addPage();
        y = 25;
      }
    };

    paragraphs.forEach((paragraph, pIdx) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return;

      // Title (first paragraph)
      if (pIdx === 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(trimmed, maxWidth);
        ensureSpace(titleLines.length * 8);
        titleLines.forEach((line: string) => {
          doc.text(line, pageWidth / 2, y, { align: 'center' });
          y += 8;
        });
        y += 4;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return;
      }

      // Determine if this paragraph starts with a clause heading or party label
      const isBoldLine = trimmed.startsWith('CLÁUSULA') || 
                         trimmed.startsWith('CONTRATANTE:') || 
                         trimmed.startsWith('CONTRATADO(A):') ||
                         trimmed.startsWith('___');

      // Handle single-line breaks within a paragraph
      const subLines = trimmed.split('\n');
      
      subLines.forEach((subLine) => {
        const sub = subLine.trim();
        if (!sub) {
          y += lineHeight / 2;
          return;
        }

        const isSubBold = sub.startsWith('CLÁUSULA') || 
                          sub.startsWith('CONTRATANTE:') || 
                          sub.startsWith('CONTRATADO(A):') ||
                          sub.startsWith('___');

        doc.setFont('helvetica', isSubBold || isBoldLine ? 'bold' : 'normal');

        const wrapped = doc.splitTextToSize(sub, maxWidth);
        ensureSpace(wrapped.length * lineHeight);

        wrapped.forEach((wLine: string) => {
          doc.text(wLine, margin, y);
          y += lineHeight;
        });
      });

      // Add spacing between paragraphs
      y += 4;
    });

    // Watermark for free plan
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(40);
      doc.setTextColor(200, 200, 200);
      doc.text('ContratoFácil.com.br', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`contrato-${selectedType}.pdf`);
  };

  const saveContract = async (status: 'rascunho' | 'gerado') => {
    if (!user || !selectedType) return;
    setSaving(true);
    try {
      const tipoLabel = CONTRACT_TYPES.find(t => t.id === selectedType)?.label ?? selectedType;
      const { error } = await supabase.from('contratos').insert({
        user_id: user.id,
        titulo: `${tipoLabel} — ${dados.contratanteNome || 'Sem nome'}`,
        tipo: tipoLabel,
        dados: dados as unknown as import('@/integrations/supabase/types').Json,
        status,
      });
      if (error) throw error;

      toast({ title: 'Contrato salvo!', description: status === 'gerado' ? 'Contrato gerado com sucesso.' : 'Rascunho salvo.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Progress */}
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
        {/* Step 1 — Type Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {CONTRACT_TYPES.map((type) => {
              const Icon = iconMap[type.icon] ?? FileText;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedType === type.id ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => setSelectedType(type.id as ContractType)}
                >
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

        {/* Step 2 — Form */}
        {step === 2 && (
          <div className="space-y-6 mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Dados do Prestador</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={dados.prestadorNome} onChange={e => updateField('prestadorNome', e.target.value)} placeholder="Nome do prestador" />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF ou CNPJ</Label>
                    <Input value={dados.prestadorDocumento} onChange={e => updateField('prestadorDocumento', e.target.value)} placeholder="000.000.000-00" />
                    {!prestadorDocValidation.valid && (
                      <p className="text-sm text-destructive">{prestadorDocValidation.error}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={dados.prestadorEndereco} onChange={e => updateField('prestadorEndereco', e.target.value)} placeholder="Rua, número, cidade, estado" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Dados do Contratante</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={dados.contratanteNome} onChange={e => updateField('contratanteNome', e.target.value)} placeholder="Nome do contratante" />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF ou CNPJ</Label>
                    <Input value={dados.contratanteDocumento} onChange={e => updateField('contratanteDocumento', e.target.value)} placeholder="000.000.000-00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={dados.contratanteEndereco} onChange={e => updateField('contratanteEndereco', e.target.value)} placeholder="Rua, número, cidade, estado" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">Detalhes do Contrato</h3>
                <div className="space-y-2">
                  <Label>Descrição detalhada do serviço</Label>
                  <Textarea value={dados.descricaoServico} onChange={e => updateField('descricaoServico', e.target.value)} placeholder="Descreva os serviços a serem prestados..." rows={4} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor total (R$)</Label>
                    <Input value={dados.valorTotal} onChange={e => updateField('valorTotal', e.target.value)} placeholder="5.000,00" />
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
                    <Label>Data de início</Label>
                    <Input type="date" value={dados.dataInicio} onChange={e => updateField('dataInicio', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo de entrega</Label>
                    <Input type="date" value={dados.prazoEntrega} onChange={e => updateField('prazoEntrega', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Multa por rescisão (%)</Label>
                    <Input value={dados.multaRescisao} onChange={e => updateField('multaRescisao', e.target.value)} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade do foro</Label>
                    <Input value={dados.cidadeForo} onChange={e => updateField('cidadeForo', e.target.value)} placeholder="São Paulo - SP" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Próximo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Preview */}
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
