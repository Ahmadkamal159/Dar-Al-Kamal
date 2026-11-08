export type PyramidNote = 'Top' | 'Top-Heart' | 'Heart' | 'Heart-Base' | 'Base' | 'Solvent';

export type OlfactoryFamily =
  | 'Citrus'
  | 'Floral'
  | 'Woody'
  | 'Musk'
  | 'Amber'
  | 'Balsamic'
  | 'Fruity'
  | 'Green'
  | 'Marine / Ozone'
  | 'Spicy'
  | 'Herbal'
  | 'Animalic'
  | 'Aldehydic'
  | 'Gourmand'
  | 'Solvent / Diluent';

export type PhysicalState = 'Liquid' | 'Solid / Powder' | 'Solid / Resin' | 'Solid / Crystals' | 'Viscous / Semi-solid';

export type IfraStatus = 'Compliant' | 'Restricted' | 'Prohibited / Banned';

export interface PerfumeMaterial {
  id: number;
  nameEn: string;
  nameAr: string;
  pdfState: string;
  pricePerGram: number; // in EGP
  cas: string;
  einecs?: string;
  fema?: string;
  chemicalName: string;
  brandOrOrigin?: string; // e.g. IFF, Givaudan, Firmenich, Symrise, BASF, Natural
  pyramidNote: PyramidNote;
  family: OlfactoryFamily;
  subFamilies?: string[];
  odorProfileEn: string;
  odorProfileAr: string;
  tenacityHours: number; // on smelling strip / blotter
  tenacityDescription: string;
  odorStrength: 'High' | 'Medium' | 'Low' | 'Extreme';
  recommendedConcentrationMin: number; // percentage in fragrance concentrate (e.g. 0.1)
  recommendedConcentrationMax: number; // percentage in fragrance concentrate (e.g. 10)
  ifraCat4LimitPercent: number | null; // null if no limit specified, 0 if prohibited
  ifraStatus: IfraStatus;
  ifraNotesAr: string;
  recommendedDilution: string; // e.g., "100%", "10% in DPG", "1% in DPG"
  flashPointC?: number;
  densityGml?: number;
  solubility: string;
  blendsWellWith: string;
  perfumeryRole: string; // Fixative, Modifier, Blender, Fresh Top, Radiant Diffuser, etc.
  tgscSearchQuery: string; // optimal search term for TGSC
    molecularWeight: number;
    vaporPressure: number; // in mmHg
    odorThreshold: number; // in ppm
}

export interface FormulaIngredient {
  materialId: number;
  parts: number; // weight in grams or parts
  dilutionPercent: number; // e.g. 100 for pure, 10 for 10% dilution
}

export interface FormulaAnalysis {
  totalWeight: number;
  totalPureWeight: number;
  topPercent: number;
  heartPercent: number;
  basePercent: number;
  solventPercent: number;
  totalCostEgp: number;
  costPer100gEgp: number;
  ifraWarnings: {
    materialId: number;
    materialName: string;
    actualConcentration: number;
    limitPercent: number;
    status: IfraStatus;
    warningAr: string;
    warningEn?: string;
  }[];
}
