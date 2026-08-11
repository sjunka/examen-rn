import { useCallback, useRef } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { webAppSource } from '../../infrastructure/webAppHtml';
import type { NativeToWebMessage } from '../../infrastructure/webMessages';
import { useGoalSnapshot } from '../useGoalSnapshot';
import { colors, spacing, typography } from '../theme';

// Only this one inbound message is acted on here: the handshake. Whether a
// DEPOSIT_CONFIRMED message arrived is not this ticket's concern — this
// slice delivers the channel and the detail, not the deposit (HU3).
function isWebAppReady(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { type?: unknown }).type === 'WEB_APP_READY'
    );
  } catch {
    return false;
  }
}

export function GoalDetailScreen({
  goalId,
  onBack,
}: {
  goalId: string;
  onBack: () => void;
}) {
  const goal = useGoalSnapshot(goalId);
  // Explicit `{}` type arg: react-native-webview's WebView<P = undefined>
  // makes TS infer `never` for props otherwise (WebViewProps & undefined).
  const webViewRef = useRef<WebView<{}>>(null);

  // The web announces readiness first; only then does native reply with the
  // session. That ordering — not a delay on this side — is what closes the
  // race, so this handler never needs to guess when the page is "loaded".
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (!goal || !isWebAppReady(event.nativeEvent.data)) {
        return;
      }

      const sessionMessage: NativeToWebMessage = {
        type: 'SESSION_INITIALIZED',
        payload: {
          sessionId: `session-${goal.id}`,
          userInfo: { name: 'Ahorrador Demo' },
          goal,
        },
      };
      webViewRef.current?.postMessage(JSON.stringify(sessionMessage));
    },
    [goal],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header} testID="goal-detail-header">
        <Pressable
          onPress={onBack}
          testID="goal-detail-back"
          accessibilityRole="button"
          accessibilityLabel="Volver al listado de metas"
        >
          <Text style={styles.backLabel}>‹ Volver</Text>
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
          Esta meta ya no existe.
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
    fontSize: 13,
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
