// Galeria do usuário: lista as imagens guardadas no R2 e apaga as que ele não quer mais.
import { apagarDoR2, erro, getUser, linkAssinado, sql } from './_lib.js';

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const linhas = await sql`
    select id, tipo, chave, created_at from imagens
     where user_id = ${user.id} order by created_at desc limit 200`;
  const imagens = await Promise.all(linhas.map(async l => ({
    id: l.id, tipo: l.tipo, criadaEm: l.created_at, url: await linkAssinado(l.chave),
  })));
  return Response.json({ imagens });
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const [linha] = await sql`delete from imagens where id = ${id}::uuid and user_id = ${user.id} returning chave`.catch(() => []);
  if (!linha) return erro(404, 'Imagem não encontrada.');
  await apagarDoR2(linha.chave).catch(e => console.error('R2:', e.message));
  return Response.json({ ok: true });
}
