import { fireEvent, render, screen } from '@testing-library/react-native';
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

// __mocks__/react-native-webview.js is applied to the whole suite
// automatically; grab its postMessage spy to assert on.
const { mockPostMessage } = require('react-native-webview');

function renderScreen(onBack = jest.fn()) {
  const store = configureStore({
    reducer: { goals: goalsReducer },
    preloadedState: { goals: { goals: [goal], status: 'success' as const } },
  });
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

  it('ignores messages of an unknown or not-yet-handled type', async () => {
    await renderScreen();

    await sendFromWeb({ type: 'DEPOSIT_CONFIRMED', payload: { goalId: goal.id, amount: 1000 } });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('calls onBack when the back control is pressed', async () => {
    const onBack = jest.fn();
    await renderScreen(onBack);

    fireEvent.press(await screen.findByTestId('goal-detail-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows a not-found state instead of a WebView when the goal id does not resolve', async () => {
    const store = configureStore({
      reducer: { goals: goalsReducer },
      preloadedState: { goals: { goals: [goal], status: 'success' as const } },
    });
    await render(
      <Provider store={store}>
        <GoalDetailScreen goalId="missing" onBack={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByTestId('goal-detail-not-found')).toBeTruthy();
    expect(screen.queryByTestId('goal-detail-webview')).toBeNull();
  });
});
