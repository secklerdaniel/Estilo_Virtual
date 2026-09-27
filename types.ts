
export type Page = 'home' | 'flatLay' | 'tryOn' | 'login' | 'galeria';

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
