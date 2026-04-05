import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Download } from 'lucide-react';
import { ContractData, ContractType, generateContractText } from '@/lib/contract-templates';
import jsPDF from 'jspdf';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<{ titulo: string; tipo: string; status: string; dados: ContractData; created_at: string } | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('titulo, tipo, status, dados, created_at')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (error || !data) {
        toast({ title: 'Erro', description: 'Contrato não encontrado.', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }
      setContrato({ ...data, dados: data.dados as unknown as ContractData });
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  if (loading || !contrato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Map tipo label back to ContractType id
  const tipoMap: Record<string, ContractType> = {
    'Prestação de Serviço': 'prestacao-servico',
    'Desenvolvimento de Software': 'desenvolvimento-software',
    'Criação de Conteúdo / Design': 'criacao-conteudo',
    'Consultoria': 'consultoria',
    'NDA (Acordo de Sigilo)': 'nda',
    'Parceria Comercial': 'parceria-comercial',
  };

  const tipoId = tipoMap[contrato.tipo] ?? 'prestacao-servico';
  const contractText = generateContractText(tipoId, contrato.dados);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 6;
    const bottomMargin = 25;
    const paragraphs = contractText.split('\n\n');
    let y = 25;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - bottomMargin) { doc.addPage(); y = 25; }
    };

    paragraphs.forEach((paragraph, pIdx) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return;
      if (pIdx === 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(trimmed, maxWidth);
        ensureSpace(titleLines.length * 8);
        titleLines.forEach((line: string) => { doc.text(line, pageWidth / 2, y, { align: 'center' }); y += 8; });
        y += 4;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        return;
      }
      const subLines = trimmed.split('\n');
      subLines.forEach((subLine) => {
        const sub = subLine.trim();
        if (!sub) { y += lineHeight / 2; return; }
        const isSubBold = sub.startsWith('CLÁUSULA') || sub.startsWith('CONTRATANTE:') || sub.startsWith('CONTRATADO(A):') || sub.startsWith('PARTE REVELADORA:') || sub.startsWith('PARTE RECEPTORA:') || sub.startsWith('___');
        doc.setFont('helvetica', isSubBold ? 'bold' : 'normal');
        const wrapped = doc.splitTextToSize(sub, maxWidth);
        ensureSpace(wrapped.length * lineHeight);
        wrapped.forEach((wLine: string) => { doc.text(wLine, margin, y); y += lineHeight; });
      });
      y += 4;
    });

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(40);
      doc.setTextColor(200, 200, 200);
      doc.text('ContratoFácil.com.br', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`contrato-${tipoId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">{contrato.titulo}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <p className="text-sm text-muted-foreground">
            {contrato.tipo} • {new Date(contrato.created_at).toLocaleDateString('pt-BR')} • Status: {contrato.status === 'gerado' ? 'Gerado' : 'Rascunho'}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">{contractText}</pre>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={downloadPDF}>
            <Download className="h-4 w-4 mr-1" /> Baixar PDF
          </Button>
        </div>
      </main>
    </div>
  );
}
