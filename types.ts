
export enum MockupType {
  TSHIRT = 'TSHIRT',
  SWEATSHIRT = 'SWEATSHIRT',
  MUG = 'MUG',
  BLANKET = 'BLANKET',
  NOTEBOOK = 'NOTEBOOK',
  BAG = 'BAG',
  IMPORTED = 'IMPORTED'
}

export type MockupQuantity = 'Solo' | 'Duo' | 'Trio' | 'Family' | '1' | '2' | '3';
export type Gender = 'Hombre' | 'Mujer' | 'Ambos'; // Added "Ambos"
export type Resolution = 'Baja' | 'Media' | 'HD' | 'UHD' | '8K Expert';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MockupOptions {
  ethnicity: string;
  physicalTrait: string;
  gender: Gender; // Added gender
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

// New types for ManualMontagePreview component props to reflect new sliders
export interface ManualMontageOptions {
  designX: number;
  designY: number;
  designScale: number;
  designRotation: number;
  designOpacity: number; // New: opacity
  designPerspectiveX: number; // New: perspective X
  designPerspectiveY: number; // New: perspective Y
}
