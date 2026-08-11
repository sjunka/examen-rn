import { View, StyleSheet } from 'react-native';
import { colors, rounded } from '../theme';

// Renders a saturated 0-100 percent. Callers must pass an already-clamped
// value (calculateProgress) — this component does no domain logic.
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <View style={styles.track} testID="progress-bar-track">
      <View style={[styles.fill, { width: `${percent}%` }]} testID="progress-bar-fill" />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: colors.platinum,
    borderRadius: rounded.xs,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.signal,
  },
});
