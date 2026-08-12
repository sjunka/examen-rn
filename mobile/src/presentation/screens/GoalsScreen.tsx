import { useCallback } from 'react';
import { FlatList, type ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SavingsGoal } from '../../domain/savingsGoal';
import { GoalRow } from '../components/GoalRow';
import { useGoals } from '../useGoals';
import { colors, spacing, typography } from '../theme';
import { UI_FONT_SIZES } from '../constants';

export function GoalsScreen({ onSelectGoal }: { onSelectGoal: (goalId: string) => void }) {
  const goals = useGoals();

  const renderGoal = useCallback<ListRenderItem<SavingsGoal>>(
    ({ item }) => <GoalRow goal={item} onPress={onSelectGoal} />,
    [onSelectGoal]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header} testID="goals-header">
        <Text style={styles.headerTitle}>Mis metas de ahorro</Text>
      </View>
      <FlatList
        data={goals}
        keyExtractor={goal => goal.id}
        renderItem={renderGoal}
        contentContainerStyle={styles.list}
      />
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
  headerTitle: {
    ...typography.uiLabel,
    color: colors.onPrimary,
    fontSize: UI_FONT_SIZES.heading,
  },
  list: {
    padding: spacing.lg,
  },
});
