import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Abre el diálogo de confirmación nativo del sistema (`UIAlertController` en
   * iOS). Resuelve `true` si el usuario elige la opción de aceptar, `false`
   * si cancela. Nunca rechaza por una elección del usuario, solo por un
   * error real (por ejemplo, no hay `UIViewController` visible desde el que
   * presentar el diálogo).
   */
  showConfirmDialog(title: string, message: string): Promise<boolean>;

  /**
   * Dispara una notificación local nativa que anuncia una meta cumplida. La
   * promesa resuelve tanto si la notificación se programó como si el
   * usuario había denegado el permiso (ver README: comportamiento
   * documentado de denegación). Solo rechaza ante un error real del
   * sistema operativo al programar la notificación.
   */
  notifyGoalCompleted(goalName: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnSavingsNotifier');
