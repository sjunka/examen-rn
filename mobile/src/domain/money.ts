// Money: integer pesos colombianos, no decimals, no floating point.
export function isValidAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount > 0;
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCOP(amount: number): string {
  return copFormatter.format(amount);
}
