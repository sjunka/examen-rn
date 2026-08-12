import { act, render, screen } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import goalsReducer, { goalUpdated } from '../../../src/infrastructure/store/goalsSlice';
import { GoalDetailScreen } from '../../../src/presentation/screens/GoalDetailScreen';

// The demo trap this file exists for (#12): while the detail is open, the
// micro-app inside the WebView must never restart — a restart blanks the
// detail and loses the session established by the WEB_APP_READY handshake.
//
// Only two things actually cause it, and neither is visible to any other
// test in the suite because both need a real WebView to show up:
//
//   1. `source` arrives with a new object identity -> react-native-webview
//      reloads the page, even though the component never remounted. This is
//      the realistic one: an inlined `source={{ html }}`, or a `source`
//      derived from the goal, reloads on every render.
//   2. The WebView remounts -> the micro-app restarts from scratch. Needs
//      something to actually change its identity or its `key`, which today
//      only happens if the screen both subscribes to the store and keys the
//      WebView by goal data.
//
// Note what is deliberately NOT asserted here: that the screen doesn't
// re-render. A re-render with a stable `source` neither remounts nor
// reloads, so pinning render counts would test an implementation detail
// rather than the behaviour that matters.
const goal = {
  id: '1',
  name: 'Viaje a Cartagena',
  targetAmount: 3_000_000,
  accumulatedAmount: 1_500_000,
};

// __mocks__/react-native-webview.js is applied to the whole suite
// automatically; grab its render/mount probes to assert on.
const { mockWebViewMount, mockWebViewRender } = require('react-native-webview');

function makeStore() {
  return configureStore({
    reducer: { goals: goalsReducer },
    preloadedState: { goals: { goals: [goal], status: 'success' as const } },
  });
}

function detail(store: ReturnType<typeof makeStore>) {
  return (
    <Provider store={store}>
      <GoalDetailScreen goalId={goal.id} onBack={() => {}} />
    </Provider>
  );
}

beforeEach(() => {
  mockWebViewMount.mockClear();
  mockWebViewRender.mockClear();
});

describe('WebView stability while the detail screen is open', () => {
  it('survives a re-render and a deposit without reloading or restarting the micro-app', async () => {
    const store = makeStore();
    // RTL v14 renders concurrently here: render/rerender return promises and
    // must be awaited or the tree is still empty when the assertions run.
    const view = await render(detail(store));
    await screen.findByTestId('goal-detail-webview');

    // A new onBack identity stands in for any parent re-render — the cheapest
    // way to reach failure mode 1 without depending on how this screen
    // happens to subscribe to the store today.
    await view.rerender(detail(store));
    await screen.findByTestId('goal-detail-webview');

    // A deposit landing in the store while the detail is open: the exact
    // sequence of HU3, and what reaches failure mode 2 if the WebView is ever
    // keyed by goal data.
    await act(async () => {
      store.dispatch(goalUpdated({ ...goal, accumulatedAmount: 2_000_000 }));
    });
    await screen.findByTestId('goal-detail-webview');

    const sources = mockWebViewRender.mock.calls.map(
      ([props]: [{ source: unknown }]) => props.source,
    );
    expect(sources.length).toBeGreaterThan(1);
    // Identity, not deep equality: an equal-but-new object still reloads.
    for (const source of sources) {
      expect(source).toBe(sources[0]);
    }
    expect(mockWebViewMount).toHaveBeenCalledTimes(1);
  });
});
