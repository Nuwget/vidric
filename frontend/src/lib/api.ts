import axios, { AxiosError } from 'axios';
import { clearSession } from './auth';
import type { ApiErro } from '@/types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5080';

const AUTH_BYPASS_PATHS = ['/api/auth/login'];

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = readTokenFromSession();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function readTokenFromSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('vidric.session');
    return raw ? (JSON.parse(raw) as { token?: string }).token ?? null : null;
  } catch {
    return null;
  }
}

function leaveApp(motivo: string) {
  if (typeof window === 'undefined') return;
  clearSession();
  window.location.assign(`/login?motivo=${encodeURIComponent(motivo)}`);
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErro>) => {
    const status = error.response?.status;
    const path = error.config?.url ?? '';
    const isLoginAttempt = AUTH_BYPASS_PATHS.some((p) => path.includes(p));

    if (!isLoginAttempt && status === 401) leaveApp('sessao-expirada');
    if (!isLoginAttempt && status === 403 && apiErrorMessage(error)?.includes('Loja suspensa'))
      leaveApp('loja-suspensa');

    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const body = (error as AxiosError<ApiErro>).response?.data?.erro;
    if (body) return body;
    if (error.code === 'ERR_NETWORK') return 'Servidor indisponível. Verifique se a API está rodando.';
  }
  return null;
}

export function apiErrorStatus(error: unknown): number | null {
  return axios.isAxiosError(error) ? error.response?.status ?? null : null;
}
