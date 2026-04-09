import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

// 🔐 Config central
const REDIRECT_URL = `${window.location.origin}/auth`;

// 🔐 Segurança: normaliza email
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// 🔐 Validações
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  return password.length >= 8 && /\d/.test(password);
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔐 Rate limit por sessão
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  function canMakeRequest() {
    const now = Date.now();
    if (now - lastRequestTime < 1000) return false;
    setLastRequestTime(now);
    return true;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canMakeRequest()) return;

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      toast({ title: 'Erro', description: 'E-mail inválido', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      // 🔐 limpa dados sensíveis
      setPassword('');

      navigate('/dashboard');

    } catch {
      // 🔒 mensagem genérica
      toast({
        title: 'Erro ao entrar',
        description: 'E-mail ou senha inválidos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canMakeRequest()) return;

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      toast({ title: 'Erro', description: 'E-mail inválido', variant: 'destructive' });
      return;
    }

    if (!isStrongPassword(password)) {
      toast({
        title: 'Erro',
        description: 'Senha deve ter pelo menos 8 caracteres e conter um número',
        variant: 'destructive'
      });
      return;
    }

    if (password.length > 100) {
      toast({
        title: 'Erro',
        description: 'Senha inválida',
        variant: 'destructive'
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role: 'user',
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Conta criada!',
        description: 'Verifique seu e-mail para confirmar o cadastro.'
      });

      setPassword('');
      setConfirmPassword('');
      setMode('login');

    } catch {
      toast({
        title: 'Erro ao criar conta',
        description: 'Não foi possível criar a conta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canMakeRequest()) return;

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      toast({ title: 'Erro', description: 'E-mail inválido', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: REDIRECT_URL,
      });

      // 🔒 resposta genérica
      toast({
        title: 'Se existir uma conta, você receberá um e-mail em breve.',
      });

      setMode('login');

    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar a solicitação',
        variant: 'destructive'
      });
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

          <CardTitle>
            {mode === 'login'
              ? 'Entrar'
              : mode === 'signup'
              ? 'Criar conta'
              : 'Recuperar senha'}
          </CardTitle>

          <CardDescription>
            {mode === 'login'
              ? 'Acesse sua conta'
              : mode === 'signup'
              ? 'Crie sua conta'
              : 'Recuperação de senha'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="text-center">
                <button type="button" onClick={() => setMode('forgot')}>
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Confirmar senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar conta'}
              </Button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link'}
              </Button>

              <div className="text-center">
                <button type="button" onClick={() => setMode('login')}>
                  <ArrowLeft /> Voltar
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
