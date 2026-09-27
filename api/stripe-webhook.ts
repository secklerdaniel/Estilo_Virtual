// Webhook do Stripe: única fonte da verdade da assinatura (a success_url não libera nada).
// Stripe > Developers > Webhooks: https://SEU-DOMINIO/api/stripe-webhook
// Eventos: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
import type Stripe from 'stripe';
import { erro, getStripe, PLANOS, sql, type Plano } from './_lib.js';

const STATUS: Record<string, string> = {
  active: 'ativa', trialing: 'ativa',
  past_due: 'inadimplente', unpaid: 'inadimplente', incomplete: 'inadimplente',
};

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret || !signature) return erro(400, 'Webhook sem assinatura.');

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return erro(400, 'Assinatura inválida.');
  }
  if (!event.type.startsWith('customer.subscription.')) return Response.json({ ignorado: event.type });

  // Busca a assinatura atual em vez de confiar no payload: eventos podem chegar fora de ordem.
  const sub = await getStripe().subscriptions.retrieve((event.data.object as Stripe.Subscription).id);
  const userId = sub.metadata.user_id;
  if (!userId) return Response.json({ ignorado: 'assinatura sem user_id' });

  const item = sub.items.data[0];
  const plano = item.price.metadata.plano as Plano;
  if (!(plano in PLANOS)) return erro(400, `Price sem plano conhecido: ${item.price.id}`);
  const status = STATUS[sub.status] ?? 'cancelada';
  const periodoFim = new Date(item.current_period_end * 1000).toISOString();
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  // Período novo (primeira cobrança ou renovação) zera os créditos usados.
  // Evento atrasado de uma assinatura antiga não sobrescreve a atual.
  await sql`
    insert into assinaturas (user_id, plano, status, creditos_limite, creditos_usados, periodo_fim, stripe_customer_id, stripe_subscription_id)
    values (${userId}, ${plano}, ${status}, ${PLANOS[plano].creditos}, 0, ${periodoFim}, ${customer}, ${sub.id})
    on conflict (user_id) do update set
      plano = excluded.plano,
      status = excluded.status,
      creditos_limite = excluded.creditos_limite,
      creditos_usados = case when assinaturas.periodo_fim is distinct from excluded.periodo_fim
                             then 0 else assinaturas.creditos_usados end,
      periodo_fim = excluded.periodo_fim,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      updated_at = now()
    where assinaturas.stripe_subscription_id is null
       or assinaturas.stripe_subscription_id = excluded.stripe_subscription_id
       or excluded.status = 'ativa'`;

  return Response.json({ ok: true, userId, plano, status });
}
