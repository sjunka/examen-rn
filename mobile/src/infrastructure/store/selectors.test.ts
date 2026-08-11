import type { RootState } from './store';
import { selectGoalById, selectGoals } from './selectors';

const state = {
  goals: {
    goals: [{ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 50 }],
    status: 'success',
  },
} as RootState;

describe('selectGoals', () => {
  it('returns the goals list', () => {
    expect(selectGoals(state)).toBe(state.goals.goals);
  });
});

describe('selectGoalById', () => {
  it('returns the matching goal', () => {
    expect(selectGoalById(state, '1')).toEqual({
      id: '1',
      name: 'A',
      targetAmount: 100,
      accumulatedAmount: 50,
    });
  });

  it('returns undefined when no goal matches', () => {
    expect(selectGoalById(state, 'missing')).toBeUndefined();
  });
});
