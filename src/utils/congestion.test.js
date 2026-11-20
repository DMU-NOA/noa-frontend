import test from 'node:test';
import assert from 'node:assert/strict';
import { congestionStage, currentCongestionLevel } from './congestion.js';

test('four levels stay distinct and unknown labels are unavailable', () => {
  assert.deepEqual(['여유', '보통', '약간 붐빔', '붐빔'].map(congestionStage), [0, 1, 2, 3]);
  assert.equal(congestionStage('slightly crowded'), 2);
  assert.equal(congestionStage('unrecognized'), -1);
});

test('only recent, non-future evidence is shown', () => {
  const now = Date.parse('2026-11-20T12:00:00+09:00');
  const spot = { congestion_level: '보통', updated_at: '2026-11-20T11:30:00+09:00' };
  assert.equal(currentCongestionLevel(spot, now), '보통');
  for (const updated_at of [null, 'invalid', '2026-11-20T11:00:00+09:00', '2026-11-20T12:01:00+09:00']) {
    assert.equal(currentCongestionLevel({ ...spot, updated_at }, now), null);
  }
});
