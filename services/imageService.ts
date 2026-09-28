// Chama a função /api/generate (api/generate.ts), que fala com a OpenAI no servidor.
import { api } from './auth';

/** Imagem gerada: base64 para mostrar e id no R2 para os próximos passos usarem a versão limpa. */
export type Gerada = { image: string; id?: string };

// Quem já está guardado vai como "imagem:<id>": o servidor lê a versão sem marca d'água.
export const ref = (g: Gerada) => (g.id ? `imagem:${g.id}` : g.image);

const generate = async (action: string, images: string[], instruction?: string): Promise<Gerada> => {
  try {
    return await api<Gerada>('generate', { action, images, instruction });
  } finally {
    window.dispatchEvent(new Event('conta-mudou')); // atualiza o saldo de créditos no topo
  }
};

// Cada item é base64 ou "peca:<id>" (peça da biblioteca, lida no servidor).
export const generateFlatLay = (images: string[]) => generate('flatLay', images);
export const generateBaseModel = (userImageBase64: string) => generate('baseModel', [userImageBase64]);
export const generateTryOn = (modelo: Gerada, peca: string) => generate('tryOn', [ref(modelo), peca]);
export const changePose = (imagem: Gerada, poseInstruction: string) => generate('pose', [ref(imagem)], poseInstruction);
