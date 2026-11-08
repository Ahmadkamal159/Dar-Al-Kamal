// export type ScientificConfidence = 'High (Experimental)' | 'Verified Literature' | 'Estimated (QSAR/Physical)' | 'Natural Complex (NCS)';
export type ScientificConfidence = string;
// export type ScientificSourceTier = 
//   | 'Tier 1: NIH PubChem & Peer-Reviewed'
//   | 'Tier 2: EPA CompTox & NIST WebBook'
//   | 'Tier 3: van Gemert & Nagata ODT Compendium'
//   | 'Tier 4: Thermodynamic QSAR Estimation'
//   | 'Local Database';
export type ScientificSourceTier = string;

export interface KineticFragranceMaterial {
  id?: number;
  name: string;
  nameAr?: string;
  cas: string;
  molecularWeight: number; // g/mol (MW)
  vaporPressure: number; // P0 in mmHg at 25°C
  odt: number; // Odor Detection Threshold in ng/L air
  odtUnit: 'ng/L';
  odtSource: string; // e.g. "van Gemert (2011)", "Nagata (2003)", "PubChem", "QSAR Model"
  category: 'Top' | 'Heart' | 'Base';
  confidence: ScientificConfidence;
  pricePerGram?: number;
  iupacName?: string;

  chemicalFormula?: string;
  boilingPointC?: number;
  densityGml?: number;
  sourceTier?: ScientificSourceTier;
}

export interface FormulationRow {
  material: string;
  cas: string;
  parts: number;
  materialRef?: KineticFragranceMaterial;
}

export interface SimulationResultPoint {
  timeHours: number;
  timeMinutes: number; // Discrete minute index (0 to 1440)
  materialsOv: Record<string, number>;
  materialsMass: Record<string, number>; // in milligrams (mg)
  totalMass: number; // in milligrams (mg)
  perceivedCount: number; // count of materials with OV >= 1.0
  depletedMaterials?: string[]; // Materials that hit the Zero Mass Cut-off
}

export interface SimulationSummaryRow {
  material: string;
  cas: string;
  parts: number;
  mw: number;
  p0: number; // mmHg
  odt: number; // ng/L
  odtUnit: string;
  odtSource: string;
  confidence: ScientificConfidence;
  moles: number;
  moleFraction: number;
  partialPressure: number;
  vaporContributionPct: number;
  initialMassMg?: number;
  deathTimeMinutes?: number | null; // Minute at which zero mass cut-off occurred
}

export interface KineticSimulationOutput {
  timeHours: number[];
  materials: string[];
  summaryRows: SimulationSummaryRow[];
  timeGridPoints: SimulationResultPoint[];
  calibratedK: number;
  simMode: string;
  t90AchievedHours: number;
  peakOvMaterial: string;
  longestPerceivedMaterial: string;
  initialSprayMassMg?: number;
  timeResolutionMinutes?: number;
}
