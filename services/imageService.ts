// Chama a função /api/generate (api/generate.ts), que fala com a OpenAI no servidor.
import { api } from './auth';

const generate = async (action: string, images: string[], instruction?: string): Promise<string> => {
  try {
    return (await api<{ image: string }>('generate', { action, images, instruction })).image;
  } finally {
    window.dispatchEvent(new Event('conta-mudou')); // atualiza o saldo de créditos no topo
  }
};

export const generateFlatLay = (images: { base64: string }[]) => generate('flatLay', images.map(i => i.base64));
export const generateBaseModel = (userImageBase64: string) => generate('baseModel', [userImageBase64]);
export const generateTryOn = (userImageBase64: string, clothingImageBase64: string) =>
  generate('tryOn', [userImageBase64, clothingImageBase64]);
export const changePose = (baseImageBase64: string, poseInstruction: string) =>
  generate('pose', [baseImageBase64], poseInstruction);
