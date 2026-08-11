import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { GoalRow } from '../components/GoalRow';
import { useGoals } from '../useGoals';
import { colors, spacing, typography } from '../theme';

export function GoalsScreen({ onSelectGoal }: { onSelectGoal: (goalId: string) => void }) {
  const goals = useGoals();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header} testID="goals-header">
        <Text style={styles.headerTitle}>Mis metas de ahorro</Text>
      </View>
      <FlatList
        data={goals}
        keyExtractor={goal => goal.id}
        renderItem={({ item }) => <GoalRow goal={item} onPress={onSelectGoal} />}
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
    fontSize: 13,
  },
  list: {
    padding: spacing.lg,
  },
});
