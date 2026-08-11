import { InMemorySavingsGoalRepository } from '../infrastructure/inMemorySavingsGoalRepository';
import { GetGoals } from './getGoals';

describe('GetGoals', () => {
  it('returns all goals from the repository it depends on', () => {
    const repository = new InMemorySavingsGoalRepository([
      { id: '1', name: 'Viaje', targetAmount: 1000, accumulatedAmount: 500 },
    ]);

    const goals = new GetGoals(repository).execute();

    expect(goals).toEqual([{ id: '1', name: 'Viaje', targetAmount: 1000, accumulatedAmount: 500 }]);
  });

  it('returns an empty list when the repository has no goals', () => {
    const goals = new GetGoals(new InMemorySavingsGoalRepository()).execute();

    expect(goals).toEqual([]);
  });
});
