import { PerfumeMaterial, FormulaIngredient, FormulaAnalysis } from '../types/perfumery';
import { MATERIAL_MAP } from '../data/materialsData';

/**
 * Pure function to calculate full analysis of a perfume formula:
 * - Total weight
 * - Pyramid note percentages (Top, Heart, Base, Solvent)
 * - IFRA safety compliance checks
 * - Exact cost in EGP based on price list
 */
export function analyzeFormula(
  ingredients: FormulaIngredient[],
  fragranceConcentrationPercent: number = 20 // e.g. 20% in finished perfume
): FormulaAnalysis {
  let totalWeight = 0;
  let totalPureWeight = 0;
  let topWeight = 0;
  let heartWeight = 0;
  let baseWeight = 0;
  let solventWeight = 0;
  let totalCostEgp = 0;

  const warnings: FormulaAnalysis['ifraWarnings'] = [];

  for (const item of ingredients) {
    if (item.parts <= 0) continue;
    const material = MATERIAL_MAP.get(item.materialId);
    if (!material) continue;

    totalWeight += item.parts;

    // effective pure active ratio: parts * (dilutionPercent / 100)
    const pureFactor = (item.dilutionPercent || 100) / 100;
    const pureWeight = item.parts * pureFactor;
    totalPureWeight += pureWeight;

    // Cost calculation: pricePerGram * pure weight in concentrate
    // Note: if diluted with solvent purchased, cost reflects the active + solvent
    const itemCost = item.parts * (material.pricePerGram * pureFactor + (1 - pureFactor) * 1.0); // 1 EGP/g for DPG carrier
    totalCostEgp += itemCost;

    // Pyramid allocation
    switch (material.pyramidNote) {
      case 'Top':
        topWeight += item.parts;
        break;
      case 'Top-Heart':
        topWeight += item.parts * 0.6;
        heartWeight += item.parts * 0.4;
        break;
      case 'Heart':
        heartWeight += item.parts;
        break;
      case 'Heart-Base':
        heartWeight += item.parts * 0.4;
        baseWeight += item.parts * 0.6;
        break;
      case 'Base':
        baseWeight += item.parts;
        break;
      case 'Solvent':
        solventWeight += item.parts;
        break;
      default:
        heartWeight += item.parts;
    }
  }

  // Calculate percentages
  const safeTotal = totalWeight > 0 ? totalWeight : 1;
  const topPercent = Math.round((topWeight / safeTotal) * 100);
  const heartPercent = Math.round((heartWeight / safeTotal) * 100);
  const basePercent = Math.round((baseWeight / safeTotal) * 100);
  const solventPercent = Math.round((solventWeight / safeTotal) * 100);

  // IFRA safety checks
  for (const item of ingredients) {
    if (item.parts <= 0) continue;
    const material = MATERIAL_MAP.get(item.materialId);
    if (!material) continue;

    const pureParts = item.parts * ((item.dilutionPercent || 100) / 100);
    // Percentage of pure material in the fragrance oil concentrate
    const percentInConcentrate = (pureParts / safeTotal) * 100;
    // Percentage of pure material in finished consumer product (at fragranceConcentrationPercent)
    const percentInFinishedProduct = (percentInConcentrate * fragranceConcentrationPercent) / 100;

    if (material.ifraStatus === 'Prohibited / Banned') {
      warnings.push({
        materialId: material.id,
        materialName: material.nameEn,
        actualConcentration: percentInFinishedProduct,
        limitPercent: 0,
        status: 'Prohibited / Banned',
        warningAr: `المادة (${material.nameAr} - ${material.nameEn}) محظورة دولياً وممنوعة تماماً بـ IFRA والاتحاد الأوروبي لمستحضرات التجميل!`,
        warningEn: `Material (${material.nameEn}) is globally prohibited and 100% banned under IFRA 51 and EU Cosmetics Annex II!`
      });
    } else if (
      material.ifraCat4LimitPercent !== null &&
      percentInFinishedProduct > material.ifraCat4LimitPercent
    ) {
      warnings.push({
        materialId: material.id,
        materialName: material.nameEn,
        actualConcentration: Number(percentInFinishedProduct.toFixed(3)),
        limitPercent: material.ifraCat4LimitPercent,
        status: 'Restricted',
        warningAr: `تجاوز الحد الأقصى لـ IFRA للفئة 4: التركيز الحالي في العطر (${percentInFinishedProduct.toFixed(2)}%) يتجاوز الحد المسموح (${material.ifraCat4LimitPercent}%).`,
        warningEn: `IFRA Category 4 limit exceeded: current concentration in perfume (${percentInFinishedProduct.toFixed(2)}%) exceeds safety cap (${material.ifraCat4LimitPercent}%).`
      });
    }
  }

  const costPer100gEgp = totalWeight > 0 ? (totalCostEgp / totalWeight) * 100 : 0;

  return {
    totalWeight: Number(totalWeight.toFixed(2)),
    totalPureWeight: Number(totalPureWeight.toFixed(2)),
    topPercent,
    heartPercent,
    basePercent,
    solventPercent,
    totalCostEgp: Number(totalCostEgp.toFixed(2)),
    costPer100gEgp: Number(costPer100gEgp.toFixed(2)),
    ifraWarnings: warnings
  };
}

/**
 * Generate CSV formatted for perfumery formulation software
 */
export function exportMaterialsToCsv(materials: PerfumeMaterial[]): string {
  const headers = [
    'Item #',
    'English Name',
    'Arabic Name',
    'CAS Number',
    'Chemical / IUPAC Name',
    'Brand / Origin',
    'Pyramid Note',
    'Olfactory Family',
    'Physical State',
    'Tenacity (Hours)',
    'Odor Strength',
    'IFRA Cat 4 Max %',
    'IFRA Status',
    'Rec Min %',
    'Rec Max %',
    'Recommended Dilution',
    'Density (g/ml)',
    'Flash Point (°C)',
    'Price (EGP/g)',
    'TGSC Search Query',
    'Odor Profile (English)',
    'Odor Profile (Arabic)'
  ];

  const escapeCsv = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = materials.map(m => [
    m.id,
    escapeCsv(m.nameEn),
    escapeCsv(m.nameAr),
    escapeCsv(m.cas),
    escapeCsv(m.chemicalName),
    escapeCsv(m.brandOrOrigin || ''),
    escapeCsv(m.pyramidNote),
    escapeCsv(m.family),
    escapeCsv(m.pdfState),
    m.tenacityHours,
    escapeCsv(m.odorStrength),
    m.ifraCat4LimitPercent !== null ? m.ifraCat4LimitPercent : 'Unrestricted',
    escapeCsv(m.ifraStatus),
    m.recommendedConcentrationMin,
    m.recommendedConcentrationMax,
    escapeCsv(m.recommendedDilution),
    m.densityGml || '',
    m.flashPointC || '',
    m.pricePerGram,
    escapeCsv(m.tgscSearchQuery),
    escapeCsv(m.odorProfileEn),
    escapeCsv(m.odorProfileAr)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Convert material to direct TGSC URL using CAS number or optimal query
 */
export function getTgscUrl(material: PerfumeMaterial): string {
  if (material.cas && material.cas !== 'Mixture / Specialty Base' && !material.cas.includes('Mixture')) {
    // TGSC search with CAS number is 100% reliable!
    return `https://www.google.com/search?q=site%3Athegoodscentscompany.com+${encodeURIComponent(material.cas)}+${encodeURIComponent(material.nameEn)}`;
  }
  return `https://www.google.com/search?q=site%3Athegoodscentscompany.com+${encodeURIComponent(material.tgscSearchQuery)}`;
}

/**
 * Direct search on IFRA Standards database
 */
export function getIfraUrl(material: PerfumeMaterial): string {
  if (material.cas && !material.cas.includes('Mixture')) {
    return `https://ifrafragrance.org/standards/IFRA_STD_${encodeURIComponent(material.cas)}.pdf`;
  }
  return `https://www.google.com/search?q=site%3Aifrafragrance.org+${encodeURIComponent(material.nameEn)}`;
}
