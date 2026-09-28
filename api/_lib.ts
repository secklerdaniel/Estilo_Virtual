// Compartilhado pelas funções de api/. O "_" no nome impede a Vercel de expor como rota.
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { neon } from '@neondatabase/serverless';
import sharp from 'sharp';
import { MARCA_PNG } from './_marca.js';
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

const put = (Key: string, Body: Buffer) =>
  r2.send(new PutObjectCommand({ Bucket: bucket(), Key, Body, ContentType: 'image/jpeg' }));
export const salvarArquivo = put;

/** Chave da versão com marca d'água: <id>-marca.jpg ao lado da limpa. */
export const chaveMarca = (chave: string) => chave.replace(/\.jpg$/, '-marca.jpg');

/**
 * Guarda a imagem gerada no R2 e registra no Neon. A versão limpa fica sempre guardada
 * (é ela que alimenta os próximos passos); com `marcada`, guarda também a versão com marca.
 */
export async function salvarImagem(userId: string, tipo: string, base64: string, marcada?: string): Promise<string> {
  const id = crypto.randomUUID();
  const chave = `usuarios/${userId}/${id}.jpg`;
  await put(chave, Buffer.from(base64, 'base64'));
  if (marcada) await put(chaveMarca(chave), Buffer.from(marcada, 'base64'));
  await sql`insert into imagens (id, user_id, tipo, chave, tem_marca) values (${id}, ${userId}, ${tipo}, ${chave}, ${!!marcada})`;
  return id;
}

/** Grátis e Essencial saem com marca d'água; Profissional e Ilimitado vêm limpos (promessa da landing). */
export async function precisaMarca(userId: string): Promise<boolean> {
  const [a] = await sql`select plano, status from assinaturas where user_id = ${userId}`;
  return !a || a.status !== 'ativa' || a.plano === 'gratis' || a.plano === 'essencial';
}

/** Carimba "EstiloVirtual" no canto inferior direito, com ~35% da largura da imagem. */
export async function marcar(base64: string): Promise<string> {
  const img = sharp(Buffer.from(base64, 'base64'));
  const { width = 1024 } = await img.metadata();
  const marca = await sharp(MARCA_PNG).resize({ width: Math.round(width * 0.35) }).toBuffer();
  const margem = Math.round(width * 0.03);
  const { height: hm = 0 } = await sharp(marca).metadata();
  const { height = 1024 } = await img.metadata();
  return (await img
    .composite([{ input: marca, left: width - Math.round(width * 0.35) - margem, top: height - hm - margem }])
    .jpeg({ quality: 90 })
    .toBuffer()).toString('base64');
}

export const linkAssinado = (chave: string) =>
  getSignedUrl(r2, new GetObjectCommand({ Bucket: bucket(), Key: chave }), { expiresIn: 3600 });

export const apagarDoR2 = (chave: string) => r2.send(new DeleteObjectCommand({ Bucket: bucket(), Key: chave }));

export const lerArquivo = async (chave: string) =>
  Buffer.from(await (await r2.send(new GetObjectCommand({ Bucket: bucket(), Key: chave }))).Body!.transformToByteArray());

/** Base64 de uma imagem guardada, se for do usuário (o provador manda "imagem:<id>" em vez da foto). */
export async function lerImagem(userId: string, id: string): Promise<string | null> {
  const [l] = await sql`select chave from imagens where id = ${id}::uuid and user_id = ${userId}`.catch(() => []);
  if (!l) return null;
  return (await lerArquivo(l.chave)).toString('base64');
}

/** Base64 de uma peça da biblioteca, se for do usuário (o flat lay manda "peca:<id>"). */
export async function lerPeca(userId: string, id: string): Promise<string | null> {
  const [l] = await sql`select chave from pecas where id = ${id}::uuid and user_id = ${userId}`.catch(() => []);
  return l ? (await lerArquivo(l.chave)).toString('base64') : null;
}
