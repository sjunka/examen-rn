import { useMemo } from 'react';
import { useStore } from 'react-redux';
import type { SavingsGoal } from '../domain';
import { ReduxSavingsGoalRepository } from '../infrastructure/reduxSavingsGoalRepository';
import type { RootState } from '../infrastructure/store/store';

// Reads the goal once via the repository port, without useSelector. After
// mount this screen renders nothing derived from the goal — the micro-app
// inside the WebView does — so a subscription would re-render it on every
// deposit with no observable effect.
//
// It does NOT protect the WebView from reloading: a re-render with a stable
// `source` neither remounts nor reloads it. What protects the micro-app's
// session is `source` keeping one identity, and that invariant has its own
// test (screens/webViewStability.test.tsx) rather than resting on this hook.
export function useGoalSnapshot(goalId: string): SavingsGoal | undefined {
  const store = useStore<RootState>();
  return useMemo(
    () => new ReduxSavingsGoalRepository(store).findById(goalId),
    [store, goalId],
  );
}
