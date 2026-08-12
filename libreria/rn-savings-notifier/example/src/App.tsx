import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { showConfirmDialog, notifyGoalCompleted } from 'rn-savings-notifier';

export default function App() {
  const [dialogResult, setDialogResult] = useState<string>('—');
  const [notificationResult, setNotificationResult] = useState<string>('—');

  const onShowConfirmDialog = async () => {
    try {
      const accepted = await showConfirmDialog(
        '¿Confirmar abono?',
        'Se abonarán $50.000 a la meta "Viaje a la playa".'
      );
      setDialogResult(accepted ? 'Usuario aceptó' : 'Usuario canceló');
    } catch (error) {
      setDialogResult(`Error: ${(error as Error).message}`);
    }
  };

  const onNotifyGoalCompleted = async () => {
    try {
      await notifyGoalCompleted('Viaje a la playa');
      setNotificationResult('Notificación programada');
    } catch (error) {
      setNotificationResult(`Error: ${(error as Error).message}`);
    }
  };

  return (
    // Plain View: react-native's SafeAreaView is deprecated, and this
    // container centres its content vertically, so no inset to respect.
    <View style={styles.container}>
      <View style={styles.row}>
        <Button title="Mostrar diálogo nativo" onPress={onShowConfirmDialog} />
        <Text style={styles.result}>{dialogResult}</Text>
      </View>
      <View style={styles.row}>
        <Button
          title="Notificar meta cumplida"
          onPress={onNotifyGoalCompleted}
        />
        <Text style={styles.result}>{notificationResult}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  row: {
    gap: 8,
  },
  result: {
    textAlign: 'center',
  },
});
