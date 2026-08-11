export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  accumulatedAmount: number;
}

// Business rule: the only definition of "completed". Compares raw amounts,
// never the rounded percentage from calculateProgress — a goal can show
// 100% (rounded) while still short of its target.
export function isGoalCompleted(goal: SavingsGoal): boolean {
  return goal.accumulatedAmount >= goal.targetAmount;
}
