// Geração de imagem na OpenAI, compartilhada pelo app (api/generate.ts) e pelo
// provador público das lojas (api/vitrine.ts). Os prompts ficam só no servidor.
import { erro, sql } from './_lib.js';

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

export type Action = keyof typeof PROMPTS;
export const acaoValida = (a: unknown): a is Action => typeof a === 'string' && a in PROMPTS;
const SIZE: Record<Action, string> = { flatLay: '1024x1024', baseModel: '1024x1536', tryOn: '1024x1536', pose: '1024x1536' };

const mimeOf = (b64: string) =>
  b64.startsWith('/9j/') ? 'image/jpeg' : b64.startsWith('UklGR') ? 'image/webp' : 'image/png';

/**
 * Gasta 1 crédito do dono, gera a imagem e devolve o base64 (ou a resposta de erro pronta).
 * Se a IA falhar, o crédito volta.
 */
export async function gerarComCredito(
  dono: string, action: Action, images: string[], instruction?: string,
): Promise<{ image: string; restantes: number } | Response> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return erro(500, 'OPENAI_API_KEY não configurada no servidor.');

  const [credito] = await sql`select restantes from consumir_credito(${dono})`;
  if (!credito) return erro(402, 'Os créditos acabaram. Escolha um plano para continuar gerando.');

  const form = new FormData();
  form.append('model', MODEL);
  form.append('prompt', PROMPTS[action](instruction ?? ''));
  form.append('size', SIZE[action]);
  form.append('quality', 'medium');
  // jpeg para a resposta caber no limite de 4,5 MB da Vercel (as fotos já chegam reduzidas pelo navegador).
  form.append('output_format', 'jpeg');
  images.forEach((b64, i) => {
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
    await sql`select devolver_credito(${dono})`;
    const bloqueada = json.error?.code === 'moderation_blocked' || /safety system/.test(json.error?.message ?? '');
    return erro(502, bloqueada
      ? 'A IA recusou esta imagem pelas regras de segurança. Tente outra foto ou outra peça. O crédito foi devolvido.'
      : 'A IA não conseguiu gerar a imagem. Tente novamente. O crédito foi devolvido.');
  }
  return { image, restantes: credito.restantes };
}
