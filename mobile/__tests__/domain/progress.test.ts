import { calculateProgress } from '../../src/domain/progress';

describe('calculateProgress', () => {
  it('returns 0 for 0/100', () => {
    expect(calculateProgress(0, 100)).toBe(0);
  });

  it('returns 50 for 50/100', () => {
    expect(calculateProgress(50, 100)).toBe(50);
  });

  it('returns 100 for 100/100', () => {
    expect(calculateProgress(100, 100)).toBe(100);
  });

  it('saturates at 100 when accumulated exceeds target', () => {
    expect(calculateProgress(150, 100)).toBe(100);
  });

  it('returns 0 when target is zero', () => {
    expect(calculateProgress(50, 0)).toBe(0);
  });

  it('returns 0 when target is negative', () => {
    expect(calculateProgress(50, -100)).toBe(0);
  });

  it('rounds to the nearest whole percent', () => {
    expect(calculateProgress(1, 3)).toBe(33);
  });

  // The edge case that motivated splitting progress from completion:
  // rounds up to 100% while 20.000 pesos are still missing.
  it('rounds 4.980.000/5.000.000 up to 100', () => {
    expect(calculateProgress(4_980_000, 5_000_000)).toBe(100);
  });
});
