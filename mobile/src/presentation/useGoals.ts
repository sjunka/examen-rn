import { useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';
import type { SavingsGoal } from '../domain';
import { GetGoals } from '../application/getGoals';
import { ReduxSavingsGoalRepository } from '../infrastructure/reduxSavingsGoalRepository';
import { selectGoals } from '../infrastructure/store/selectors';
import type { RootState } from '../infrastructure/store/store';

// Presentation reads through the use case / port, never straight from the
// slice — selectGoals below only subscribes so the hook re-renders on change.
export function useGoals(): SavingsGoal[] {
  const store = useStore<RootState>();
  useSelector(selectGoals); // subscribes so the hook re-renders on store changes
  const repository = useMemo(() => new ReduxSavingsGoalRepository(store), [store]);

  return new GetGoals(repository).execute();
}
