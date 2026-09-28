// Portal do Cliente do Stripe: trocar de plano, cartão, notas e cancelar.
import { appUrl, erro, getStripe, getUser, sql } from './_lib.js';

export async function POST(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');
  const [a] = await sql`select stripe_customer_id from assinaturas where user_id = ${user.id}`;
  if (!a?.stripe_customer_id) return erro(404, 'Você ainda não tem assinatura.');
  try {
    const portal = await getStripe().billingPortal.sessions.create({ customer: a.stripe_customer_id, return_url: `${appUrl(req)}/conta` });
    return Response.json({ url: portal.url });
  } catch (e) {
    console.error('Stripe portal:', (e as Error).message);
    return erro(502, 'Não foi possível abrir a página da assinatura. Tente novamente em instantes.');
  }
}
