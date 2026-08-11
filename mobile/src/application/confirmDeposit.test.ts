import type { SavingsGoal } from '../domain';
import { InMemorySavingsGoalRepository } from '../infrastructure/inMemorySavingsGoalRepository';
import { ConfirmDeposit } from './confirmDeposit';

function makeRepository(overrides: Partial<SavingsGoal> = {}) {
  return new InMemorySavingsGoalRepository([
    { id: '1', name: 'Viaje', targetAmount: 1_000_000, accumulatedAmount: 200_000, ...overrides },
  ]);
}

describe('ConfirmDeposit', () => {
  it('adds the amount to the goal and reports it did not just complete', () => {
    const repository = makeRepository();

    const result = new ConfirmDeposit(repository).execute('1', 300_000);

    expect(result).toEqual({ justCompleted: false });
    expect(repository.findById('1')).toEqual(
      expect.objectContaining({ accumulatedAmount: 500_000 }),
    );
  });

  it('leaves the goal untouched and returns null when it does not exist', () => {
    const repository = makeRepository();

    const result = new ConfirmDeposit(repository).execute('missing', 100);

    expect(result).toBeNull();
    expect(repository.findById('1')).toEqual(
      expect.objectContaining({ accumulatedAmount: 200_000 }),
    );
  });

  it('records a deposit that exceeds the target in full, uncapped', () => {
    const repository = makeRepository({ accumulatedAmount: 900_000 });

    new ConfirmDeposit(repository).execute('1', 500_000);

    expect(repository.findById('1')).toEqual(
      expect.objectContaining({ accumulatedAmount: 1_400_000 }),
    );
  });

  it('reports justCompleted true when the deposit crosses the target', () => {
    const repository = makeRepository({ accumulatedAmount: 900_000 });

    const result = new ConfirmDeposit(repository).execute('1', 100_000);

    expect(result).toEqual({ justCompleted: true });
  });

  it('reports justCompleted false when the goal was already complete before this deposit', () => {
    const repository = makeRepository({ accumulatedAmount: 1_000_000 });

    const result = new ConfirmDeposit(repository).execute('1', 50_000);

    expect(result).toEqual({ justCompleted: false });
  });
});
