/**
 * Bolsillo de Ahorro Programado
 *
 * @format
 */

import { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/infrastructure/store/store';
import { GoalsScreen } from './src/presentation/screens/GoalsScreen';
import { GoalDetailScreen } from './src/presentation/screens/GoalDetailScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  // Two screens, so a local id is the navigation state — no library needed.
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {selectedGoalId === null ? (
          <GoalsScreen onSelectGoal={setSelectedGoalId} />
        ) : (
          <GoalDetailScreen goalId={selectedGoalId} onBack={() => setSelectedGoalId(null)} />
        )}
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
