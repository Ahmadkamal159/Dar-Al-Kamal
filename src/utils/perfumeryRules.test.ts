import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFormula, exportMaterialsToCsv } from './perfumeryRules';
import { ALL_MATERIALS, MATERIAL_MAP } from '../data/materialsData';

test('database contains exactly 139 materials from the user sheet', () => {
  assert.equal(ALL_MATERIALS.length, 139, 'Must have exactly 139 materials');
  assert.equal(MATERIAL_MAP.size, 139, 'Map should also contain all 139 entries');
});

test('first and last materials match user PDF specifications', () => {
  const first = MATERIAL_MAP.get(1);
  assert.ok(first, 'Material 1 should exist');
  assert.equal(first.nameEn, 'Labdnum resinoid');
  assert.equal(first.pricePerGram, 15);
  assert.equal(first.cas, '8016-26-0');

  const last = MATERIAL_MAP.get(139);
  assert.ok(last, 'Material 139 should exist');
  assert.equal(last.nameEn, 'Orange oil brazil');
  assert.equal(last.pricePerGram, 5);
});

test('lyral (id 105) is flagged as Prohibited / Banned by IFRA', () => {
  const lyral = MATERIAL_MAP.get(105);
  assert.ok(lyral);
  assert.equal(lyral.nameEn, 'lyral');
  assert.equal(lyral.ifraStatus, 'Prohibited / Banned');
});

test('analyzeFormula detects IFRA violations and calculates pyramid ratios', () => {
  const formula = [
    { materialId: 10, parts: 20, dilutionPercent: 100 }, // Bergamot (Top)
    { materialId: 40, parts: 30, dilutionPercent: 100 }, // Hedione (Heart)
    { materialId: 41, parts: 50, dilutionPercent: 100 }, // Iso E Super (Base)
  ];

  const result = analyzeFormula(formula, 20);
  assert.equal(result.totalWeight, 100);
  assert.equal(result.topPercent, 20);
  assert.equal(result.heartPercent, 30);
  assert.equal(result.basePercent, 50);
  assert.ok(result.totalCostEgp > 0);
  assert.equal(result.ifraWarnings.length, 0);
});

test('analyzeFormula raises warning when banned material is present', () => {
  const formulaWithLyral = [
    { materialId: 105, parts: 5, dilutionPercent: 100 }, // Lyral banned
    { materialId: 40, parts: 95, dilutionPercent: 100 },
  ];

  const result = analyzeFormula(formulaWithLyral, 20);
  assert.ok(result.ifraWarnings.length > 0);
  assert.equal(result.ifraWarnings[0].status, 'Prohibited / Banned');
});

test('exportMaterialsToCsv produces valid CSV string with headers', () => {
  const csv = exportMaterialsToCsv(ALL_MATERIALS.slice(0, 5));
  assert.ok(csv.startsWith('Item #,English Name'));
  assert.ok(csv.includes('Labdnum resinoid'));
});
