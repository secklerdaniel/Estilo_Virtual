// Compartilhado pelas funções de api/. O "_" no nome impede a Vercel de expor como rota.
import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import Stripe from 'stripe';

export const sql = neon(process.env.NEON_DATABASE_URL!);

export const PLANOS = {
  essencial: { nome: 'Essencial', centavos: 47000, creditos: 50 },
  profissional: { nome: 'Profissional', centavos: 97000, creditos: 200 },
  // "Ilimitado" na propaganda; teto de uso justo para nenhum cliente dar prejuízo (~US$0,05 por imagem).
  ilimitado: { nome: 'Ilimitado', centavos: 147000, creditos: 2000 },
} as const;
export type Plano = keyof typeof PLANOS;
export const CREDITOS_GRATIS = 3;

export const erro = (status: number, message: string) => Response.json({ error: message }, { status });

let stripe: Stripe | undefined;
export const getStripe = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));

const authUrl = process.env.NEON_AUTH_BASE_URL!;
const jwks = createRemoteJWKSet(new URL(`${authUrl}/.well-known/jwks.json`));

/** Usuário do JWT do Neon Auth (header Authorization: Bearer ...), ou null. */
export async function getUser(req: Request): Promise<{ id: string; email: string } | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: new URL(authUrl).origin });
    return payload.sub ? { id: payload.sub, email: String(payload.email ?? '') } : null;
  } catch (e) {
    console.error('JWT inválido:', (e as Error).message);
    return null;
  }
}

/** Origem pública do app, para os redirects do Stripe. */
export const appUrl = (req: Request) =>
  process.env.APP_URL || req.headers.get('origin') || new URL(req.url).origin;
