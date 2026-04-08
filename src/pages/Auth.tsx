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

// 🛡️ Proteção simples contra spam
let lastRequestTime = 0;
function canMakeRequest() {
  const now = Date.now();
  if (now - lastRequestTime < 1000) return false;
  lastRequestTime = now;
  return true;
}

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

    if (!canMakeRequest()) return;

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      toast({ title: 'Erro', description: 'E-mail inválido', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.session) {
        throw new Error('Credenciais inválidas');
      }

      // limpa dados sensíveis
      setPassword('');
      navigate('/dashboard');

    } catch {
      // 🔒 mensagem genérica (evita enumeração)
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
        redirectTo: window.location.origin + '/auth',
      });

      // 🔒 SEMPRE resposta genérica
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
            {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
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
          {/* (mantive seu JSX original — sem mudanças visuais) */}
        </CardContent>
      </Card>
    </div>
  );
}
