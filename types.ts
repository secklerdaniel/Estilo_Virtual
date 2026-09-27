
export type Page = 'home' | 'flatLay' | 'tryOn';

export type ClothingCategory = 'top' | 'bottom' | 'accessory';

export interface UploadedImage {
  name: string;
  base64: string;
}

export interface ClothingItem {
  id: number;
  name: string;
  imageUrl: string;
}
