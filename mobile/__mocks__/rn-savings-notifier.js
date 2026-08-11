// Manual mock for the whole suite, same reasoning as react-native-webview.js:
// the real package resolves to a TurboModule at import time, which crashes
// under Jest (no native binary). Auto-applied by Jest for any test that
// imports it, without a per-file jest.mock() call. Both methods default to
// resolving as if the user accepted / the notification scheduled, so tests
// that don't care about this module (e.g. HU3's deposit flow) keep passing
// unchanged; tests that do care import the mocks below to assert on them.
const mockShowConfirmDialog = jest.fn().mockResolvedValue(true);
const mockNotifyGoalCompleted = jest.fn().mockResolvedValue(undefined);

module.exports = {
  __esModule: true,
  showConfirmDialog: mockShowConfirmDialog,
  notifyGoalCompleted: mockNotifyGoalCompleted,
  mockShowConfirmDialog,
  mockNotifyGoalCompleted,
};
