/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert';
import { getClosestMatches, scoreMaterialMatch } from './closestMatchSearch.ts';

const SAMPLE_MATERIALS = [
  { id: 1, nameEn: 'Labdanum resinoid', nameAr: 'راتنج اللادنوم', chemicalName: 'Cistus ladaniferus extract' },
  { id: 2, nameEn: 'Iso E Super', nameAr: 'آيزو إي سوبر', chemicalName: 'Tetramethyl acetyloctahydronaphthalenes' },
  { id: 3, nameEn: 'Aldehyde C-10', nameAr: 'ألدهيد سي 10', chemicalName: 'Decanal' },
  { id: 4, nameEn: 'Aldehyde C-11', nameAr: 'ألدهيد سي 11', chemicalName: 'Undec-10-enal' },
  { id: 5, nameEn: 'Aldehyde C-12', nameAr: 'ألدهيد سي 12', chemicalName: 'Dodecanal (Lauric aldehyde)' },
  { id: 6, nameEn: 'Ambroxan', nameAr: 'أمبروكسان', chemicalName: 'Ambrox' },
  { id: 7, nameEn: 'Cyclamen aldehyde', nameAr: 'ألدهيد السيكلامين', chemicalName: '3-(4-isopropylphenyl)-2-methylpropanal' },
  { id: 42, nameEn: 'Ethylene brassylate', nameAr: 'براسيلات الإيثيلين', chemicalName: '1,4-Dioxacycloheptadecane-5,17-dione (Musk T)' },
  { id: 8, nameEn: 'Vanillin', nameAr: 'فانيلين', chemicalName: '4-hydroxy-3-methoxybenzaldehyde' },
  { id: 9, nameEn: 'Aurantiol', nameAr: 'أورانتول', chemicalName: 'Schiff base' }
];

test('single letter "A" gives results starting with A as top matches', () => {
  const results = getClosestMatches(SAMPLE_MATERIALS, 'A');
  
  // All results starting with 'A' in nameEn should come before results that only contain 'a'
  const firstFour = results.slice(0, 4).map(r => r.nameEn);
  
  // Should include Aldehydes, Ambroxan, Aurantiol
  assert.ok(firstFour.every(name => name.startsWith('A')), `Expected top items to start with A, got: ${firstFour.join(', ')}`);
  
  // Labdanum has 'a' but does not start with 'A', so it should come after items starting with 'A'
  const labdanumIdx = results.findIndex(r => r.nameEn === 'Labdanum resinoid');
  const aldehydeIdx = results.findIndex(r => r.nameEn.startsWith('Aldehyde'));
  assert.ok(labdanumIdx > aldehydeIdx, 'Labdanum should come after Aldehyde when querying "A"');
});

test('typo search "aldehide" returns Aldehydes at the top', () => {
  const results = getClosestMatches(SAMPLE_MATERIALS, 'aldehide');
  assert.ok(results.length > 0, 'Should find results for aldehide');
  assert.ok(
    results[0].nameEn.toLowerCase().includes('aldehyde'),
    `Top result should be an aldehyde, got: ${results[0].nameEn}`
  );
});

test('search "labdanum" returns Labdanum resinoid at the top', () => {
  const results = getClosestMatches(SAMPLE_MATERIALS, 'labdanum');
  assert.strictEqual(results[0].id, 1);
  assert.strictEqual(results[0].nameEn, 'Labdanum resinoid');
});

test('search "brasile" returns Ethylene brassylate at the top', () => {
  const results = getClosestMatches(SAMPLE_MATERIALS, 'brasile');
  assert.ok(results.length > 0, 'Should find results for brasile');
  assert.strictEqual(results[0].id, 42);
  assert.strictEqual(results[0].nameEn, 'Ethylene brassylate');
});

test('exact ID query "#42" or "42" ranks item #42 first', () => {
  const resultsHash = getClosestMatches(SAMPLE_MATERIALS, '#42');
  assert.strictEqual(resultsHash[0].id, 42);

  const resultsNum = getClosestMatches(SAMPLE_MATERIALS, '42');
  assert.strictEqual(resultsNum[0].id, 42);
});
