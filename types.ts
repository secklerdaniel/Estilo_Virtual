
export type Page =
  | 'home' | 'flatLay' | 'tryOn' | 'login' | 'galeria' | 'redefinir'
  | 'conta' | 'termos' | 'privacidade' | 'fitness' | 'loja' | 'pecas' | 'painel';

// Endereço de cada página (o vercel.json manda tudo para o index.html).
export const ROTAS: Record<Exclude<Page, 'loja'>, string> = {
  home: '/', flatLay: '/flat-lay', tryOn: '/provador', login: '/entrar', galeria: '/imagens',
  redefinir: '/redefinir-senha', conta: '/conta', termos: '/termos', privacidade: '/privacidade', fitness: '/fitness',
  pecas: '/pecas', painel: '/painel',
};

export const paginaDaUrl = (path = window.location.pathname): Page =>
  path.startsWith('/p/') ? 'loja'
  : (Object.entries(ROTAS).find(([, r]) => r === path.replace(/\/$/, '') || (r === '/' && path === '/'))?.[0] as Page) ?? 'home';

export type ClothingCategory = 'top' | 'bottom' | 'accessory';

export interface UploadedImage {
  name: string;
  preview: string; // URL para a miniatura (data URL ou link do R2)
  base64?: string; // foto enviada agora e não guardada na biblioteca
  pecaId?: string; // peça da biblioteca: o servidor lê do R2
}

export interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
}
