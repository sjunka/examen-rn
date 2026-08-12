import { fireEvent, render, screen } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { useState } from 'react';
import goalsReducer from '../../src/infrastructure/store/goalsSlice';
import { GoalsScreen } from '../../src/presentation/screens/GoalsScreen';
import { GoalDetailScreen } from '../../src/presentation/screens/GoalDetailScreen';

// End-to-end: a raw string arrives on the WebView's onMessage channel and
// the assertion lands on what the listing renders — no shortcut through
// Redux or the use case directly. Two manual mocks apply to the whole
// suite (__mocks__/): react-native-webview and rn-savings-notifier
// (default: confirm dialog accepted, notification scheduled) — the dialog
// gate, cancel, and notification-trigger cases are covered in
// GoalDetailScreen.test.tsx (HU4), not duplicated here.
const goal = {
  id: '1',
  name: 'Viaje a Cartagena',
  targetAmount: 3_000_000,
  accumulatedAmount: 1_500_000,
};

function Navigator() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  return selectedGoalId === null ? (
    <GoalsScreen onSelectGoal={setSelectedGoalId} />
  ) : (
    <GoalDetailScreen goalId={selectedGoalId} onBack={() => setSelectedGoalId(null)} />
  );
}

function renderApp() {
  const store = configureStore({
    reducer: { goals: goalsReducer },
    preloadedState: { goals: { goals: [goal], status: 'success' as const } },
  });
  return render(
    <Provider store={store}>
      <Navigator />
    </Provider>,
  );
}

async function sendRawFromWeb(raw: string) {
  const webview = await screen.findByTestId('goal-detail-webview');
  fireEvent(webview, 'message', { nativeEvent: { data: raw } });
}

describe('deposit flow (HU3)', () => {
  it('a valid deposit confirmed on the web updates the accumulated amount and percentage on the native listing', async () => {
    await renderApp();

    fireEvent.press((await screen.findAllByTestId('goal-row'))[0]);
    await sendRawFromWeb(
      JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 500_000 } }),
    );
    fireEvent.press(await screen.findByTestId('goal-detail-back'));

    expect(await screen.findByText(/2\.000\.000/)).toBeTruthy();
    expect(await screen.findByText('67%')).toBeTruthy();
  });

  it('malformed JSON from the web leaves the listing unchanged', async () => {
    await renderApp();

    fireEvent.press((await screen.findAllByTestId('goal-row'))[0]);
    await sendRawFromWeb('not json');
    fireEvent.press(await screen.findByTestId('goal-detail-back'));

    expect(await screen.findByText(/1\.500\.000/)).toBeTruthy();
    expect(await screen.findByText('50%')).toBeTruthy();
  });

  it('a deposit against a non-existent goal leaves the listing unchanged', async () => {
    await renderApp();

    fireEvent.press((await screen.findAllByTestId('goal-row'))[0]);
    await sendRawFromWeb(
      JSON.stringify({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: 'missing', amount: 500_000 } }),
    );
    fireEvent.press(await screen.findByTestId('goal-detail-back'));

    expect(await screen.findByText(/1\.500\.000/)).toBeTruthy();
    expect(await screen.findByText('50%')).toBeTruthy();
  });
});
