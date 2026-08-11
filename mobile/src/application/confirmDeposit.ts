import { isGoalCompleted } from '../domain';
import type { SavingsGoalRepository } from './savingsGoalRepository';

export interface ConfirmDepositResult {
  // Distinguishes the transition to completed from a goal that already was
  // — the caller (e.g. a future native-notification hook) needs to know
  // which deposit actually finished the goal, not just that it's finished.
  justCompleted: boolean;
}

// Business validation lives here, not in the parser: does the goal exist,
// and did this deposit complete it. Amount shape (positive integer, safe,
// numeric) is already guaranteed by parseWebToNativeMessage before this
// runs.
export class ConfirmDeposit {
  constructor(private readonly repository: SavingsGoalRepository) {}

  execute(goalId: string, amount: number): ConfirmDepositResult | null {
    const goal = this.repository.findById(goalId);
    if (!goal) {
      // Deposit against a non-existent goal: leave global state untouched.
      return null;
    }

    const wasCompleted = isGoalCompleted(goal);
    const updated = { ...goal, accumulatedAmount: goal.accumulatedAmount + amount };
    this.repository.save(updated);

    return { justCompleted: !wasCompleted && isGoalCompleted(updated) };
  }
}
