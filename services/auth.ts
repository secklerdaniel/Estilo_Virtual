// Login (Neon Auth) e chamadas autenticadas às funções de api/.
import { createAuthClient } from '@neondatabase/neon-js/auth';

// Fala com o proxy /api/auth (api/auth.ts) na mesma origem: o cookie de sessão
// fica no domínio do app, sem depender de cookie de terceiros.
export const authClient = createAuthClient(`${window.location.origin}/api/auth`);

/** Volta do login com Google: troca o verificador da URL pelo cookie de sessão. */
export async function concluirLoginSocial() {
  const url = new URL(window.location.href);
  const verifier = url.searchParams.get('neon_auth_session_verifier');
  if (!verifier) return;
  await fetch(`/api/auth/get-session?neon_auth_session_verifier=${encodeURIComponent(verifier)}`);
  url.searchParams.delete('neon_auth_session_verifier');
  window.history.replaceState(null, '', url);
}

/** fetch para /api com o JWT do usuário logado. Erro vira Error com a mensagem do servidor. */
export async function api<T = any>(path: string, body?: unknown, method?: string): Promise<T> {
  // Direto no proxy: authClient.token() às vezes responde do cache sem JWT.
  const { token } = await fetch('/api/auth/token').then(r => (r.ok ? r.json() : {})).catch(() => ({})) as { token?: string };
  const res = await fetch(`/api/${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'Algo deu errado. Tente novamente.'), { status: res.status });
  return json;
}

export type Conta = {
  plano: 'gratis' | 'essencial' | 'profissional' | 'ilimitado';
  status: string;
  restantes: number;
  limite: number;
  periodoFim?: string;
  assinante: boolean;
};

export type Imagem = { id: string; tipo: 'flatLay' | 'baseModel' | 'tryOn' | 'pose'; criadaEm: string; url: string; publicada: boolean };

export type Loja = { nome: string; slug: string; whatsapp: string | null; provador_ativo: boolean; limite_diario: number };
