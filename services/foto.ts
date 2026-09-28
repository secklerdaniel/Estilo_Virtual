// Reduz a foto no navegador antes de enviar: a Vercel aceita no máximo 4,5 MB por
// pedido e uma foto de celular passa disso fácil. A IA não ganha nada acima de ~1500 px.

/** Redimensiona (lado maior <= max) e devolve JPEG em base64 + data URL para prévia. */
export async function reduzirFoto(
  fonte: Blob | HTMLVideoElement,
  max = 1536,
): Promise<{ base64: string; dataUrl: string }> {
  const img = fonte instanceof Blob ? await createImageBitmap(fonte) : fonte;
  const w = img instanceof HTMLVideoElement ? img.videoWidth : img.width;
  const h = img instanceof HTMLVideoElement ? img.videoHeight : img.height;
  const escala = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * escala);
  canvas.height = Math.round(h * escala);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  if ('close' in img) img.close();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: dataUrl.split(',')[1], dataUrl };
}
