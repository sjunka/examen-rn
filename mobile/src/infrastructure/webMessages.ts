import { isValidAmount } from '../domain/money';
import type { SavingsGoal } from '../domain/savingsGoal';

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
export type NativeToWebMessage =
  | {
      type: 'SESSION_INITIALIZED';
      payload: {
        sessionId: string;
        userInfo: { name: string };
        goal: SavingsGoal;
      };
    }
  | {
      type: 'ACCUMULATED_AMOUNT_UPDATED';
      payload: {
        accumulatedAmount: number;
      };
    };

// The one place that knows the raw wire format. Never throws — an
// unparseable or malformed message resolves to null instead, so every
// caller gets a typed WebToNativeMessage or nothing. Shape validation only:
// whether a goal with this id exists is a business question for the use
// case, not this parser.
export function parseWebToNativeMessage(raw: string): WebToNativeMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const { type } = parsed as { type?: unknown };

  if (type === 'WEB_APP_READY') {
    return { type: 'WEB_APP_READY' };
  }

  if (type === 'DEPOSIT_CONFIRMED') {
    const { payload } = parsed as { payload?: unknown };
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return null;
    }

    const { goalId, amount } = payload as { goalId?: unknown; amount?: unknown };
    if (typeof goalId !== 'string' || goalId === '') {
      return null;
    }
    if (typeof amount !== 'number' || !isValidAmount(amount)) {
      return null;
    }

    return { type: 'DEPOSIT_CONFIRMED', payload: { goalId, amount } };
  }

  return null;
}
