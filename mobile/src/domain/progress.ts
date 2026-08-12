// Presentation rule: rounds, saturates at 100, invalid target -> 0.
// The only definition of "progress" in the app — never reimplement this
// in a screen or component.
const PROGRESS_MAX = 100;

export function calculateProgress(accumulated: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(PROGRESS_MAX, Math.round((accumulated / target) * PROGRESS_MAX));
}
