-- Estilo Virtual — schema no Neon (projeto estilo_virtual).
-- Usuários vivem em neon_auth.user (Neon Auth); aqui só créditos e assinatura.
-- Quem fala com o banco é só o servidor (api/), sempre com o id do JWT.

create table if not exists assinaturas (
  user_id                text primary key,           -- neon_auth.user.id (sub do JWT)
  plano                  text not null default 'gratis'
                           check (plano in ('gratis', 'essencial', 'profissional', 'ilimitado')),
  status                 text not null default 'ativa'
                           check (status in ('ativa', 'inadimplente', 'cancelada')),
  creditos_limite        integer not null default 3 check (creditos_limite >= 0),
  creditos_usados        integer not null default 0 check (creditos_usados >= 0),
  periodo_fim            timestamptz,                -- null = grátis, não expira
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Consumo atômico: garante a linha grátis e gasta 1 crédito se houver.
-- Dois cliques simultâneos não gastam o mesmo crédito. 0 linhas = sem crédito.
create or replace function consumir_credito(p_user_id text)
returns table (restantes integer)
language sql as $$
  insert into assinaturas (user_id) values (p_user_id) on conflict (user_id) do nothing;
  update assinaturas
     set creditos_usados = creditos_usados + 1, updated_at = now()
   where user_id = p_user_id
     and status = 'ativa'
     and (periodo_fim is null or periodo_fim > now())
     and creditos_usados < creditos_limite
  returning creditos_limite - creditos_usados;
$$;

-- Devolve o crédito quando a IA falha depois da reserva.
create or replace function devolver_credito(p_user_id text)
returns void
language sql as $$
  update assinaturas
     set creditos_usados = greatest(0, creditos_usados - 1), updated_at = now()
   where user_id = p_user_id;
$$;

-- Imagens geradas: o arquivo fica no Cloudflare R2 (bucket estilo-virtual,
-- privado, chave usuarios/<user_id>/<id>.jpg); aqui só o índice por dono.
create table if not exists imagens (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  tipo       text not null check (tipo in ('flatLay', 'baseModel', 'tryOn', 'pose')),
  chave      text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists imagens_user_created_idx on imagens (user_id, created_at desc);

-- Marca d'água (Grátis/Essencial): R2 guarda também <id>-marca.jpg; a limpa alimenta os próximos passos.
alter table imagens add column if not exists tem_marca boolean not null default false;
