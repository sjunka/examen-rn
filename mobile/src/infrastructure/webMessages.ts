import type { SavingsGoal } from '../domain';

// Single shared module for the WebView <-> native message contract, as
// discriminated unions so a missing case fails to typecheck. web/index.html
// has no module system to import this from (plain static HTML/JS), so it
// mirrors these `type` string literals by hand — this module is still the
// one definition on the native side; see the catalog in the root README.
export type WebToNativeMessage =
  | { type: 'WEB_APP_READY' }
  | { type: 'DEPOSIT_CONFIRMED'; payload: { goalId: string; amount: number } };

// SESSION_INITIALIZED's payload is extended beyond the exam's example to
// carry a goal snapshot: without it the web receives an id but nothing to
// render the detail with, and HU2 can't be satisfied. Documented in the
// README catalog as a legitimate, deliberate extension.
export type NativeToWebMessage = {
  type: 'SESSION_INITIALIZED';
  payload: {
    sessionId: string;
    userInfo: { name: string };
    goal: SavingsGoal;
  };
};
