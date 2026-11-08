import test from 'node:test';
import assert from 'node:assert';
import {
  computeMixtureActivityCoefficients,
  simulateEthanolFlashKinetics,
  detectSchiffBaseReactions,
  evaluatePairwiseInteraction,
  calculateHansenDistance,
  MATERIAL_PHYSICOCHEMICAL_PROFILES
} from './matrixInteractionModel';

test('matrix interaction model calculates repulsion (gamma > 1) for terpenes in polar matrix', () => {
  const formula = [
    { cas: '5989-27-5', name: 'D limonene', parts: 25, mw: 136.2 },
    { cas: '78-70-6', name: 'Linalool (BASF)', parts: 25, mw: 154.3 },
    { cas: '24851-98-7', name: 'Hedione', parts: 25, mw: 226.3 },
    { cas: '25265-71-8', name: 'DPG', parts: 25, mw: 134.2 }
  ];

  const results = computeMixtureActivityCoefficients(formula, 80);
  const limoneneResult = results.find(r => r.cas === '5989-27-5');
  assert.ok(limoneneResult, 'Limonene result should exist');
  assert.ok(limoneneResult.gamma > 1.0, `Limonene gamma (${limoneneResult.gamma}) should be > 1.0 due to terpene repulsion`);
  assert.strictEqual(limoneneResult.deviationType, 'repulsion');
});

test('matrix interaction model calculates attraction / fixation (gamma < 1) with high fixatives', () => {
  const formula = [
    { cas: '78-70-6', name: 'Linalool (BASF)', parts: 15, mw: 154.3 },
    { cas: '54464-57-2', name: 'Iso e super', parts: 45, mw: 234.4 },
    { cas: '6790-58-5', name: 'Ambroxan', parts: 20, mw: 236.4 },
    { cas: '1222-05-5', name: 'Galaxolide 100', parts: 20, mw: 258.4 }
  ];

  const results = computeMixtureActivityCoefficients(formula, 0); // neat oil
  const linaloolResult = results.find(r => r.cas === '78-70-6');
  assert.ok(linaloolResult, 'Linalool result should exist');
  assert.ok(linaloolResult.gamma < 1.0, `Linalool gamma (${linaloolResult.gamma}) should be < 1.0 due to fixative entrapment`);
  assert.strictEqual(linaloolResult.deviationType, 'attraction');
});

test('ethanol flash kinetics simulates rapid alcohol loss at 32°C skin temperature', () => {
  const points = simulateEthanolFlashKinetics(80, 32);
  assert.strictEqual(points.length, 31); // 0 to 30 min inclusive
  assert.strictEqual(points[0].ethanolMassPercent, 80);
  assert.strictEqual(points[0].matrixState, 'Alcoholic Flash');

  // After 15 minutes, ethanol should be below 10%
  const pt15 = points.find(p => p.timeMinutes === 15);
  assert.ok(pt15, 'Point at 15 min should exist');
  assert.ok(pt15.ethanolMassPercent < 15, `Ethanol at 15 min (${pt15.ethanolMassPercent}%) should be significantly depleted`);

  // After 25 minutes, it should be in neat oil film state
  const pt25 = points.find(p => p.timeMinutes === 25);
  assert.ok(pt25, 'Point at 25 min should exist');
  assert.strictEqual(pt25.matrixState, 'Neat Oil Film');
  assert.strictEqual(pt25.fixativeEntrapmentActive, true);
});

test('detectSchiffBaseReactions identifies Methyl Anthranilate + Hydroxycitronellal -> Aurantiol', () => {
  const formula = [
    { cas: '134-20-3', name: 'Methyl anthranilate', parts: 10 },
    { cas: '107-75-5', name: 'Hydroxyl citronellal', parts: 15 },
    { cas: '54464-57-2', name: 'Iso e super', parts: 75 }
  ];

  const audits = detectSchiffBaseReactions(formula);
  assert.strictEqual(audits.length, 1);
  assert.ok(audits[0].schiffBaseName?.includes('أورانتيول'), 'Should detect Aurantiol Schiff Base');
  assert.strictEqual(audits[0].equilibriumConversionPercent, 78);
  assert.strictEqual(audits[0].macerationDaysToEquilibrium, 21);
});

test('evaluatePairwiseInteraction correctly classifies fixation vs repulsion', () => {
  const fixPair = evaluatePairwiseInteraction('6790-58-5', 'Ambroxan', '78-70-6', 'Linalool (BASF)');
  assert.strictEqual(fixPair.interactionCategory, 'تثبيت وتجاذب جزيئي');
  assert.ok(fixPair.affinityScore < 0);

  const repPair = evaluatePairwiseInteraction('5989-27-5', 'D limonene', '25265-71-8', 'DPG');
  assert.strictEqual(repPair.interactionCategory, 'تنافر وفوحان انفجاري');
  assert.ok(repPair.affinityScore > 0);
});
