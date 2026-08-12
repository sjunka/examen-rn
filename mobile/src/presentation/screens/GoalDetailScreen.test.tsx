import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import goalsReducer from '../../infrastructure/store/goalsSlice';
import { GoalDetailScreen } from './GoalDetailScreen';

const goal = {
  id: '1',
  name: 'Viaje a Cartagena',
  targetAmount: 3_000_000,
  accumulatedAmount: 1_500_000,
};

// __mocks__/react-native-webview.js and __mocks__/rn-savings-notifier.js are
// applied to the whole suite automatically; grab their spies to assert on.
const { mockPostMessage } = require('react-native-webview');
const { mockShowConfirmDialog, mockNotifyGoalCompleted } = require('rn-savings-notifier');

function makeStore() {
  return configureStore({
    reducer: { goals: goalsReducer },
    preloadedState: { goals: { goals: [goal], status: 'success' as const } },
  });
}

function renderScreen(store = makeStore(), onBack = jest.fn()) {
  return render(
    <Provider store={store}>
      <GoalDetailScreen goalId={goal.id} onBack={onBack} />
    </Provider>,
  );
}

async function sendFromWeb(message: unknown) {
  const webview = await screen.findByTestId('goal-detail-webview');
  fireEvent(webview, 'message', { nativeEvent: { data: JSON.stringify(message) } });
}

beforeEach(() => {
  mockPostMessage.mockClear();
  mockShowConfirmDialog.mockClear().mockResolvedValue(true);
  mockNotifyGoalCompleted.mockClear().mockResolvedValue(undefined);
});

describe('GoalDetailScreen', () => {
  it('replies with the session, including the goal snapshot, once the web announces it is ready', async () => {
    await renderScreen();

    await sendFromWeb({ type: 'WEB_APP_READY' });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockPostMessage.mock.calls[0][0])).toEqual({
      type: 'SESSION_INITIALIZED',
      payload: {
        sessionId: 'session-1',
        userInfo: { name: 'Ahorrador Demo' },
        goal,
      },
    });
  });

  it('replies again on a repeated WEB_APP_READY instead of losing the session', async () => {
    await renderScreen();

    await sendFromWeb({ type: 'WEB_APP_READY' });
    await sendFromWeb({ type: 'WEB_APP_READY' });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
  });

  it('ignores malformed JSON without crashing or replying', async () => {
    await renderScreen();

    const webview = await screen.findByTestId('goal-detail-webview');
    fireEvent(webview, 'message', { nativeEvent: { data: 'not json' } });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('shows the native confirm dialog, updates Redux, and notifies the web of the new accumulated amount', async () => {
    const store = makeStore();
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 1000 } });

    await waitFor(() =>
      expect(store.getState().goals.goals[0].accumulatedAmount).toBe(goal.accumulatedAmount + 1000),
    );
    expect(mockShowConfirmDialog).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'ACCUMULATED_AMOUNT_UPDATED',
        payload: { accumulatedAmount: goal.accumulatedAmount + 1000 },
      }),
    );
  });

  it('cancelling the confirm dialog registers no deposit and leaves the store untouched', async () => {
    mockShowConfirmDialog.mockResolvedValue(false);
    const store = makeStore();
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 1000 } });

    await waitFor(() => expect(mockShowConfirmDialog).toHaveBeenCalledTimes(1));
    expect(store.getState().goals.goals).toEqual([goal]);
  });

  it('leaves the store untouched when the deposit targets a non-existent goal', async () => {
    const store = makeStore();
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: 'missing', amount: 1000 } });

    await waitFor(() => expect(mockShowConfirmDialog).toHaveBeenCalledTimes(1));
    expect(store.getState().goals.goals).toEqual([goal]);
  });

  it('ignores malformed deposit payloads (shape rejected before it reaches the store, and never shows the dialog)', async () => {
    const store = makeStore();
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: -5 } });

    expect(store.getState().goals.goals).toEqual([goal]);
    expect(mockShowConfirmDialog).not.toHaveBeenCalled();
  });

  it('notifies exactly once when a deposit completes the goal', async () => {
    const store = configureStore({
      reducer: { goals: goalsReducer },
      preloadedState: {
        goals: { goals: [{ ...goal, accumulatedAmount: 2_900_000 }], status: 'success' as const },
      },
    });
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 100_000 } });

    await waitFor(() => expect(mockNotifyGoalCompleted).toHaveBeenCalledTimes(1));
    expect(mockNotifyGoalCompleted).toHaveBeenCalledWith(goal.name);
  });

  it('does not notify when a deposit does not complete the goal', async () => {
    const store = makeStore();
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 1000 } });

    await waitFor(() =>
      expect(store.getState().goals.goals[0].accumulatedAmount).toBe(goal.accumulatedAmount + 1000),
    );
    expect(mockNotifyGoalCompleted).not.toHaveBeenCalled();
  });

  it('does not notify again on a further deposit to an already-completed goal', async () => {
    const store = configureStore({
      reducer: { goals: goalsReducer },
      preloadedState: {
        goals: { goals: [{ ...goal, accumulatedAmount: goal.targetAmount }], status: 'success' as const },
      },
    });
    await renderScreen(store);

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 100_000 } });

    await waitFor(() =>
      expect(store.getState().goals.goals[0].accumulatedAmount).toBe(goal.targetAmount + 100_000),
    );
    expect(mockNotifyGoalCompleted).not.toHaveBeenCalled();
  });

  it('calls onBack when the back control is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(makeStore(), onBack);

    fireEvent.press(await screen.findByTestId('goal-detail-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows a not-found state instead of a WebView when the goal id does not resolve', async () => {
    const store = makeStore();
    await render(
      <Provider store={store}>
        <GoalDetailScreen goalId="missing" onBack={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByTestId('goal-detail-not-found')).toBeTruthy();
    expect(screen.queryByTestId('goal-detail-webview')).toBeNull();
  });
});
