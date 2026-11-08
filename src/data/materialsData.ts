import { PerfumeMaterial, OlfactoryFamily, PyramidNote } from '../types/perfumery';
import { materialsPart1 } from './materialsPart1';
import { materialsPart2 } from './materialsPart2';
import { materialsPart3 } from './materialsPart3';
import { materialsPart4 } from './materialsPart4';

export const ALL_MATERIALS: PerfumeMaterial[] = [
  ...materialsPart1,
  ...materialsPart2,
  ...materialsPart3,
  ...materialsPart4,
];

export const MATERIAL_MAP = new Map<number, PerfumeMaterial>(
  ALL_MATERIALS.map(m => [m.id, m])
);

export const OLFACTORY_FAMILIES: OlfactoryFamily[] = [
  'Citrus',
  'Floral',
  'Woody',
  'Musk',
  'Amber',
  'Balsamic',
  'Fruity',
  'Green',
  'Marine / Ozone',
  'Spicy',
  'Herbal',
  'Animalic',
  'Aldehydic',
  'Gourmand',
  'Solvent / Diluent',
];

export const PYRAMID_NOTES: PyramidNote[] = [
  'Top',
  'Top-Heart',
  'Heart',
  'Heart-Base',
  'Base',
  'Solvent',
];

export interface PresetAccord {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  items: { materialId: number; parts: number; dilutionPercent: number }[];
}

export const PRESET_ACCORDS: PresetAccord[] = [
    {
        id: 'amber-oriental',
        nameAr: 'أكورد العنبر الملكي الكلاسيكي (Ambreine Accord)',
        nameEn: 'Classic Royal Amber Accord',
        descriptionAr: 'قاعدة عنبرية شرقية دافئة غنية باللادنوم، الفانيلين، الجاوي، وخشب الصندل.',
        items: [
            { materialId: 27, parts: 20, dilutionPercent: 100 }, // Labdanum resinoid (كان 1)
            { materialId: 18, parts: 15, dilutionPercent: 100 }, // Vanillin (كان 45)
            { materialId: 30, parts: 15, dilutionPercent: 100 }, // Benzoin sumatra (كان 8)
            { materialId: 7, parts: 20, dilutionPercent: 100 },  // Ebanol (كان 20)
            { materialId: 16, parts: 25, dilutionPercent: 100 }, // Iso E Super (كان 41)
            { materialId: 11, parts: 5, dilutionPercent: 100 },  // Ambroxan (كان 25)
        ]
    },
    {
        id: 'modern-blue',
        nameAr: 'أكورد الانتعاش الأزرق والبحري (Blue Oceanic Accord)',
        nameEn: 'Modern Blue Marine Accord',
        descriptionAr: 'انتعاش مائي معدني فوار مستوحى من أيقونات العطور البحرية العصرية (سوفاج وأكوا دي جيو).',
        items: [
            { materialId: 32, parts: 25, dilutionPercent: 100 }, // Bergamot FCF (كان 10)
            { materialId: 19, parts: 20, dilutionPercent: 100 }, // Dihydromyrcenol (كان 48)
            { materialId: 15, parts: 20, dilutionPercent: 100 }, // Hedione (كان 40)
            { materialId: 8, parts: 2, dilutionPercent: 10 },    // Calone (كان 21)
            { materialId: 11, parts: 8, dilutionPercent: 100 },  // Ambroxan (كان 25)
            { materialId: 16, parts: 25, dilutionPercent: 100 }, // Iso E Super (كان 41)
        ]
    },
    {
        id: 'clean-white-musk',
        nameAr: 'أكورد مسك النظافة الأبيض الفاخر (Clean White Musk)',
        nameEn: 'Luxury Clean White Musk Accord',
        descriptionAr: 'رائحة الغسيل النظيف الفاخر والملمس القطني الناعم بثبات يدوم لأيام.',
        items: [
            { materialId: 12, parts: 30, dilutionPercent: 100 }, // Galaxolide (كان 29)
            { materialId: 49, parts: 25, dilutionPercent: 100 }, // Ethylene brassylate (كان 42)
            { materialId: 9, parts: 15, dilutionPercent: 100 },  // Helvetolide (كان 22)
            { materialId: 116, parts: 15, dilutionPercent: 100 },// Globalide (كان 120)
            { materialId: 15, parts: 15, dilutionPercent: 100 }, // Hedione (كان 40)
        ]
    },
    {
        id: 'oriental-oud-rose',
        nameAr: 'أكورد الورد والعود والباتشولي النيش (Oud & Velvet Rose)',
        nameEn: 'Oud & Velvet Rose Niche Accord',
        descriptionAr: 'توليفة شرقية ساحرة تجمع فخامة العود والورد الدمشقي مع عمق الباتشولي الداكن.',
        items: [
            { materialId: 85, parts: 15, dilutionPercent: 100 }, // Oud oil (كان 89)
            { materialId: 121, parts: 25, dilutionPercent: 100 },// Rosa musk (كان 125)
            { materialId: 31, parts: 20, dilutionPercent: 100 }, // Patchouli dark (كان 9)
            { materialId: 16, parts: 20, dilutionPercent: 100 }, // Iso E Super (كان 41)
            { materialId: 35, parts: 1, dilutionPercent: 10 },   // Beta damascone (كان 16)
            { materialId: 38, parts: 2, dilutionPercent: 100 },  // Ambrocenide 10% (كان 24)
            { materialId: 18, parts: 5, dilutionPercent: 100 },  // Vanillin (كان 45)
        ]
    }
];