import { View, Text, StyleSheet } from 'react-native';
import { calculateProgress, formatCOP, type SavingsGoal } from '../../domain';
import { ProgressBar } from './ProgressBar';
import { colors, rounded, spacing, typography } from '../theme';

// Percentage always comes from calculateProgress — the single domain rule.
// No second implementation of the calculation lives here.
export function GoalRow({ goal }: { goal: SavingsGoal }) {
  const percent = calculateProgress(goal.accumulatedAmount, goal.targetAmount);

  return (
    <View style={styles.row} testID="goal-row">
      <Text style={styles.name}>{goal.name}</Text>
      <View style={styles.amounts}>
        <Text style={styles.label}>
          Objetivo: <Text style={styles.value}>{formatCOP(goal.targetAmount)}</Text>
        </Text>
        <Text style={styles.label}>
          Acumulado: <Text style={styles.value}>{formatCOP(goal.accumulatedAmount)}</Text>
        </Text>
      </View>
      <ProgressBar percent={percent} />
      <Text style={styles.percent}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.platinum,
    borderRadius: rounded.sm,
    borderWidth: 1,
    borderColor: colors.chromeIndigo,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.link,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  amounts: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.ink,
  },
  value: {
    ...typography.link,
    color: colors.ink,
  },
  percent: {
    ...typography.uiLabel,
    color: colors.inkSoft,
    marginTop: spacing.xs,
  },
});
