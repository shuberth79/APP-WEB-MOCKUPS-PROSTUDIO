

import { MockupType, MockupConfig, MockupQuantity, Gender } from './types';

export const MOCKUP_CATEGORIES: MockupConfig[] = [
  {
    id: MockupType.TSHIRT,
    title: 'T-Shirt',
    icon: '👕',
    allowedQuantities: ['Solo', 'Duo', 'Trio', 'Family']
  },
  {
    id: MockupType.SWEATSHIRT,
    title: 'Sudadera',
    icon: '🧥',
    allowedQuantities: ['Solo', 'Duo', 'Trio', 'Family']
  },
  {
    id: MockupType.MUG,
    title: 'Tazas',
    icon: '☕',
    allowedQuantities: ['1', '2', '3']
  },
  {
    id: MockupType.BLANKET,
    title: 'Mantas',
    icon: '🛌',
    allowedQuantities: ['1', '2']
  },
  {
    id: MockupType.NOTEBOOK,
    title: 'Cuadernos',
    icon: '📓',
    allowedQuantities: ['1', '2', '3']
  },
  {
    id: MockupType.BAG,
    title: 'Bolsos',
    icon: '👜',
    allowedQuantities: ['1', '2', '3']
  }
];

export const ETHNICITIES = ['Anglosajón', 'Nórdico', 'Afroamericano', 'Indio', 'Asiático', 'Latino'];
export const PHYSICAL_TRAITS = ['Cabello Rubio', 'Cabello Moreno', 'Ojos Claros', 'Ojos Cafés', 'Ojos Verdes', 'Ojos Azules'];
export const GENDERS: Gender[] = ['Hombre', 'Mujer', 'Ambos']; // Added "Ambos"
export const STYLES = ['Urbano', 'Skateboard', 'Reguetón', 'Formal', 'Semiformal', 'Ocasional', 'Relajado', 'Cocktail'];
export const LOCATIONS = ['Interior', 'Exterior', 'Parque', 'Fiesta en Jardín', 'Discoteca', 'Cafetería'];
export const ENVIRONMENTS = ['Día', 'Noche', 'Atardecer', 'Anochecer'];