'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import {
  clearSession,
  isSessionExpired,
  readSession,
  writeSession,
  type Session,
} from '@/lib/auth';
import type { LoginResponse } from '@/types/api';

export function rotaInicial(papel: Session['papel']): string {
  return papel === 'SuperAdmin' ? '/admin' : '/pdv';
}

export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const atual = readSession();
    if (atual && isSessionExpired(atual)) {
      clearSession();
      toast.error('Sessão expirada. Faça login novamente.');
      router.replace('/login');
      setSession(null);
    } else {
      setSession(atual);
    }
    setCarregando(false);
  }, [router]);

  const login = useMutation<LoginResponse, unknown, { email: string; senha: string }>({
    mutationFn: async ({ email, senha }) => {
      const { data } = await api.post<LoginResponse>('/api/auth/login', { email, senha });
      return data;
    },
    onSuccess: (resposta) => {
      const nova: Session = {
        token: resposta.token,
        nome: resposta.nome,
        papel: resposta.papel,
        lojaId: resposta.lojaId,
      };
      writeSession(nova);
      setSession(nova);
      router.replace(rotaInicial(nova.papel));
    },
  });

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    router.replace('/login');
  }, [router]);

  return {
    session,
    carregando,
    login,
    logout,
    erroLogin: apiErrorMessage(login.error) ?? 'Email ou senha inválidos',
  };
}
