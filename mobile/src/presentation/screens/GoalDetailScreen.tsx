import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { showConfirmDialog, notifyGoalCompleted } from 'rn-savings-notifier';
import { formatCOP } from '../../domain/money';
import { webAppSource } from '../../infrastructure/webAppHtml';
import { parseWebToNativeMessage, type NativeToWebMessage } from '../../infrastructure/webMessages';
import { useConfirmDeposit } from '../useConfirmDeposit';
import { useGoalSnapshot } from '../useGoalSnapshot';
import { colors, spacing, typography } from '../theme';
import { UI_FONT_SIZES, UI_CONFIRMATION, SESSION_ID_PREFIX, DEMO_USER_NAME } from '../constants';

export function GoalDetailScreen({
  goalId,
  onBack,
}: {
  goalId: string;
  onBack: () => void;
}) {
  const goal = useGoalSnapshot(goalId);
  const confirmDeposit = useConfirmDeposit();
  // Explicit `{}` type arg: react-native-webview's WebView<P = undefined>
  // makes TS infer `never` for props otherwise (WebViewProps & undefined).
  const webViewRef = useRef<WebView<{}>>(null);

  // DEPOSIT_CONFIRMED composition: the native confirmation dialog gates the
  // use case — a cancel resolves false and this stops here, so nothing is
  // dispatched and no state changes. Only past that gate does it reach
  // confirmDeposit, never straight into Redux. A non-existent goal id is a
  // no-op there — confirmDeposit leaves global state untouched.
  const handleDepositConfirmed = useCallback(
    async (depositGoalId: string, amount: number) => {
      if (!goal) {
        return;
      }
      const accepted = await showConfirmDialog(
        UI_CONFIRMATION.confirmationTitle,
        `Se abonará ${formatCOP(amount)} a "${goal.name}".`,
      );
      if (!accepted) {
        return;
      }

      const result = confirmDeposit(depositGoalId, amount);

      if (result) {
        // Notify web app of updated accumulated amount without remounting
        // the WebView — the web updates its UI inline.
        const updatedGoal = { ...goal, accumulatedAmount: goal.accumulatedAmount + amount };
        const updateMessage: NativeToWebMessage = {
          type: 'ACCUMULATED_AMOUNT_UPDATED',
          payload: {
            accumulatedAmount: updatedGoal.accumulatedAmount,
          },
        };
        webViewRef.current?.postMessage(JSON.stringify(updateMessage));

        // The domain's transition rule (isGoalCompleted comparing raw
        // amounts, via justCompleted) decides the trigger, not the rounded
        // percentage — and only fires on the deposit that crosses the line,
        // never again on a later deposit to an already-complete goal.
        if (result.justCompleted) {
          await notifyGoalCompleted(goal.name);
        }
      }
    },
    [goal, confirmDeposit],
  );

  // parseWebToNativeMessage is the only thing here that knows the raw wire
  // format — everything past it works with the typed union.
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebToNativeMessage(event.nativeEvent.data);
      if (!message) {
        return;
      }

      if (message.type === 'WEB_APP_READY') {
        // The web announces readiness first; only then does native reply
        // with the session. That ordering — not a delay on this side — is
        // what closes the race, so this branch never needs to guess when
        // the page is "loaded".
        if (!goal) {
          return;
        }
        const sessionMessage: NativeToWebMessage = {
          type: 'SESSION_INITIALIZED',
          payload: {
            sessionId: `${SESSION_ID_PREFIX}${goal.id}`,
            userInfo: { name: DEMO_USER_NAME },
            goal,
          },
        };
        webViewRef.current?.postMessage(JSON.stringify(sessionMessage));
        return;
      }

      // GoalsScreen re-renders on its own subscription; this screen
      // deliberately doesn't, so the WebView never remounts.
      handleDepositConfirmed(message.payload.goalId, message.payload.amount);
    },
    [goal, handleDepositConfirmed],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header} testID="goal-detail-header">
        <Pressable
          onPress={onBack}
          testID="goal-detail-back"
          accessibilityRole="button"
          accessibilityLabel={UI_CONFIRMATION.backLabelA11y}
        >
          <Text style={styles.backLabel}>{UI_CONFIRMATION.backLabel}</Text>
        </Pressable>
      </View>
      {goal ? (
        <WebView<{}>
          ref={webViewRef}
          testID="goal-detail-webview"
          source={webAppSource}
          onMessage={handleMessage}
          style={styles.webview}
        />
      ) : (
        // goalId doesn't resolve to a goal (e.g. deleted between list and
        // tap). Surfacing this beats mounting a WebView that would wait
        // forever for a handshake reply that never comes.
        <Text style={styles.notFound} testID="goal-detail-not-found">
          {UI_CONFIRMATION.goalsEmptyFallback}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    backgroundColor: colors.carbon,
    padding: spacing.md,
  },
  backLabel: {
    ...typography.uiLabel,
    color: colors.onPrimary,
    fontSize: UI_FONT_SIZES.heading,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  notFound: {
    ...typography.body,
    color: colors.onPrimary,
    padding: spacing.lg,
  },
});
