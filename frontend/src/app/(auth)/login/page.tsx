'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VidricLogo } from '@/components/vidric-logo';
import { useAuth } from '@/hooks/useAuth';
import { apiErrorMessage, apiErrorStatus } from '@/lib/api';
import { entradaPagina, spring } from '@/lib/motion';

const MENSAGEM_SUSPENSA = 'Loja suspensa. Contate o suporte.';

function LoginForm() {
  const params = useSearchParams();
  const { login, erroLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [suspensa, setSuspensa] = useState(params.get('motivo') === 'loja-suspensa');

  useEffect(() => {
    if (params.get('motivo') === 'sessao-expirada') toast.error('Sessão expirada. Faça login novamente.');
    if (params.get('motivo') === 'loja-suspensa') setSuspensa(true);
  }, [params]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSuspensa(false);
    try {
      await login.mutateAsync({ email, senha });
    } catch (error) {
      const status = apiErrorStatus(error);
      const mensagem = apiErrorMessage(error);
      if (status === 403 && mensagem?.includes('Loja suspensa')) {
        setSuspensa(true);
        return;
      }
      toast.error(mensagem ?? 'Email ou senha inválidos');
    }
  }

  return (
    <motion.div
      variants={entradaPagina}
      initial="initial"
      animate="animate"
      className="glass w-full max-w-sm p-7 flex flex-col gap-6"
    >
      <div className="flex justify-center">
        <VidricLogo className="h-9 w-auto" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground mt-1">Use o email da sua loja.</p>
      </div>

      {suspensa && (
        <p
          role="alert"
          className="text-sm font-semibold px-4 py-3 rounded-[calc(var(--radius)*0.6)]"
          style={{ color: 'var(--danger-text)', background: 'var(--danger-soft)' }}
        >
          {MENSAGEM_SUSPENSA}
        </p>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@loja.com.br"
            className="h-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-12"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={login.isPending}
          className="h-12 w-full text-base font-semibold mt-1"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          {login.isPending ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              className="inline-block size-4 rounded-full border-2 border-current border-t-transparent"
            />
          ) : null}
          Entrar
        </Button>
        <motion.p transition={spring} className="text-center text-sm" style={{ color: 'var(--danger-text)' }} aria-live="polite">
          {login.isError ? erroLogin : ''}
        </motion.p>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
