import type { SavingsGoal } from '../domain';
import type { SavingsGoalRepository } from './savingsGoalRepository';

// Depends on the port, never on a concrete implementation.
export class GetGoals {
  constructor(private readonly repository: SavingsGoalRepository) {}

  execute(): SavingsGoal[] {
    return this.repository.findAll();
  }
}
