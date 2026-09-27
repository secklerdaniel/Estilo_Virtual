// Função de servidor (Vercel /api/generate; no dev, servida pelo vite.config.ts).
// A chave da OpenAI e os prompts ficam aqui: o navegador só manda a ação e as fotos.
// Exige login e gasta 1 crédito por imagem (devolvido se a IA falhar).
import { erro, getUser, lerImagem, salvarImagem, sql } from './_lib.js';

const MODEL = 'gpt-image-2.5-sunburst';

// Regras de identidade repetidas nos 3 pedidos com pessoa: o rosto é o que o cliente
// reconhece como "sou eu"; qualquer deformação estraga o provador.
const IDENTIDADE = `IDENTITY IS THE TOP PRIORITY, above style and above the clothes:
- The face must be the exact same person: same face shape, jawline, eyes, eyelids, eyebrows, nose, lips, teeth, ears, skin tone, skin texture, wrinkles, moles, facial hair, hairline, hairstyle, glasses and age.
- Do NOT beautify, retouch, smooth skin, slim the face or body, rejuvenate, change ethnicity or change expression.
- Keep the same head size and proportions relative to the body. Keep the same body shape, height and weight.
- Treat the face and head as untouchable: copy them from the input photo exactly, do not redraw them.
- If a garment would require changing the face or body to fit, change the garment, never the person.`;

const PROMPTS = {
  flatLay: () => `Você é um estilista de moda super criativo. Usando as peças de roupa fornecidas crie uma composição de 'flat lay' premium, estilo catálogo de moda de luxo digital. Todas as peças devem ter o seu destaque. Use um fundo cinza claro e uniforme. As peças devem formar um quadrado perfeito centralizado. Gere apenas a imagem, sem nenhum texto adicional.`,
  baseModel: () => `Photo edit for a virtual try-on base image. This is an EDIT of the input photo, not a new photo.
${IDENTIDADE}
Keep EXACTLY the same pose, body position, camera angle, framing and scale of the person as in the input photo (full body stays full body).
Change ONLY two things:
1. Clothing: replace all clothes and accessories (lanyards, badges, bags) with a plain, fitted black tank top and plain black shorts; bare feet or plain black shoes.
2. Background: a clean, uniform light-grey studio backdrop (#f0f0f0) with soft even light.
Everything else, especially the head and face, must be copied from the input unchanged. Return ONLY the final image.`,
  tryOn: () => `Virtual try-on. The FIRST image is the person (wearing a plain black tank top and shorts). The SECOND image contains the garments.
Dress the person from the first image in ALL the garments from the second image.
${IDENTIDADE}
Other rules:
- This is an edit of the first image: keep its pose, framing, camera angle, lighting and background unchanged. Only the clothing area changes.
- Replace the black base outfit completely with the new garments.
- From the second image use only the clothing pieces; ignore any people, poses or backgrounds.
- Fit the garments realistically to this body and pose, with natural layering, shadows and wrinkles, matching the light and color tone.
Return only the dressed person, no text, borders or watermarks.`,
  pose: (instruction: string) => `Fashion photo of the same person, same outfit and same studio background, from a new pose/perspective: "${instruction}".
${IDENTIDADE}
Clothing must stay identical (same garments, colors, fit and details). Return ONLY the final image.`,
};

type Action = keyof typeof PROMPTS;
const SIZE: Record<Action, string> = { flatLay: '1024x1024', baseModel: '1024x1536', tryOn: '1024x1536', pose: '1024x1536' };

const mimeOf = (b64: string) =>
  b64.startsWith('/9j/') ? 'image/jpeg' : b64.startsWith('UklGR') ? 'image/webp' : 'image/png';

export async function POST(req: Request): Promise<Response> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return erro(500, 'OPENAI_API_KEY não configurada no servidor.');
  const user = await getUser(req);
  if (!user) return erro(401, 'Entre na sua conta para gerar imagens.');

  const { action, images, instruction } = await req.json().catch(() => ({}));
  if (!(action in PROMPTS)) return erro(400, 'Ação inválida.');
  if (!Array.isArray(images) || images.length < 1 || images.length > 10 || !images.every(i => typeof i === 'string'))
    return erro(400, 'Envie de 1 a 10 imagens.');
  if (action === 'pose' && (typeof instruction !== 'string' || !instruction || instruction.length > 200))
    return erro(400, 'Instrução de pose inválida.');

  // "imagem:<id>" = imagem já guardada na conta (ex.: flat lay escolhido no provador).
  for (let i = 0; i < images.length; i++) {
    if (!images[i].startsWith('imagem:')) continue;
    const b64 = await lerImagem(user.id, images[i].slice(7));
    if (!b64) return erro(404, 'Imagem salva não encontrada.');
    images[i] = b64;
  }

  const [credito] = await sql`select restantes from consumir_credito(${user.id})`;
  if (!credito) return erro(402, 'Seus créditos acabaram. Escolha um plano para continuar gerando.');

  const form = new FormData();
  form.append('model', MODEL);
  form.append('prompt', PROMPTS[action as Action](instruction));
  form.append('size', SIZE[action as Action]);
  form.append('quality', 'medium');
  // ponytail: jpeg para a resposta caber no limite de 4,5 MB da Vercel; fotos de entrada muito grandes ainda podem estourar
  form.append('output_format', 'jpeg');
  images.forEach((b64: string, i: number) => {
    const type = mimeOf(b64);
    form.append('image[]', new Blob([Buffer.from(b64, 'base64')], { type }), `img${i}.${type.split('/')[1]}`);
  });

  const res = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  const image = json.data?.[0]?.b64_json;
  if (!res.ok || !image) {
    console.error('OpenAI:', res.status, json.error?.message);
    await sql`select devolver_credito(${user.id})`;
    const bloqueada = json.error?.code === 'moderation_blocked' || /safety system/.test(json.error?.message ?? '');
    return erro(502, bloqueada
      ? 'A IA recusou esta imagem pelas regras de segurança. Tente outra foto ou outra peça. Seu crédito foi devolvido.'
      : 'A IA não conseguiu gerar a imagem. Tente novamente. Seu crédito foi devolvido.');
  }
  // Falha ao guardar não pode custar a imagem que o lojista já pagou: devolve mesmo assim.
  const id = await salvarImagem(user.id, action, image).catch(e => console.error('R2:', e.message));
  return Response.json({ image, id, restantes: credito.restantes });
}
