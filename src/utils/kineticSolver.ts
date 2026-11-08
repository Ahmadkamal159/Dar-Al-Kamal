/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    KineticSimulationOutput,
    SimulationSummaryRow,
    SimulationResultPoint
} from '../types/kineticModel';

const R_GAS = 8.314462618; // J/(mol*K)
const T_K = 305.15; // 32°C Skin / ambient temperature in Kelvin
const MMHG_TO_PA = 133.322368; // 1 mmHg = 133.322368 Pa (المعامل المباشر للباكال)
const MMHG_TO_KPA = 0.133322;
export const DEFAULT_SPRAY_MASS_MG = 50.0; // 50 milligrams realistic spray dose

export interface SimulationItemInput {
    material: string;
    cas: string;
    parts: number;
    mw: number;
    p0: number; // in mmHg
    odt: number; // in ng/L
    odtUnit: string;
    odtSource: string;
    confidence: any;
}

/**
 * Strict Minute-by-Minute Kinetic Solver with Physical Mass Depletion & Zero Mass Cut-off.
 */
export function solveKineticModel(
    items: SimulationItemInput[],
    fixedK: number | null = null,
    totalSprayMassMg: number = DEFAULT_SPRAY_MASS_MG
): KineticSimulationOutput {
    if (!items || items.length === 0) {
        throw new Error('قائمة المكونات فارغة!');
    }

    // Validate inputs
    for (const item of items) {
        if (item.parts <= 0) throw new Error(`الكمية غير صالحة للمادة: ${item.material}`);
        if (!item.mw || item.mw <= 0) throw new Error(`الوزن الجزيئي (MW) غير صالح للمادة: ${item.material}`);
        if (item.p0 === undefined || item.p0 <= 0) throw new Error(`الضغط البخاري (P0) غير صالح للمادة: ${item.material}`);
        if (!item.odt || item.odt <= 0) throw new Error(`عتبة الشم (ODT) مفقودة أو صفرية للمادة: ${item.material}`);
    }

    const n = items.length;
    const materials = items.map(i => i.material);
    const parts = items.map(i => i.parts);
    const mw = items.map(i => i.mw);
    const pPa = items.map(i => i.p0 * MMHG_TO_PA); // الضغط بالباكال للحسابات الترموديناميكية
    const pKpa = items.map(i => i.p0 * MMHG_TO_KPA);
    const odt = items.map(i => i.odt);

    // 1. Initial Spray Mass & Molecular Distribution
    const totalParts = parts.reduce((a, b) => a + b, 0);
    const initialMassesMg = parts.map(p => (p / totalParts) * totalSprayMassMg);
    const initialMoles = initialMassesMg.map((mMg, i) => (mMg * 1e-3) / mw[i]); // in moles
    const totalMolesInitial = initialMoles.reduce((a, b) => a + b, 0);
    const initialMoleFractions = initialMoles.map(m => m / totalMolesInitial);
    const partialPressures = initialMoleFractions.map((x, i) => x * items[i].p0);
    const totalInitialP = partialPressures.reduce((a, b) => a + b, 0);
    const vaporContributionPct = partialPressures.map(pp => (totalInitialP > 0 ? (pp / totalInitialP) * 100 : 0));

    // Dynamic K Calibration for realistic evaporation span
    let calibratedK = fixedK ?? 1.25;
    let simMode = fixedK !== null
        ? `معامل ثابت (${fixedK}) - فاصل زمني 1 دقيقة`
        : 'محرك الخصم التراكمي الدقيق (1 دقيقة / رشة 50 مجم)';

    // Minute-by-Minute Simulation Parameters
    const totalMinutes = 24 * 60; // 1440 minutes = 24 hours
    const dtHours = 1.0 / 60.0; // 1 minute in hours
    const deathTimeMinutes: Record<string, number | null> = {};
    materials.forEach(m => { deathTimeMinutes[m] = null; });

    // State arrays: remaining mass in milligrams
    let currentMassMg = [...initialMassesMg];
    const perceivedMinutesPerMaterial: Record<string, number> = {};
    materials.forEach(m => { perceivedMinutesPerMaterial[m] = 0; });

    let peakOv = 0;
    let peakOvMaterial = materials[0];

    const minutePoints: SimulationResultPoint[] = [];

    for (let minute = 0; minute <= totalMinutes; minute++) {
        const tHours = Number((minute / 60.0).toFixed(4));
        const currentMoles = currentMassMg.map((m, i) => (m > 1e-9 ? (m * 1e-3) / mw[i] : 0));
        const totalMolesNow = currentMoles.reduce((acc, m) => acc + m, 0);
        const totalMassNow = currentMassMg.reduce((acc, m) => acc + m, 0);

        const materialsOv: Record<string, number> = {};
        const materialsMass: Record<string, number> = {};
        const depletedThisStep: string[] = [];
        let perceivedCount = 0;

        for (let i = 0; i < n; i++) {
            const matName = materials[i];
            const mass = currentMassMg[i];
            materialsMass[matName] = Number(mass.toFixed(4));

            // Zero Mass Cut-off (نقطة الموت)
            if (mass <= 1e-6 || totalMolesNow <= 1e-15) {
                materialsOv[matName] = 0;
                depletedThisStep.push(matName);
                if (deathTimeMinutes[matName] === null && minute > 0) {
                    deathTimeMinutes[matName] = minute;
                }
                continue;
            }

            // Real-time mole fraction in remaining liquid phase
            const xi = currentMoles[i] / totalMolesNow;

            // حساب التركيز الشمي باستخدام الضغط بالباكال (Pa) لضمان صحة الوحدات
            const vaporGM3 = (xi * pPa[i] * mw[i]) / (R_GAS * T_K); // g/m³
            const vaporNgL = vaporGM3 * 1e6; // تحويل من g/m³ إلى ng/L

            const initialM = initialMassesMg[i];
            const massRatio = Math.max(0, mass / initialM);

            let rawOv = (vaporNgL / odt[i]) * Math.pow(massRatio, 1.4);

            // الانقطاع عند انخفاض الشدة عن حد الإدراك البشري
            if (rawOv < 1e-4 || mass <= 1e-4) {
                rawOv = 0;
                if (deathTimeMinutes[matName] === null && minute > 0) {
                    deathTimeMinutes[matName] = minute;
                }
            }

            materialsOv[matName] = rawOv;

            if (rawOv > peakOv) {
                peakOv = rawOv;
                peakOvMaterial = matName;
            }

            if (rawOv >= 1.0) {
                perceivedCount++;
                perceivedMinutesPerMaterial[matName] += 1;
            }
        }

        minutePoints.push({
            timeHours: tHours,
            timeMinutes: minute,
            materialsOv,
            materialsMass,
            totalMass: Number(totalMassNow.toFixed(4)),
            perceivedCount,
            depletedMaterials: depletedThisStep
        });

        // Cumulative Depletion Step for next minute
        if (minute < totalMinutes) {
            for (let i = 0; i < n; i++) {
                if (currentMassMg[i] <= 1e-6 || totalMolesNow <= 1e-15) {
                    currentMassMg[i] = 0;
                    continue;
                }

                const xi = currentMoles[i] / totalMolesNow;
                // Molar evaporation rate
                const rateMolHr = calibratedK * xi * (pKpa[i] / Math.sqrt(mw[i]));
                const molesLost = rateMolHr * dtHours;
                const massLostMg = molesLost * mw[i] * 1000;

                const newMass = currentMassMg[i] - massLostMg;
                currentMassMg[i] = newMass > 1e-6 ? newMass : 0;
            }
        }
    }

    const summaryRows: SimulationSummaryRow[] = items.map((item, i) => ({
        material: item.material,
        cas: item.cas,
        parts: item.parts,
        mw: item.mw,
        p0: item.p0,
        odt: item.odt,
        odtUnit: item.odtUnit || 'ng/L',
        odtSource: item.odtSource || 'Compendium',
        confidence: item.confidence,
        moles: initialMoles[i],
        moleFraction: initialMoleFractions[i],
        partialPressure: partialPressures[i],
        vaporContributionPct: vaporContributionPct[i],
        initialMassMg: Number(initialMassesMg[i].toFixed(2)),
        deathTimeMinutes: deathTimeMinutes[item.material]
    }));

    let maxPerceivedMins = -1;
    let longestPerceivedMaterial = materials[0];
    for (const m of materials) {
        if (perceivedMinutesPerMaterial[m] > maxPerceivedMins) {
            maxPerceivedMins = perceivedMinutesPerMaterial[m];
            longestPerceivedMaterial = m;
        }
    }

    const finalMass = minutePoints[minutePoints.length - 1].totalMass;
    const initialMassTotal = initialMassesMg.reduce((a, b) => a + b, 0);
    const t90AchievedHours = (finalMass / initialMassTotal) <= 0.11 ? 24.0 : Number((24.0 * (1 - finalMass / initialMassTotal) / 0.9).toFixed(1));

    const timeHours = minutePoints.map(p => p.timeHours);

    return {
        timeHours,
        materials,
        summaryRows,
        timeGridPoints: minutePoints,
        calibratedK: Number(calibratedK.toFixed(4)),
        simMode,
        t90AchievedHours,
        peakOvMaterial,
        longestPerceivedMaterial,
        initialSprayMassMg: totalSprayMassMg,
        timeResolutionMinutes: 1
    };
}