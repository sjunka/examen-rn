import NativeRnSavingsNotifier from './NativeRnSavingsNotifier';

function requireNonBlankString(value: unknown, argName: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(
      `rn-savings-notifier: "${argName}" debe ser un string.`
    );
  }
  if (value.trim().length === 0) {
    throw new TypeError(
      `rn-savings-notifier: "${argName}" no puede estar vacío.`
    );
  }
  return value;
}

/**
 * Abre el diálogo de confirmación nativo del sistema y devuelve la elección
 * del usuario. Ver `Spec.showConfirmDialog` para el contrato completo.
 */
export function showConfirmDialog(
  title: string,
  message: string
): Promise<boolean> {
  try {
    requireNonBlankString(title, 'title');
    requireNonBlankString(message, 'message');
  } catch (error) {
    return Promise.reject(error);
  }

  return NativeRnSavingsNotifier.showConfirmDialog(title, message);
}

/**
 * Dispara una notificación local nativa anunciando que `goalName` se
 * cumplió. Ver `Spec.notifyGoalCompleted` para el contrato completo,
 * incluido el comportamiento cuando el usuario denegó el permiso.
 */
export function notifyGoalCompleted(goalName: string): Promise<void> {
  try {
    requireNonBlankString(goalName, 'goalName');
  } catch (error) {
    return Promise.reject(error);
  }

  return NativeRnSavingsNotifier.notifyGoalCompleted(goalName);
}
