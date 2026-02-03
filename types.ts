
export enum MockupType {
  TSHIRT = 'TSHIRT',
  SWEATSHIRT = 'SWEATSHIRT',
  HOODIE = 'HOODIE',
  MUG = 'MUG',
  BLANKET = 'BLANKET',
  NOTEBOOK = 'NOTEBOOK',
  BAG = 'BAG',
  IMPORTED = 'IMPORTED'
}

export type MockupQuantity = 'Solo' | 'Duo' | 'Trio' | 'Family' | '1' | '2' | '3';
export type Gender = 'Hombre' | 'Mujer' | 'Ambos';
export type Resolution = 'Baja' | 'Media' | 'HD' | 'UHD' | '8K Expert';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MockupOptions {
  ethnicity: string;
  physicalTrait: string;
  gender: Gender;
  style: string;
  location: string;
  environment: string;
  city: string;
  quantity: MockupQuantity;
}

export interface MockupConfig {
  id: MockupType;
  title: string;
  icon: string;
  allowedQuantities: MockupQuantity[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  type: MockupType;
  prompt: string;
  timestamp: number;
  options?: MockupOptions;
  isEdited?: boolean;
}

export interface ManualMontageOptions {
  designX: number;
  designY: number;
  designScale: number;
  designRotation: number;
  designOpacity: number;
  designPerspectiveX: number;
  designPerspectiveY: number;
}
