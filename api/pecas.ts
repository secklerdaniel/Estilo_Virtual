// Biblioteca de peças do lojista: a foto de cada peça sobe uma vez e entra em quantos looks quiser.
// Não gasta crédito. Arquivo no R2 (usuarios/<id>/pecas/<peca>.jpg), índice no Neon.
import { apagarDoR2, erro, getUser, linkAssinado, salvarArquivo, sql } from './_lib.js';

const MAX_PECAS = 500;

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const linhas = await sql`select id, nome, chave, created_at from pecas where user_id = ${user.id} order by created_at desc limit ${MAX_PECAS}`;
  const pecas = await Promise.all(linhas.map(async l => ({ id: l.id, nome: l.nome, criadaEm: l.created_at, url: await linkAssinado(l.chave) })));
  return Response.json({ pecas });
}

export async function POST(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const { nome, imagem } = await req.json().catch(() => ({}));
  const n = String(nome ?? '').trim().slice(0, 80) || 'Peça';
  if (typeof imagem !== 'string' || imagem.length < 100 || imagem.length > 4_000_000) return erro(400, 'Envie a foto da peça.');
  const [{ total }] = await sql`select count(*)::int as total from pecas where user_id = ${user.id}`;
  if (total >= MAX_PECAS) return erro(409, `Sua biblioteca chegou a ${MAX_PECAS} peças. Apague algumas para enviar novas.`);
  const id = crypto.randomUUID();
  const chave = `usuarios/${user.id}/pecas/${id}.jpg`;
  await salvarArquivo(chave, Buffer.from(imagem, 'base64'));
  await sql`insert into pecas (id, user_id, nome, chave) values (${id}, ${user.id}, ${n}, ${chave})`;
  return Response.json({ peca: { id, nome: n, criadaEm: new Date().toISOString(), url: await linkAssinado(chave) } });
}

export async function PATCH(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const { nome } = await req.json().catch(() => ({}));
  const n = String(nome ?? '').trim().slice(0, 80);
  if (!n) return erro(400, 'Informe o nome da peça.');
  const [l] = await sql`update pecas set nome = ${n} where id = ${id}::uuid and user_id = ${user.id} returning id`.catch(() => []);
  if (!l) return erro(404, 'Peça não encontrada.');
  return Response.json({ ok: true });
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const [l] = await sql`delete from pecas where id = ${id}::uuid and user_id = ${user.id} returning chave`.catch(() => []);
  if (!l) return erro(404, 'Peça não encontrada.');
  await apagarDoR2(l.chave).catch(() => {});
  return Response.json({ ok: true });
}
