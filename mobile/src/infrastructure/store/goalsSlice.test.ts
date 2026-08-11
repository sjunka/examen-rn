import goalsReducer, { goalsLoaded, goalUpdated, type GoalsState } from './goalsSlice';

const baseState: GoalsState = {
  goals: [{ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 0 }],
  status: 'success',
};

describe('goalsSlice', () => {
  it('goalUpdated replaces an existing goal', () => {
    const next = goalsReducer(
      baseState,
      goalUpdated({ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 40 }),
    );

    expect(next.goals).toEqual([{ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 40 }]);
  });

  it('goalUpdated inserts when the goal does not exist', () => {
    const next = goalsReducer(
      baseState,
      goalUpdated({ id: '2', name: 'B', targetAmount: 200, accumulatedAmount: 0 }),
    );

    expect(next.goals).toHaveLength(2);
  });

  it('goalsLoaded replaces the whole list', () => {
    const loaded = [{ id: '9', name: 'C', targetAmount: 10, accumulatedAmount: 0 }];

    const next = goalsReducer(baseState, goalsLoaded(loaded));

    expect(next.goals).toEqual(loaded);
  });
});
