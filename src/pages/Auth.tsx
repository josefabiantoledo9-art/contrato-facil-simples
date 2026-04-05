import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft } from 'lucide-react';

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar',
  'User already registered': 'Este e-mail já está cadastrado',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido',
};

function translateError(message: string): string {
  for (const [key, value] of Object.entries(ERROR_TRANSLATIONS)) {
    if (message.includes(key)) return value;
  }
  return message;
}

type Mode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro ao entrar', description: translateError(error.message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar o cadastro.' });
      setMode('login');
    } catch (error: any) {
      toast({ title: 'Erro ao criar conta', description: translateError(error.message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });
      if (error) throw error;
      toast({ title: 'E-mail enviado!', description: 'Verifique sua caixa de entrada para redefinir sua senha.' });
      setMode('login');
    } catch (error: any) {
      toast({ title: 'Erro', description: translateError(error.message), variant: 'destructive' });
    } finally {
      setLoading(false);
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
          <CardTitle>{mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Acesse sua conta para gerenciar seus contratos' : mode === 'signup' ? 'Crie sua conta gratuita e comece agora' : 'Enviaremos um link para redefinir sua senha'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
              <div className="text-center">
                <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">Esqueci minha senha</button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Não tem conta?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">Criar conta</button>
              </div>
            </form>
          )}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading || (!!confirmPassword && password !== confirmPassword)}>{loading ? 'Criando conta...' : 'Criar conta'}</Button>
              <div className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-primary font-medium hover:underline">Entrar</button>
              </div>
            </form>
          )}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Enviar link de recuperação'}</Button>
              <div className="text-center">
                <button type="button" onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:underline flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Voltar para o login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
