import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar',
  'User already registered': 'Este e-mail já está cadastrado',
};

function translateError(message: string): string {
  return ERROR_TRANSLATIONS[message] ?? message;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar o cadastro.' });
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: translateError(error.message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: 'Atenção', description: 'Digite seu e-mail primeiro.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada para redefinir sua senha.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: translateError(error.message), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">ContratoFácil</span>
          </div>
          <CardTitle>{isLogin ? 'Entrar' : 'Criar conta'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Acesse sua conta para gerenciar seus contratos' : 'Crie sua conta gratuita e comece agora'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
          {isLogin && (
            <div className="mt-3 text-center">
              <button onClick={handleForgotPassword} className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? 'Criar conta' : 'Entrar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
