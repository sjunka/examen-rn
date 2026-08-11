import { InMemorySavingsGoalRepository } from './inMemorySavingsGoalRepository';

describe('InMemorySavingsGoalRepository', () => {
  it('findAll returns every goal it was seeded with', () => {
    const repository = new InMemorySavingsGoalRepository([
      { id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 0 },
      { id: '2', name: 'B', targetAmount: 200, accumulatedAmount: 0 },
    ]);

    expect(repository.findAll()).toHaveLength(2);
  });

  it('findById returns undefined for an unknown id', () => {
    const repository = new InMemorySavingsGoalRepository();

    expect(repository.findById('missing')).toBeUndefined();
  });

  it('save replaces an existing goal by id', () => {
    const repository = new InMemorySavingsGoalRepository([
      { id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 0 },
    ]);

    repository.save({ id: '1', name: 'A', targetAmount: 100, accumulatedAmount: 50 });

    expect(repository.findById('1')?.accumulatedAmount).toBe(50);
    expect(repository.findAll()).toHaveLength(1);
  });

  // The defect this fixes: a silent no-op when the id is unknown loses the
  // write. Correct behavior is to insert.
  it('save inserts when the id does not exist, instead of a silent no-op', () => {
    const repository = new InMemorySavingsGoalRepository();

    repository.save({ id: 'new', name: 'Nueva meta', targetAmount: 100, accumulatedAmount: 0 });

    expect(repository.findById('new')).toEqual({
      id: 'new',
      name: 'Nueva meta',
      targetAmount: 100,
      accumulatedAmount: 0,
    });
  });
});
