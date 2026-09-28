// Painel de uso: como os créditos do lojista estão sendo gastos (tabela uso_creditos).
import { CREDITOS_GRATIS, erro, getUser, sql } from './_lib.js';

export async function GET(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Não autenticado.');

  const [a] = await sql`select plano, creditos_limite, creditos_usados, periodo_fim from assinaturas where user_id = ${user.id}`;
  // Período atual: o mês que termina em periodo_fim; no Grátis, desde sempre.
  const fim: Date | null = a?.periodo_fim ? new Date(a.periodo_fim) : null;
  const inicio = fim ? new Date(new Date(fim).setMonth(fim.getMonth() - 1)) : new Date(0);

  const [porTipo, porDia, recentes, [loja]] = await Promise.all([
    sql`select origem, tipo, count(*)::int as total from uso_creditos
         where user_id = ${user.id} and created_at >= ${inicio.toISOString()} group by 1, 2`,
    sql`select to_char(date_trunc('day', created_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as dia,
               count(*) filter (where origem = 'app')::int as app,
               count(*) filter (where origem = 'provador')::int as provador
          from uso_creditos where user_id = ${user.id} and created_at > now() - interval '30 days'
         group by 1 order by 1`,
    sql`select origem, tipo, created_at from uso_creditos where user_id = ${user.id} order by created_at desc limit 15`,
    sql`select l.slug, l.provador_ativo, l.limite_diario,
               (select count(*)::int from provas_publicas p
                 where p.loja_user_id = l.user_id and p.acao = 'tryOn' and p.created_at > now() - interval '1 day') as provas_hoje
          from lojas l where l.user_id = ${user.id}`,
  ]);

  return Response.json({
    limite: a?.creditos_limite ?? CREDITOS_GRATIS,
    usados: a?.creditos_usados ?? 0,
    inicio: fim ? inicio.toISOString() : null,
    fim: fim?.toISOString() ?? null,
    porTipo,
    porDia,
    recentes,
    loja: loja ?? null,
  });
}
