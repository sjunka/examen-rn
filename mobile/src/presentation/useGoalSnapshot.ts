import { useMemo } from 'react';
import { useStore } from 'react-redux';
import type { SavingsGoal } from '../domain';
import { ReduxSavingsGoalRepository } from '../infrastructure/reduxSavingsGoalRepository';
import type { RootState } from '../infrastructure/store/store';

// Reads the goal once via the repository port, without useSelector —
// GoalDetailScreen must not subscribe to store changes: a deposit made
// elsewhere updates GoalsScreen, and the detail screen re-rendering would
// remount its WebView and reload the micro-app (see D11 in the spec).
export function useGoalSnapshot(goalId: string): SavingsGoal | undefined {
  const store = useStore<RootState>();
  return useMemo(
    () => new ReduxSavingsGoalRepository(store).findById(goalId),
    [store, goalId],
  );
}
