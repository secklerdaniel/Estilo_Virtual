// Exclusão da conta (LGPD): apaga imagens no R2, dados no Neon e o login.
import { apagarDoR2, chaveMarca, erro, getUser, sql } from './_lib.js';

export async function DELETE(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const { confirmacao } = await req.json().catch(() => ({}));
  if (confirmacao !== 'EXCLUIR') return erro(400, 'Digite EXCLUIR para confirmar.');

  // Não apaga com assinatura rodando: o Stripe continuaria cobrando um cliente sem conta.
  const [a] = await sql`select status, plano, stripe_subscription_id from assinaturas where user_id = ${user.id}`;
  if (a?.stripe_subscription_id && a.status !== 'cancelada')
    return erro(409, 'Cancele sua assinatura em "Gerenciar assinatura" antes de excluir a conta.');

  const imagens = await sql`select chave from imagens where user_id = ${user.id}`;
  await Promise.all(imagens.flatMap(i => [i.chave, chaveMarca(i.chave)]).map(k => apagarDoR2(k).catch(() => {})));
  await sql`delete from imagens where user_id = ${user.id}`;
  await sql`delete from lojas where user_id = ${user.id}`;
  await sql`delete from assinaturas where user_id = ${user.id}`;
  // Sessões e contas de login caem junto (on delete cascade no neon_auth).
  await sql`delete from neon_auth."user" where id = ${user.id}`;
  return Response.json({ ok: true });
}
