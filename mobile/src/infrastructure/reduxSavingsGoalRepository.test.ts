import { configureStore } from '@reduxjs/toolkit';
import goalsReducer, { type GoalsState } from './store/goalsSlice';
import { ReduxSavingsGoalRepository } from './reduxSavingsGoalRepository';

function makeStore(initialGoals: GoalsState['goals']) {
  return configureStore({
    reducer: { goals: goalsReducer },
    preloadedState: { goals: { goals: initialGoals, status: 'success' as const } },
  });
}

describe('ReduxSavingsGoalRepository', () => {
  it('findAll reads from the store', () => {
    const store = makeStore([{ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 0 }]);
    const repository = new ReduxSavingsGoalRepository(store);

    expect(repository.findAll()).toHaveLength(1);
  });

  it('save dispatches an update the store then reflects', () => {
    const store = makeStore([{ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 0 }]);
    const repository = new ReduxSavingsGoalRepository(store);

    repository.save({ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 30 });

    expect(repository.findById('1')?.accumulatedAmount).toBe(30);
  });
});
