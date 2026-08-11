// Presentation rule: rounds, saturates at 100, invalid target -> 0.
// The only definition of "progress" in the app — never reimplement this
// in a screen or component.
export function calculateProgress(accumulated: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((accumulated / target) * 100));
}
