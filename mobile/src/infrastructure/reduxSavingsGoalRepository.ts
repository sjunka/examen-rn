import type { Store } from '@reduxjs/toolkit';
import type { SavingsGoal } from '../domain';
import type { SavingsGoalRepository } from '../application/savingsGoalRepository';
import { goalUpdated } from './store/goalsSlice';
import { selectGoalById, selectGoals } from './store/selectors';
import type { RootState } from './store/store';

// Production implementation of the port. Reads from store.getState(),
// writes with dispatch — Redux stays the single source of truth, the
// domain never sees it.
export class ReduxSavingsGoalRepository implements SavingsGoalRepository {
  constructor(private readonly store: Store<RootState>) {}

  findAll(): SavingsGoal[] {
    return selectGoals(this.store.getState());
  }

  findById(id: string): SavingsGoal | undefined {
    return selectGoalById(this.store.getState(), id);
  }

  save(goal: SavingsGoal): void {
    this.store.dispatch(goalUpdated(goal));
  }
}
