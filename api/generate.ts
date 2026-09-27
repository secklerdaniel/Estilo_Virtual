// Função de servidor (Vercel /api/generate; no dev, servida pelo vite.config.ts).
// A chave da OpenAI e os prompts ficam aqui: o navegador só manda a ação e as fotos.

const MODEL = 'gpt-image-2.5-sunburst';

const PROMPTS = {
  flatLay: () => `Você é um estilista de moda super criativo. Usando as peças de roupa fornecidas crie uma composição de 'flat lay' premium, estilo catálogo de moda de luxo digital. Todas as peças devem ter o seu destaque. Use um fundo cinza claro e uniforme. As peças devem formar um quadrado perfeito centralizado. Gere apenas a imagem, sem nenhum texto adicional.`,
  baseModel: () => `Você é um fotógrafo de moda profissional com IA. Transforme a pessoa nesta imagem em uma foto de modelo de corpo inteiro, adequada para um teste virtual. **Importante: vista a pessoa com uma camiseta regata e bermuda pretas simples, justas e lisas.** Esta roupa base deve ser bem neutra para servir como tela. O fundo deve ser um fundo de estúdio limpo e neutro (cinza claro, #f0f0f0). A pessoa deve ter uma expressão neutra e profissional de modelo. **Importante: mantenha 100% a identidade, as características únicas e o tipo físico da pessoa**. Coloque-a em uma pose padrão e relaxada de modelo em pé. A imagem final deve ser fotorrealista. Retorne SOMENTE a imagem final.`,
  tryOn: () => `You are an expert AI for virtual try-on and outfit composition. The first image is the model (a person wearing a basic black tank top and shorts). The second image contains the garments.
Dress the person from the first image with ALL the garments from the second image, creating a natural, realistic final photo.
1. Preserve the model: keep the person's face, hair, body, pose and lighting untouched.
2. Preserve the background of the model image.
3. Replace the base black outfit completely with the new garments.
4. From the garment image, use only the clothing pieces; ignore any people, poses or backgrounds.
5. Fit the garments realistically, respecting layering, body shape and pose, with natural shadows and wrinkles.
6. Match lighting, perspective and color tone to the model image.
7. Return only the dressed model image, with no text, borders or watermarks.`,
  pose: (instruction: string) => `You are an expert fashion photographer AI. Regenerate this image from a different perspective. The person, clothing and background style must remain identical. The new perspective should be: "${instruction}". Return ONLY the final image.`,
};

type Action = keyof typeof PROMPTS;
const SIZE: Record<Action, string> = { flatLay: '1024x1024', baseModel: '1024x1536', tryOn: '1024x1536', pose: '1024x1536' };

const mimeOf = (b64: string) =>
  b64.startsWith('/9j/') ? 'image/jpeg' : b64.startsWith('UklGR') ? 'image/webp' : 'image/png';

const erro = (status: number, message: string) => Response.json({ error: message }, { status });

export async function POST(req: Request): Promise<Response> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return erro(500, 'OPENAI_API_KEY não configurada no servidor.');

  const { action, images, instruction } = await req.json().catch(() => ({}));
  if (!(action in PROMPTS)) return erro(400, 'Ação inválida.');
  if (!Array.isArray(images) || images.length < 1 || images.length > 10 || !images.every(i => typeof i === 'string'))
    return erro(400, 'Envie de 1 a 10 imagens.');
  if (action === 'pose' && (typeof instruction !== 'string' || !instruction || instruction.length > 200))
    return erro(400, 'Instrução de pose inválida.');

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
  const json = await res.json();
  if (!res.ok) {
    console.error('OpenAI:', res.status, json.error?.message);
    return erro(502, 'A IA não conseguiu gerar a imagem. Tente novamente.');
  }
  const image = json.data?.[0]?.b64_json;
  if (!image) return erro(502, 'Nenhuma imagem foi gerada. A resposta pode ter sido bloqueada.');
  return Response.json({ image });
}
