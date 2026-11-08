/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { solveKineticModel, DEFAULT_SPRAY_MASS_MG } from './kineticSolver';

test('kinetic solver correctly computes minute-by-minute depletion from 50mg spray', () => {
  const sampleItems = [
    {
      material: 'Limonene',
      cas: '5989-27-5',
      parts: 20,
      mw: 136.24,
      p0: 1.5, // mmHg
      odt: 10.0, // ng/L
      odtUnit: 'ng/L',
      odtSource: 'Nagata 2003',
      confidence: 'High (Experimental)' as const
    },
    {
      material: 'Hedione',
      cas: '24851-98-7',
      parts: 40,
      mw: 226.31,
      p0: 0.001, // mmHg
      odt: 15.0, // ng/L
      odtUnit: 'ng/L',
      odtSource: 'van Gemert 2011',
      confidence: 'High (Experimental)' as const
    },
    {
      material: 'Ambroxan',
      cas: '6790-58-5',
      parts: 40,
      mw: 236.39,
      p0: 0.0002, // mmHg
      odt: 0.2, // ng/L
      odtUnit: 'ng/L',
      odtSource: 'van Gemert 2011',
      confidence: 'High (Experimental)' as const
    }
  ];

  const result = solveKineticModel(sampleItems);

  // Check calibration and minute resolution
  assert.ok(result.calibratedK > 0, 'K must be positive');
  assert.equal(result.timeGridPoints.length, 1441, 'Should have 1441 minute points (0 to 1440 min)');

  // 1. Check Initial Spray Mass (50 mg total)
  const initialMass = result.timeGridPoints[0].totalMass;
  assert.ok(Math.abs(initialMass - DEFAULT_SPRAY_MASS_MG) < 0.1, `Initial mass should be ~50mg, got ${initialMass}`);

  // 2. Cumulative Depletion: mass at minute 60 is strictly less than at minute 0
  const massAt1h = result.timeGridPoints[60].totalMass;
  assert.ok(massAt1h < initialMass, 'Mass after 1 hour must be strictly depleted');

  // 3. Zero Mass Cut-off: Limonene exhausts much earlier than 24h
  const limoneneFinalOv = result.timeGridPoints[1440].materialsOv['Limonene'];
  assert.equal(limoneneFinalOv, 0, 'Limonene must hit zero mass cut-off and collapse to 0 before 24h');

  // 4. Correction of Dominance Illusion: Ambroxan does NOT increase infinitely
  // Its OV peaks during middle hours and then declines as its own mass depletes
  const ambroxanOvEarly = result.timeGridPoints[120].materialsOv['Ambroxan']; // 2h
  const ambroxanOvLate = result.timeGridPoints[1440].materialsOv['Ambroxan']; // 24h
  assert.ok(ambroxanOvLate < ambroxanOvEarly || ambroxanOvLate === 0, 'Ambroxan must eventually decline as its mass depletes');
});

test('throws error if required physical parameters are missing', () => {
  assert.throws(() => {
    solveKineticModel([
      {
        material: 'Broken',
        cas: '',
        parts: 10,
        mw: 0, // invalid MW
        p0: 1.0,
        odt: 1.0,
        odtUnit: 'ng/L',
        odtSource: '',
        confidence: 'High (Experimental)' as const
      }
    ]);
  }, /الوزن الجزيئي/);
});
