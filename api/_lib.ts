// Compartilhado pelas funções de api/. O "_" no nome impede a Vercel de expor como rota.
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

// Cloudflare R2 (API S3), bucket privado: a imagem só sai por link assinado de 1 h.
const r2 = new S3Client({
  region: 'auto',
  // A Cloudflare mostra o endpoint já com /<bucket> no fim; o SDK quer só a origem.
  endpoint: process.env.R2_ENDPOINT && new URL(process.env.R2_ENDPOINT).origin,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '' },
});
const bucket = () => process.env.R2_BUCKET_NAME || 'estilo-virtual';

/** Guarda a imagem gerada no R2 e registra no Neon. Retorna o id. */
export async function salvarImagem(userId: string, tipo: string, base64: string): Promise<string> {
  const id = crypto.randomUUID();
  const chave = `usuarios/${userId}/${id}.jpg`;
  await r2.send(new PutObjectCommand({ Bucket: bucket(), Key: chave, Body: Buffer.from(base64, 'base64'), ContentType: 'image/jpeg' }));
  await sql`insert into imagens (id, user_id, tipo, chave) values (${id}, ${userId}, ${tipo}, ${chave})`;
  return id;
}

export const linkAssinado = (chave: string) =>
  getSignedUrl(r2, new GetObjectCommand({ Bucket: bucket(), Key: chave }), { expiresIn: 3600 });

export const apagarDoR2 = (chave: string) => r2.send(new DeleteObjectCommand({ Bucket: bucket(), Key: chave }));

/** Base64 de uma imagem guardada, se for do usuário (o provador manda "imagem:<id>" em vez da foto). */
export async function lerImagem(userId: string, id: string): Promise<string | null> {
  const [l] = await sql`select chave from imagens where id = ${id}::uuid and user_id = ${userId}`.catch(() => []);
  if (!l) return null;
  const obj = await r2.send(new GetObjectCommand({ Bucket: bucket(), Key: l.chave }));
  return Buffer.from(await obj.Body!.transformToByteArray()).toString('base64');
}
