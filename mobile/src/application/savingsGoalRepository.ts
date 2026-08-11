import type { SavingsGoal } from '../domain';

// Port. Two real implementations exist: ReduxSavingsGoalRepository (app)
// and InMemorySavingsGoalRepository (tests) — see src/infrastructure.
export interface SavingsGoalRepository {
  findAll(): SavingsGoal[];
  findById(id: string): SavingsGoal | undefined;
  save(goal: SavingsGoal): void;
}
