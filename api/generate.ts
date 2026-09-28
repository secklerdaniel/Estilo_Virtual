// Função de servidor (Vercel /api/generate; no dev, servida pelo vite.config.ts).
// O navegador só manda a ação e as fotos; exige login e gasta 1 crédito por imagem.
import { acaoValida, gerarComCredito } from './_gerar.js';
import { erro, getUser, lerImagem, marcar, precisaMarca, salvarImagem } from './_lib.js';

export async function POST(req: Request): Promise<Response> {
  const user = await getUser(req);
  if (!user) return erro(401, 'Entre na sua conta para gerar imagens.');

  const { action, images, instruction } = await req.json().catch(() => ({}));
  if (!acaoValida(action)) return erro(400, 'Ação inválida.');
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

  const r = await gerarComCredito(user.id, action, images, instruction);
  if (r instanceof Response) return r;
  // O navegador recebe a versão com marca (planos Grátis/Essencial); a limpa fica no R2
  // para alimentar os próximos passos sem carregar a marca junto.
  const marcada = (await precisaMarca(user.id)) ? await marcar(r.image).catch(() => undefined) : undefined;
  // Falha ao guardar não pode custar a imagem que o lojista já pagou: devolve mesmo assim.
  const id = await salvarImagem(user.id, action, r.image, marcada).catch(e => console.error('R2:', e.message));
  return Response.json({ image: marcada ?? r.image, id, restantes: r.restantes });
}
