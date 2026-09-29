export type PalletType = 'europeo' | 'americano' | 'personalizado';

export interface PalletDimensions {
  type: PalletType;
  name: string;
  fullName: string;
  length: number; // in mm
  width: number;  // in mm
  tareWeight: number; // in kg (25kg for europeo, 30kg for americano)
  baseHeight: number; // in mm (typically 144-150mm for wood pallet)
  standard: string;
}

export interface BoxDimensions {
  length: number; // in mm (Largo)
  width: number;  // in mm (Ancho)
  height: number; // in mm (Alto)
  weight: number; // in kg per box
}

export interface BoxPlacement {
  id: number;
  x: number;      // x coordinate from top-left in mm
  y: number;      // y coordinate from top-left in mm
  w: number;      // placed width in mm
  h: number;      // placed height in mm
  rotated: boolean; // true if box placed as width x length instead of length x width
  blockId?: number;
}

export type MosaicType = 
  | 'optimo'
  | 'longitudinal'
  | 'transversal'
  | 'mixto_2bloques_v'
  | 'mixto_2bloques_h'
  | 'mixto_3bloques'
  | 'molinillo'
  | 'cuadrantes';

export interface CartesianInfeedGroup {
  step: number;               // 1, 2, 3... infeed sequence
  name: string;               // e.g. "Paso 1: Fila Perimetral Frontal (3 cajas)"
  side: 'Frontal (Sur)' | 'Lateral Derecho (Este)' | 'Trasero (Norte)' | 'Lateral Izquierdo (Oeste)' | 'Núcleo Central';
  boxIds: number[];
  boxesCount: number;
  boxLength: number;
  boxWidth: number;
  rotated: boolean;
  startX: number;
  startY: number;
  spanW: number;
  spanH: number;
  gripperAction: 'Toma simple (1 caja)' | 'Toma en fila (2-4 cajas)' | 'Toma en bloque';
  entryAxis: string;          // e.g. "Eje X (Longitudinal)" o "Eje Y (Transversal)"
  conveyorBatch: string;      // e.g. "Lote de 3 cajas (400×300 mm)"
  robotTrajectory: string;    // e.g. "Avance cartesiano hacia X=0, Y=620 mm"
  depositRange: string;       // e.g. "X: 0 → 1200 mm | Y: 600 → 800 mm"
}

export interface ChimneyHole {
  x: number;
  y: number;
  width: number;
  height: number;
  areaMm2: number;
  isCentral: boolean;
  type: 'chimenea_central' | 'calle_longitudinal' | 'calle_transversal';
  label: string;
}

export interface MosaicPattern {
  id: string;
  name: string;
  type: MosaicType;
  description: string;
  boxesPerLayer: number;
  layerA: BoxPlacement[];
  layerB: BoxPlacement[]; // Capitulado / Interlocking layer
  areaOccupiedMm2: number;
  palletAreaMm2: number;
  areaEfficiency: number; // 0 to 100%
  remainingMarginX: number; // mm left over in length
  remainingMarginY: number; // mm left over in width
  isInterlockable: boolean; // whether layer B staggers joints
  interlockType: 'rotacion_180' | 'espejo_horizontal' | 'espejo_vertical' | 'inversion_bloques' | 'apilado_directo';
  interlockStability: 'Excelente' | 'Buena' | 'Moderada' | 'En columna (Sin traba)';
  stabilityScore: number; // 0 to 100%
  perimeterFlush: boolean; // true if boxes reach outer edges, gaps are in center/chimney
  hasCentralChimney: boolean;
  chimneyHolesA: ChimneyHole[];
  chimneyHolesB: ChimneyHole[];
  cartesianGroupsA: CartesianInfeedGroup[];
  cartesianGroupsB: CartesianInfeedGroup[];
}

export interface PalletStabilityInfo {
  centerOfGravityHeightMm: number; // Z_cdg in mm
  centerOfGravityRatio: number;    // Z_cdg / TotalHeight (percentage)
  slendernessRatio: number;        // TotalHeight / min(PalletLength, PalletWidth)
  staticTippingAngleDeg: number;   // Critical static tipping angle in degrees
  stabilityIndexScore: number;     // 0 to 100 composite index
  stabilityLevel: 'Excelente' | 'Estable / Seguro' | 'Moderado' | 'Crítico (Riesgo Vuelco)';
  recommendation: string;
}

export interface PalletCalculationResult {
  pallet: PalletDimensions;
  box: BoxDimensions;
  layersCount: number;
  selectedMosaic: MosaicPattern;
  allMosaics: MosaicPattern[];
  totalBoxes: number;
  netWeightKg: number;
  tareWeightKg: number;
  totalWeightKg: number;
  boxHeightTotalMm: number;
  totalHeightMm: number;
  stability: PalletStabilityInfo;
  isOverweightWarning: boolean;
  isOverheightWarning: boolean;
}

export const PALLET_CONFIGS: Record<PalletType, PalletDimensions> = {
  europeo: {
    type: 'europeo',
    name: 'Palet Europeo (EPAL 1)',
    fullName: 'Europalet Homologado UNE-EN 13698-1',
    length: 1200,
    width: 800,
    tareWeight: 25, // 25 kg según norma
    baseHeight: 145, // 144-145 mm altura estándar de madera
    standard: '1200 × 800 mm'
  },
  americano: {
    type: 'americano',
    name: 'Palet Americano (ISO / Universal)',
    fullName: 'Palet Universal Homologado UNE-EN 13698-2',
    length: 1200,
    width: 1000,
    tareWeight: 30, // 30 kg según norma
    baseHeight: 150, // 150 mm altura estándar
    standard: '1200 × 1000 mm'
  },
  personalizado: {
    type: 'personalizado',
    name: 'Palet a Medida',
    fullName: 'Palet con Dimensiones Personalizadas',
    length: 1200,
    width: 800,
    tareWeight: 25,
    baseHeight: 145,
    standard: 'Personalizado'
  }
};

export interface BoxPreset {
  id: string;
  name: string;
  category: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  description: string;
}

export const JACOOR_BOX_PRESETS: BoxPreset[] = [
  {
    id: 'ifco-fruta-grande',
    name: 'Caja Fruta / Verdura IFCO 6415',
    category: 'Frescos & Frutas',
    length: 600,
    width: 400,
    height: 150,
    weight: 12.5,
    description: 'Caja plástica plegable estándar para hortalizas y frutas (600×400×150 mm)'
  },
  {
    id: 'ifco-fruta-mediana',
    name: 'Caja Frescos 400×300 (IFCO 4316)',
    category: 'Frescos & Frutas',
    length: 400,
    width: 300,
    height: 160,
    weight: 8.0,
    description: 'Caja estándar para fruta pequeña, cítricos y tomates'
  },
  {
    id: 'brick-leche',
    name: 'Bandeja Brick Leche Entera (6u)',
    category: 'Lácteos & Bebidas',
    length: 380,
    width: 255,
    height: 220,
    weight: 6.8,
    description: 'Caja de cartón con 6 brics de leche 1L con retractilado'
  },
  {
    id: 'aceite-oliva',
    name: 'Caja Aceite de Oliva 1L (15u)',
    category: 'Alimentación Seca',
    length: 390,
    width: 260,
    height: 310,
    weight: 14.5,
    description: 'Caja máster de cartón ondulado para botellas de aceite'
  },
  {
    id: 'conservas-atun',
    name: 'Caja Conservas Atún Claro (24 packs)',
    category: 'Conservas',
    length: 320,
    width: 215,
    height: 140,
    weight: 9.2,
    description: 'Bandeja troquelada para latas en conserva'
  },
  {
    id: 'detergente-deliplus',
    name: 'Caja Detergente Líquido 3L (4u)',
    category: 'Droguería & Limpieza',
    length: 400,
    width: 280,
    height: 320,
    weight: 16.0,
    description: 'Caja reforzada para envases de limpieza de 3 Litros'
  },
  {
    id: 'panaderia-bolleria',
    name: 'Bandeja Panadería / Bollería',
    category: 'Horno & Panadería',
    length: 600,
    width: 400,
    height: 240,
    weight: 5.5,
    description: 'Caja ligera de cartón para producto horneado y bollería'
  }
];

