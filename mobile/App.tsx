/**
 * Bolsillo de Ahorro Programado
 *
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/infrastructure/store/store';
import { GoalsScreen } from './src/presentation/screens/GoalsScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <GoalsScreen />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
