import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { ConfirmDeposit, type ConfirmDepositResult } from '../application/confirmDeposit';
import { ReduxSavingsGoalRepository } from '../infrastructure/reduxSavingsGoalRepository';
import type { RootState } from '../infrastructure/store/store';

// No useSelector here on purpose, same reasoning as useGoalSnapshot: this
// hook only needs to dispatch, never to re-render GoalDetailScreen (which
// would remount its WebView).
export function useConfirmDeposit(): (goalId: string, amount: number) => ConfirmDepositResult | null {
  const store = useStore<RootState>();
  return useCallback(
    (goalId: string, amount: number) =>
      new ConfirmDeposit(new ReduxSavingsGoalRepository(store)).execute(goalId, amount),
    [store],
  );
}
