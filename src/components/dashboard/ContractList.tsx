import { useNavigate } from 'react-router-dom';
import { ContractListItem, SortField, SortDir } from '@/services/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FileText, Clock, CheckCircle2, Trash2, Search, ArrowUpDown } from 'lucide-react';

interface Props {
  contratos: ContractListItem[];
  search: string;
  onSearchChange: (value: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField, dir: SortDir) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDeleteClick: (contract: ContractListItem) => void;
}

export default function ContractList({
  contratos,
  search,
  onSearchChange,
  sortField,
  sortDir,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  onDeleteClick,
}: Props) {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-foreground">Seus contratos</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou tipo..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              maxLength={100}
            />
          </div>
          <Select
            value={`${sortField}:${sortDir}`}
            onValueChange={(v) => {
              const [field, dir] = v.split(':') as [SortField, SortDir];
              onSortChange(field, dir);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at:desc">Mais recentes</SelectItem>
              <SelectItem value="created_at:asc">Mais antigos</SelectItem>
              <SelectItem value="titulo:asc">Título A-Z</SelectItem>
              <SelectItem value="titulo:desc">Título Z-A</SelectItem>
              <SelectItem value="status:asc">Status A-Z</SelectItem>
              <SelectItem value="status:desc">Status Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {contratos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum contrato ainda. Crie seu primeiro contrato!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {contratos.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/contrato/${c.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.tipo} • {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={c.status === 'gerado' ? 'default' : 'secondary'}
                      className={c.status === 'gerado' ? 'bg-success text-success-foreground' : ''}
                    >
                      {c.status === 'gerado' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {c.status === 'gerado' ? 'Gerado' : 'Rascunho'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(c);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => onPageChange(p)} className="cursor-pointer">
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </>
  );
}
