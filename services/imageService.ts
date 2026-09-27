// Chama a função /api/generate (api/generate.ts), que fala com a OpenAI no servidor.
const generate = async (action: string, images: string[], instruction?: string): Promise<string> => {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, images, instruction }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.image) throw new Error(json.error || 'Não foi possível gerar a imagem. Tente novamente.');
  return json.image;
};

export const generateFlatLay = (images: { base64: string }[]) => generate('flatLay', images.map(i => i.base64));
export const generateBaseModel = (userImageBase64: string) => generate('baseModel', [userImageBase64]);
export const generateTryOn = (userImageBase64: string, clothingImageBase64: string) =>
  generate('tryOn', [userImageBase64, clothingImageBase64]);
export const changePose = (baseImageBase64: string, poseInstruction: string) =>
  generate('pose', [baseImageBase64], poseInstruction);
