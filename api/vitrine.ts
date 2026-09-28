// Provador público da loja (/p/<slug>): sem login. A cliente da loja prova as peças que o
// lojista publicou e cada geração gasta crédito do lojista. Nada da cliente é guardado.
import { createHash } from 'node:crypto';
import { gerarComCredito } from './_gerar.js';
import { chaveMarca, erro, lerImagem, linkAssinado, marcar, precisaMarca, sql } from './_lib.js';

// ponytail: limite por IP (hash); dá para burlar trocando de rede, o teto real é o limite diário da loja.
const POR_VISITANTE_DIA = 10;

const lojaPorSlug = async (slug: string) =>
  (await sql`select user_id, nome, whatsapp, provador_ativo, limite_diario from lojas where slug = ${slug}`)[0];

export async function GET(req: Request): Promise<Response> {
  const slug = new URL(req.url).searchParams.get('slug') ?? '';
  const loja = await lojaPorSlug(slug);
  if (!loja) return erro(404, 'Loja não encontrada.');
  if (!loja.provador_ativo) return Response.json({ nome: loja.nome, ativo: false, pecas: [] });
  const marca = await precisaMarca(loja.user_id);
  const pecas = await sql`
    select id, chave, tem_marca from imagens
     where user_id = ${loja.user_id} and tipo = 'flatLay' and publicada order by created_at desc limit 60`;
  return Response.json({
    nome: loja.nome,
    whatsapp: loja.whatsapp,
    ativo: true,
    pecas: await Promise.all(pecas.map(async p => ({
      id: p.id, url: await linkAssinado(marca && p.tem_marca ? chaveMarca(p.chave) : p.chave),
    }))),
  });
}

export async function POST(req: Request): Promise<Response> {
  const { slug, action, foto, modelo, peca, consentimento } = await req.json().catch(() => ({}));
  if (consentimento !== true) return erro(400, 'Confirme o uso da foto para continuar.');
  const loja = await lojaPorSlug(String(slug ?? ''));
  if (!loja?.provador_ativo) return erro(404, 'Este provador não está disponível.');

  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  const ipHash = createHash('sha256').update(`${ip}:${loja.user_id}`).digest('hex').slice(0, 32);
  const [uso] = await sql`
    select count(*) filter (where ip_hash = ${ipHash})::int as visitante, count(*)::int as loja
      from provas_publicas where loja_user_id = ${loja.user_id} and created_at > now() - interval '1 day'`;
  if (uso.visitante >= POR_VISITANTE_DIA) return erro(429, 'Você atingiu o limite de provas de hoje. Volte amanhã!');
  // Cada prova completa são 2 gerações (modelo + look).
  if (uso.loja >= loja.limite_diario * 2) return erro(429, 'O provador desta loja atingiu o limite de hoje. Volte amanhã!');

  let images: string[];
  if (action === 'baseModel') {
    if (typeof foto !== 'string' || foto.length > 6_000_000) return erro(400, 'Envie uma foto.');
    images = [foto];
  } else if (action === 'tryOn') {
    if (typeof modelo !== 'string' || modelo.length > 6_000_000) return erro(400, 'Crie seu modelo primeiro.');
    // Só peças que o lojista publicou: a cliente não usa o crédito da loja com imagens próprias.
    const [pub] = await sql`select 1 from imagens where id = ${String(peca)}::uuid and user_id = ${loja.user_id} and publicada`.catch(() => []);
    const pecaB64 = pub && await lerImagem(loja.user_id, String(peca));
    if (!pecaB64) return erro(404, 'Peça não encontrada.');
    images = [modelo, pecaB64];
  } else return erro(400, 'Ação inválida.');

  const r = await gerarComCredito(loja.user_id, action, images, undefined, 'provador');
  if (r instanceof Response) {
    // Crédito do lojista acabou: a cliente vê uma mensagem neutra.
    return r.status === 402 ? erro(503, 'O provador desta loja está indisponível no momento.') : r;
  }
  await sql`insert into provas_publicas (loja_user_id, ip_hash, acao) values (${loja.user_id}, ${ipHash}, ${action})`;
  // O modelo base volta limpo (alimenta o próximo passo); o look final leva a marca do plano do lojista.
  const final = action === 'tryOn' && (await precisaMarca(loja.user_id)) ? await marcar(r.image).catch(() => r.image) : r.image;
  return Response.json({ image: final });
}
