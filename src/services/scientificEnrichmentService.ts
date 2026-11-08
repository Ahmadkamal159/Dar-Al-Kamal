import { KineticFragranceMaterial } from '../types/kineticModel';
import { findScientificMaterial } from '../data/scientificDatabase';

export interface EnrichmentResult {
    material: KineticFragranceMaterial;
    matchedTier: string;
    auditTrail: string[];
}

const LOCAL_STORAGE_CUSTOM_MATERIALS_KEY = 'dar_alkamal_custom_materials_v1';

/**
 * فحص وتوثيق المواد العطرية من قاعدة البيانات المحلية المعتمدة بدلاً من الـ APIs الخارجية
 */
export async function enrichMaterialScientifically(query: string): Promise<EnrichmentResult> {
    const auditTrail: string[] = [];
    const cleanQuery = query.trim().toLowerCase();

    auditTrail.push(`[فحص محلي] بدء الاستعلام في قاعدة البيانات الداخلية عن: "${cleanQuery}"...`);

    // 1. استبعاد الخلطات والقواعد المركبة من الحسابات الفيزيائية النقية
    const isMixture = cleanQuery.includes('base') ||
        cleanQuery.includes('accord') ||
        cleanQuery.includes('blend') ||
        cleanQuery.includes('suederal');

    if (isMixture) {
        auditTrail.push(`[تنبيه] المركب مٌصنف كـ Formulated Base/Accord. يتطلب إدخال القيم الفيزيائية يدويًا.`);
        return createManualMaterial(cleanQuery, 'Base/Accord', auditTrail);
    }

    // 2. البحث أولاً في قاعدة البيانات العلمية المعتمدة (TGSC & Local DB)
    let matchedMaterial: KineticFragranceMaterial | null = findScientificMaterial(cleanQuery) || null;

    // 3. إذا لم توجد بالقاعدة الأساسية، يتم البحث في المواد المحفوظة محلياً في الـ LocalStorage
    if (!matchedMaterial) {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_MATERIALS_KEY);
            if (saved) {
                const customList: KineticFragranceMaterial[] = JSON.parse(saved);
                const found = customList.find(m =>
                    m.name.toLowerCase() === cleanQuery ||
                    m.cas.toLowerCase() === cleanQuery ||
                    (m.nameAr && m.nameAr.toLowerCase().includes(cleanQuery))
                );
                if (found) {
                    matchedMaterial = found;
                    auditTrail.push(`[سجل محلي] تم العثور على المادة في سجل المواد المضافة يدوياً.`);
                }
            }
        } catch (e) {
            // تجنب الكراش في حالة تعذر القراءة
        }
    }

    // 4. في حالة وجود المادة في الداتابيز المحلية
    if (matchedMaterial) {
        auditTrail.push(`[نجاح التوثيق] تم العثور على المادة بنجاح في قاعدة البيانات المحلية.`);
        auditTrail.push(`[الثوابت] CAS: ${matchedMaterial.cas} | MW: ${matchedMaterial.molecularWeight} g/mol | P₀: ${matchedMaterial.vaporPressure} mmHg | ODT: ${matchedMaterial.odt} ng/L`);

        const enriched: KineticFragranceMaterial = {
            ...matchedMaterial,
            sourceTier: matchedMaterial.sourceTier || 'Internal Verified Database'
        };

        return {
            material: enriched,
            matchedTier: enriched.sourceTier!,
            auditTrail
        };
    }

    // 5. في حالة عدم وجود المادة في أي سجل محلي
    auditTrail.push(`[غير مسجلة] المادة غير موجودة في قاعدة البيانات المحلية. تم التوجيه للإدخال اليدوي.`);
    return createManualMaterial(cleanQuery, 'Unknown Material', auditTrail);
}

// ---------------- أدوات إنشاء المواد اليدوية ----------------

function createManualMaterial(name: string, type: string, auditTrail: string[]): EnrichmentResult {
    return {
        material: {
            name,
            nameAr: name,
            cas: 'N/A',
            molecularWeight: 0,
            vaporPressure: 0,
            odt: 0,
            odtUnit: 'ng/L',
            odtSource: 'Manual Entry Required',
            category: 'Base',
            confidence: 'Manual Entry Required',
            pricePerGram: 0,
            chemicalFormula: '',
            sourceTier: `Manual Verification (${type})`
        },
        matchedTier: 'Manual Verification',
        auditTrail
    };
}