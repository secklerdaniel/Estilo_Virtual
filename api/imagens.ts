// Galeria do usuário: lista as imagens guardadas no R2 e apaga as que ele não quer mais.
import { apagarDoR2, chaveMarca, erro, getUser, lerArquivo, linkAssinado, precisaMarca, sql } from './_lib.js';

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');

  // ?arquivo=<id>: devolve o JPEG (para o zip da galeria; o bucket não tem CORS).
  const arquivo = new URL(req.url).searchParams.get('arquivo');
  if (arquivo) {
    const [l] = await sql`select chave, tem_marca from imagens where id = ${arquivo}::uuid and user_id = ${user.id}`.catch(() => []);
    if (!l) return erro(404, 'Imagem não encontrada.');
    const chave = l.tem_marca && (await precisaMarca(user.id)) ? chaveMarca(l.chave) : l.chave;
    return new Response(new Uint8Array(await lerArquivo(chave)), { headers: { 'content-type': 'image/jpeg' } });
  }
  const linhas = await sql`
    select id, tipo, chave, tem_marca, publicada, created_at from imagens
     where user_id = ${user.id} order by created_at desc limit 200`;
  // Quem passou para Profissional/Ilimitado vê as versões limpas, inclusive das antigas.
  const marca = await precisaMarca(user.id);
  const imagens = await Promise.all(linhas.map(async l => ({
    id: l.id, tipo: l.tipo, criadaEm: l.created_at, publicada: l.publicada,
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

/** Publica ou tira um flat lay do provador público da loja. */
export async function PATCH(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const id = new URL(req.url).searchParams.get('id') ?? '';
  const { publicada } = await req.json().catch(() => ({}));
  const [linha] = await sql`
    update imagens set publicada = ${!!publicada}
     where id = ${id}::uuid and user_id = ${user.id} and tipo = 'flatLay'
     returning id`.catch(() => []);
  if (!linha) return erro(404, 'Flat lay não encontrado.');
  return Response.json({ ok: true });
}
