// Plano e créditos do usuário logado.
import { CREDITOS_GRATIS, erro, getUser, sql } from './_lib.js';

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const [a] = await sql`
    select plano, status, creditos_limite, creditos_usados, periodo_fim, stripe_subscription_id
      from assinaturas where user_id = ${user.id}`;
  if (!a) return Response.json({ plano: 'gratis', status: 'ativa', restantes: CREDITOS_GRATIS, limite: CREDITOS_GRATIS, assinante: false });
  return Response.json({
    plano: a.plano,
    status: a.status,
    restantes: Math.max(0, a.creditos_limite - a.creditos_usados),
    limite: a.creditos_limite,
    periodoFim: a.periodo_fim,
    assinante: !!a.stripe_subscription_id && a.status !== 'cancelada',
  });
}
