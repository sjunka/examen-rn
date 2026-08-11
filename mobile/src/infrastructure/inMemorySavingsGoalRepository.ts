import type { SavingsGoal } from '../domain';
import type { SavingsGoalRepository } from '../application/savingsGoalRepository';

// Test implementation of the port. Unlike the flawed reference version,
// save() inserts when the id doesn't exist instead of a silent no-op.
export class InMemorySavingsGoalRepository implements SavingsGoalRepository {
  private goals: SavingsGoal[];

  constructor(goals: SavingsGoal[] = []) {
    this.goals = [...goals];
  }

  findAll(): SavingsGoal[] {
    return [...this.goals];
  }

  findById(id: string): SavingsGoal | undefined {
    return this.goals.find(goal => goal.id === id);
  }

  save(goal: SavingsGoal): void {
    const index = this.goals.findIndex(existing => existing.id === goal.id);
    if (index === -1) {
      this.goals.push(goal);
    } else {
      this.goals[index] = goal;
    }
  }
}
