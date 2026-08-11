import { render, screen } from '@testing-library/react-native';
import { GoalRow } from './GoalRow';

describe('GoalRow', () => {
  it('shows name, formatted amounts and the derived percentage', async () => {
    await render(
      <GoalRow
        goal={{ id: '1', name: 'Viaje a Cartagena', targetAmount: 3_000_000, accumulatedAmount: 1_500_000 }}
      />,
    );

    expect(screen.getByText('Viaje a Cartagena')).toBeTruthy();
    expect(screen.getByText(/3\.000\.000/)).toBeTruthy();
    expect(screen.getByText(/1\.500\.000/)).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  // Same pinned regression, at the component level: the row shows 100%
  // even though the goal is not actually complete.
  it('shows 100% for 4.980.000/5.000.000 without asserting completion', async () => {
    await render(
      <GoalRow
        goal={{ id: '2', name: 'Fondo de emergencia', targetAmount: 5_000_000, accumulatedAmount: 4_980_000 }}
      />,
    );

    expect(screen.getByText('100%')).toBeTruthy();
  });
});
