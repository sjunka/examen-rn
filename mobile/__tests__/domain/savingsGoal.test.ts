import { calculateProgress } from '../../src/domain/progress';
import { isGoalCompleted, type SavingsGoal } from '../../src/domain/savingsGoal';

function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: '1',
    name: 'Meta',
    targetAmount: 5_000_000,
    accumulatedAmount: 0,
    ...overrides,
  };
}

describe('isGoalCompleted', () => {
  it('is true when accumulated equals target', () => {
    expect(isGoalCompleted(makeGoal({ accumulatedAmount: 5_000_000 }))).toBe(true);
  });

  it('is true when accumulated exceeds target', () => {
    expect(isGoalCompleted(makeGoal({ accumulatedAmount: 5_500_000 }))).toBe(true);
  });

  it('is false when accumulated is below target', () => {
    expect(isGoalCompleted(makeGoal({ accumulatedAmount: 4_999_999 }))).toBe(false);
  });

  // The pinned regression case: rounded progress reports 100% but the goal
  // is 20.000 pesos short, so it must not read as completed.
  it('4.980.000 sobre un objetivo de 5.000.000 se muestra como 100% pero la meta no está cumplida', () => {
    const goal = makeGoal({ targetAmount: 5_000_000, accumulatedAmount: 4_980_000 });

    expect(calculateProgress(goal.accumulatedAmount, goal.targetAmount)).toBe(100);
    expect(isGoalCompleted(goal)).toBe(false);
  });
});
