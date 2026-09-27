// Abre o Checkout do Stripe para assinar um plano mensal.
// Quem já assina é mandado ao Portal do Cliente, onde troca de plano ou cancela.
import { appUrl, erro, getStripe, getUser, PLANOS, sql, type Plano } from './_lib';

export async function POST(req: Request): Promise<Response> {
  try {
    return await checkout(req);
  } catch (e) {
    console.error('Stripe checkout:', (e as Error).message);
    return erro(502, 'Não foi possível abrir o pagamento. Tente novamente em instantes.');
  }
}

async function checkout(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Entre na sua conta para assinar.');
  const { plano } = await req.json().catch(() => ({}));
  if (!(plano in PLANOS)) return erro(400, 'Plano inválido.');

  const stripe = getStripe();
  const base = appUrl(req);
  const [a] = await sql`select status, stripe_customer_id, stripe_subscription_id from assinaturas where user_id = ${user.id}`;

  if (a?.stripe_subscription_id && a.status !== 'cancelada') {
    const portal = await stripe.billingPortal.sessions.create({ customer: a.stripe_customer_id, return_url: base });
    return Response.json({ url: portal.url });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    locale: 'pt-BR',
    line_items: [{ price: await precoDoPlano(plano as Plano), quantity: 1 }],
    client_reference_id: user.id,
    ...(a?.stripe_customer_id ? { customer: a.stripe_customer_id } : { customer_email: user.email || undefined }),
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${base}/?checkout=sucesso`,
    cancel_url: `${base}/?checkout=cancelado`,
  });
  return Response.json({ url: session.url });
}

/** Price mensal do plano. Criado na primeira vez (em teste e em produção), depois achado pela lookup_key. */
async function precoDoPlano(plano: Plano): Promise<string> {
  const stripe = getStripe();
  const lookup_key = `estilo_${plano}_mensal`;
  const { data } = await stripe.prices.list({ lookup_keys: [lookup_key], active: true, limit: 1 });
  if (data[0]) return data[0].id;
  const p = PLANOS[plano];
  const price = await stripe.prices.create({
    currency: 'brl',
    unit_amount: p.centavos,
    recurring: { interval: 'month' },
    lookup_key,
    metadata: { plano },
    product_data: { name: `Estilo Virtual — Plano ${p.nome}` },
  });
  return price.id;
}
