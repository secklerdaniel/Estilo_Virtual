// Galeria do usuário: lista as imagens guardadas no R2 e apaga as que ele não quer mais.
import { apagarDoR2, chaveMarca, erro, getUser, linkAssinado, precisaMarca, sql } from './_lib.js';

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const linhas = await sql`
    select id, tipo, chave, tem_marca, created_at from imagens
     where user_id = ${user.id} order by created_at desc limit 200`;
  // Quem passou para Profissional/Ilimitado vê as versões limpas, inclusive das antigas.
  const marca = await precisaMarca(user.id);
  const imagens = await Promise.all(linhas.map(async l => ({
    id: l.id, tipo: l.tipo, criadaEm: l.created_at,
    url: await linkAssinado(marca && l.tem_marca ? chaveMarca(l.chave) : l.chave),
  })));
  return Response.json({ imagens });
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const [linha] = await sql`delete from imagens where id = ${id}::uuid and user_id = ${user.id} returning chave`.catch(() => []);
  if (!linha) return erro(404, 'Imagem não encontrada.');
  await Promise.all([linha.chave, chaveMarca(linha.chave)].map(k => apagarDoR2(k).catch(() => {})));
  return Response.json({ ok: true });
}
