import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchContractById, ContractDetail as ContractDetailType } from '@/services/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Download } from 'lucide-react';
import { ContractType, generateContractText } from '@/lib/contract-templates';
import { generatePDF } from '@/lib/pdf';

const tipoMap: Record<string, ContractType> = {
  'Prestação de Serviço': 'prestacao-servico',
  'Desenvolvimento de Software': 'desenvolvimento-software',
  'Criação de Conteúdo / Design': 'criacao-conteudo',
  'Consultoria': 'consultoria',
  'NDA (Acordo de Sigilo)': 'nda',
  'Parceria Comercial': 'parceria-comercial',
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<ContractDetailType | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      try {
        const data = await fetchContractById(id, user.id);
        if (!data) {
          toast({ title: 'Erro', description: 'Contrato não encontrado.', variant: 'destructive' });
          navigate('/dashboard');
          return;
        }
        setContrato(data);
      } catch {
        toast({ title: 'Erro', description: 'Erro ao carregar contrato.', variant: 'destructive' });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, id]);

  if (loading || !contrato) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const tipoId = tipoMap[contrato.tipo] ?? 'prestacao-servico';
  const contractText = generateContractText(tipoId, contrato.dados);

  const handleDownload = () => {
    generatePDF(contractText, `contrato-${tipoId}.pdf`);
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
          <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> Baixar PDF
          </Button>
        </div>
      </main>
    </div>
  );
}
