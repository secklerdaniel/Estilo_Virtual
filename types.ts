
export type Page =
  | 'home' | 'flatLay' | 'tryOn' | 'login' | 'galeria' | 'redefinir'
  | 'conta' | 'termos' | 'privacidade' | 'fitness' | 'loja';

// Endereço de cada página (o vercel.json manda tudo para o index.html).
export const ROTAS: Record<Exclude<Page, 'loja'>, string> = {
  home: '/', flatLay: '/flat-lay', tryOn: '/provador', login: '/entrar', galeria: '/imagens',
  redefinir: '/redefinir-senha', conta: '/conta', termos: '/termos', privacidade: '/privacidade', fitness: '/fitness',
};

export const paginaDaUrl = (path = window.location.pathname): Page =>
  path.startsWith('/p/') ? 'loja'
  : (Object.entries(ROTAS).find(([, r]) => r === path.replace(/\/$/, '') || (r === '/' && path === '/'))?.[0] as Page) ?? 'home';

export type ClothingCategory = 'top' | 'bottom' | 'accessory';

export interface UploadedImage {
  name: string;
  base64: string;
  preview: string; // data URL completo, para a miniatura
}

export interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
}
