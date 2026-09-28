// A loja do lojista: nome, endereço público (/p/<slug>), WhatsApp e o provador público.
import { erro, getUser, sql } from './_lib.js';

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const [loja] = await sql`select nome, slug, whatsapp, provador_ativo, limite_diario from lojas where user_id = ${user.id}`;
  return Response.json({ loja: loja ?? null });
}

export async function POST(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const b = await req.json().catch(() => ({}));
  const nome = String(b.nome ?? '').trim();
  const slug = String(b.slug ?? '').trim().toLowerCase();
  const whatsapp = String(b.whatsapp ?? '').replace(/\D/g, '') || null;
  const ativo = !!b.provador_ativo;
  const limite = Math.round(Number(b.limite_diario ?? 20));
  if (!nome || nome.length > 80) return erro(400, 'Informe o nome da loja (até 80 caracteres).');
  if (!/^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/.test(slug))
    return erro(400, 'O endereço precisa ter de 3 a 40 letras minúsculas, números ou hífens (sem hífen no começo ou no fim).');
  if (whatsapp && !/^\d{10,13}$/.test(whatsapp)) return erro(400, 'WhatsApp inválido. Use DDD + número, ex.: 13 99999-9999.');
  if (!(limite >= 1 && limite <= 500)) return erro(400, 'O limite diário precisa ficar entre 1 e 500.');
  try {
    const [loja] = await sql`
      insert into lojas (user_id, nome, slug, whatsapp, provador_ativo, limite_diario)
      values (${user.id}, ${nome}, ${slug}, ${whatsapp}, ${ativo}, ${limite})
      on conflict (user_id) do update set nome = excluded.nome, slug = excluded.slug, whatsapp = excluded.whatsapp,
        provador_ativo = excluded.provador_ativo, limite_diario = excluded.limite_diario, updated_at = now()
      returning nome, slug, whatsapp, provador_ativo, limite_diario`;
    return Response.json({ loja });
  } catch (e) {
    if (/lojas_slug_key|duplicate key/.test((e as Error).message)) return erro(409, 'Este endereço já está em uso por outra loja.');
    throw e;
  }
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  await sql`delete from lojas where user_id = ${user.id}`;
  await sql`update imagens set publicada = false where user_id = ${user.id}`;
  return Response.json({ ok: true });
}
