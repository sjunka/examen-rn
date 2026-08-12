import { Pressable, View, Text, StyleSheet } from 'react-native';
import { calculateProgress } from '../../domain/progress';
import { formatCOP } from '../../domain/money';
import type { SavingsGoal } from '../../domain/savingsGoal';
import { ProgressBar } from './ProgressBar';
import { colors, rounded, spacing, typography } from '../theme';

// Percentage always comes from calculateProgress — the single domain rule.
// No second implementation of the calculation lives here.
export function GoalRow({
  goal,
  onPress,
}: {
  goal: SavingsGoal;
  onPress?: (goalId: string) => void;
}) {
  const percent = calculateProgress(goal.accumulatedAmount, goal.targetAmount);

  return (
    <Pressable
      style={styles.row}
      testID="goal-row"
      onPress={onPress ? () => onPress(goal.id) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${goal.name}, ${percent}% de ${formatCOP(goal.targetAmount)}`}
    >
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
    </Pressable>
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
