import type { PapelUsuario } from '@/types/api';

const STORAGE_KEY = 'vidric.session';

export interface Session {
  token: string;
  nome: string;
  papel: PapelUsuario;
  lojaId: string | null;
}

export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  loja_id?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
}

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: Session): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}

export function isSessionExpired(session: Session | null = readSession()): boolean {
  if (!session) return false;
  const payload = decodeJwt(session.token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
