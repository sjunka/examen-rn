import { formatCOP, isValidAmount } from './money';

describe('formatCOP', () => {
  it('formats an integer as Colombian pesos', () => {
    expect(formatCOP(1_250_000)).toContain('1.250.000');
  });
});

describe('isValidAmount', () => {
  it('accepts a positive safe integer', () => {
    expect(isValidAmount(1000)).toBe(true);
  });

  it.each([0, -1000, 1.5, NaN, Infinity])('rejects %p', value => {
    expect(isValidAmount(value)).toBe(false);
  });
});
