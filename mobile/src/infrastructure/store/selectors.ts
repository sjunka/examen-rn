import type { RootState } from './store';

export const selectGoals = (state: RootState) => state.goals.goals;

export const selectGoalById = (state: RootState, id: string) =>
  state.goals.goals.find(goal => goal.id === id);
