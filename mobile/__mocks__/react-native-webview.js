// Manual mock for the whole suite: react-native-webview loads a
// TurboModule at import time, which crashes under Jest (no native binary).
// Auto-applied by Jest for any test that imports it, without a per-file
// jest.mock() call. Renders as a plain View carrying the real onMessage
// prop, so tests drive it like any other component via its testID.
const React = require('react');
const { View } = require('react-native');

const mockPostMessage = jest.fn();

// Mount/render probes. The real WebView reloads its page when `source`
// changes identity and restarts it entirely when the component remounts —
// both invisible through the View this mock renders, so they are recorded
// here instead. See webViewStability.test.tsx.
const mockWebViewMount = jest.fn();
const mockWebViewRender = jest.fn();

const WebView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({ postMessage: mockPostMessage }));
  mockWebViewRender(props);
  React.useEffect(() => {
    mockWebViewMount();
  }, []);
  return React.createElement(View, { testID: props.testID, onMessage: props.onMessage });
});

module.exports = {
  __esModule: true,
  default: WebView,
  mockPostMessage,
  mockWebViewMount,
  mockWebViewRender,
};
