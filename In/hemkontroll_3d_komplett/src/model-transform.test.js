import { describe, expect, it } from 'vitest';
import { modelPlacement } from './model-transform.js';

describe('RealityScan placement after Z-up to Y-up rotation', () => {
  it('centres an off-origin model, grounds it and fits its horizontal extent', () => {
    const min = [-24.38, -2.30, -29.13];
    const max = [36.90, 7.72, 32.68];
    const { scale, offset } = modelPlacement(min, max);
    expect((min[0] + max[0]) / 2 * scale + offset[0]).toBeCloseTo(0);
    expect((min[2] + max[2]) / 2 * scale + offset[2]).toBeCloseTo(0);
    expect(min[1] * scale + offset[1]).toBeCloseTo(0);
    expect((max[2] - min[2]) * scale).toBeCloseTo(80);
  });
  it('rejects empty or nonfinite bounds', () => {
    expect(() => modelPlacement([0, 0, 0], [0, 0, 0])).toThrow();
    expect(() => modelPlacement([0, 0, 0], [Infinity, 1, 1])).toThrow();
  });
});
