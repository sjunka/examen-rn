# rn-savings-notifier

Diálogo de confirmación nativo del sistema y notificación local para metas
de ahorro cumplidas, con puente TurboModule. Implementación real en iOS
(Swift) y Android (Kotlin).

## Instalación

Dentro de este monorepo, `mobile/` la consumiría como dependencia de
archivo local:

```json
{
  "dependencies": {
    "rn-savings-notifier": "file:../libreria/rn-savings-notifier"
  }
}
```

Publicada en un registro npm normal, la instalación sería la habitual:

```sh
npm install rn-savings-notifier
```

## Autolinking

No requiere pasos manuales. El paquete declara `codegenConfig` en su
`package.json` (`name: "RnSavingsNotifierSpec"`) y un `.podspec` en la
raíz; el autolinking de React Native (`react-native.config.js` generado
por `react-native-builder-bob`) lo detecta solo. En iOS, `pod install`
dispara el codegen que genera el protocolo Objective-C++
(`NativeRnSavingsNotifierSpec`) a partir de `src/NativeRnSavingsNotifier.ts`.

## API

```ts
import { showConfirmDialog, notifyGoalCompleted } from 'rn-savings-notifier';
```

### `showConfirmDialog(title: string, message: string): Promise<boolean>`

Abre el diálogo de confirmación **nativo del sistema** (`UIAlertController`
en iOS, `AlertDialog` en Android — nunca el `Alert` de React Native) con un
botón "Cancelar" y uno "Aceptar". Resuelve `true` si el usuario acepta,
`false` si cancela. Solo rechaza ante un error real — por ejemplo, si no
hay ningún `UIViewController`/`Activity` visible desde el que presentar el
diálogo (`NO_VIEW_CONTROLLER` en iOS, `NO_ACTIVITY` en Android) — nunca por
la elección del usuario.

`title` y `message` deben ser strings no vacíos (ni solo espacios); de lo
contrario la promesa rechaza con un `TypeError` sin llegar a tocar el
nativo.

Solo puede haber un diálogo presentado a la vez: una segunda llamada
mientras el primero sigue en pantalla rechaza de inmediato con el código
`DIALOG_ALREADY_PRESENTED`, en lugar de quedar esperando una promesa que
nunca resolvería.

### `notifyGoalCompleted(goalName: string): Promise<void>`

Dispara una notificación local nativa cuyo cuerpo menciona `goalName`. En
iOS se muestra **incluso con la app en primer plano**, gracias a que la
librería registra su propio `UNUserNotificationCenterDelegate` (ver
[Comportamiento del permiso de notificaciones](#comportamiento-del-permiso-de-notificaciones)).
En Android se publica vía `NotificationManager` en un canal propio del
paquete (`rn-savings-notifier-goal-completed`, creado en el primer envío
para API 26+).

`goalName` debe ser un string no vacío; si no lo es, la promesa rechaza
con un `TypeError` sin llegar a tocar el nativo.

Si la app consumidora ya había registrado su propio
`UNUserNotificationCenterDelegate` (por ejemplo, para sus push
notifications) antes de la primera llamada a este paquete, la librería lo
conserva y le reenvía la decisión de mostrar-en-primer-plano en lugar de
reemplazarlo — `UNUserNotificationCenter` solo admite un delegate a la vez.

## Comportamiento del permiso de notificaciones

La primera vez que se llama a `notifyGoalCompleted`, la librería solicita
autorización de notificaciones si el usuario todavía no respondió —
`UNAuthorizationOptions: [.alert, .sound, .badge]` en iOS,
`POST_NOTIFICATIONS` en Android 13+ (versiones previas no requieren este
permiso en tiempo de ejecución; se comprueba igual que el usuario no lo
haya desactivado a nivel de sistema). El comportamiento según la
respuesta:

| Estado del permiso | Comportamiento |
| --- | --- |
| Concedido (ahora o antes) | Se programa y muestra la notificación. La promesa resuelve. |
| Denegado (ahora o antes) | **No** se programa ninguna notificación. La promesa **resuelve igual** (no rechaza) — la meta se cumplió de todas formas; la notificación es un canal de aviso, no una condición de éxito de la operación. |
| Sin `Activity`/`UIViewController` visible desde el que pedir el permiso | Mismo comportamiento que denegado: resuelve en silencio. |
| Error real del sistema al programar | La promesa rechaza con el código `NOTIFICATION_SCHEDULE_FAILED`. |

Se decidió que un permiso denegado resuelva en lugar de rechazar porque
`notifyGoalCompleted` documenta que una meta se cumplió; que el usuario no
quiera notificaciones push no deshace ese hecho. Tratarlo como error
obligaría a quien consume la librería a diferenciar "la meta no se cumplió"
de "se cumplió pero no se avisó", cuando son cosas distintas.

## Ejemplo de uso

```tsx
import { Button } from 'react-native';
import { showConfirmDialog, notifyGoalCompleted } from 'rn-savings-notifier';

async function onConfirmarAbono() {
  const aceptado = await showConfirmDialog(
    '¿Confirmar abono?',
    'Se abonarán $50.000 a la meta "Viaje a la playa".'
  );

  if (!aceptado) return;

  // ... aplicar el abono ...

  const metaCumplida = true; // según el nuevo acumulado
  if (metaCumplida) {
    await notifyGoalCompleted('Viaje a la playa');
  }
}
```

Ambos métodos son demostrables desde la app de ejemplo del propio paquete
(`example/`, ver [Cómo se probaría](#cómo-se-probaría-o-publicaría)): dos
botones, uno por método, con el resultado mostrado en pantalla.

## Cómo se probaría o publicaría

- **Tests unitarios**: `yarn test` en la raíz del paquete corre los tests
  de `src/__tests__/`, que mockean `NativeRnSavingsNotifier` y cubren
  validación de argumentos, delegación con los argumentos correctos, y la
  promesa del diálogo resolviendo tanto aceptación como cancelación.
- **App de ejemplo**: `yarn example ios` (o `yarn example android`) levanta
  `example/`, una app RN independiente con este paquete linkeado por
  workspace, para probar los dos métodos contra un simulador/emulador real.
- **Sin tests unitarios de Kotlin**: la lógica de `AlertDialog` y
  `NotificationManager` no tiene test unitario propio — requeriría
  Robolectric (una dependencia nueva) para correr fuera de un
  emulador/dispositivo. Queda cubierta por la app de ejemplo en
  `example android`; añadir Robolectric si el equipo necesita cobertura
  automatizada de esta capa.
- **Publicación**: el paquete está andamiado con `react-native-builder-bob`
  (`yarn prepare` corre `bob build`, generando `lib/module` y
  `lib/typescript` a partir de `src/`). Publicar sería `npm publish` desde
  la raíz del paquete una vez versionado con semver, siguiendo el flujo
  estándar de cualquier librería RN independiente — no depende de nada de
  `mobile/` ni de `web/`.

## Arquitectura

- `src/NativeRnSavingsNotifier.ts` — el `Spec` tipado que codegen traduce
  a protocolo nativo (ver [ADR 0001](../../docs/adr/0001-turbomodule-vs-nativemodule-rn-savings-notifier.md)
  para TurboModule vs. NativeModule).
- `src/index.tsx` — API pública: valida argumentos antes de delegar al
  nativo, para fallar rápido y con un mensaje claro en JS en lugar de
  cruzar el puente con datos inválidos.
- `ios/RnSavingsNotifier.h` / `.mm` — glue TurboModule generado por
  codegen, reenvía cada llamada a la implementación Swift.
- `ios/RnSavingsNotifierImpl.swift` — la lógica real: `UIAlertController`
  para el diálogo, `UNUserNotificationCenter` para la notificación, y el
  `UNUserNotificationCenterDelegate` que vive en la librería.
- `android/src/main/java/com/rnsavingsnotifier/RnSavingsNotifierModule.kt`
  — la lógica real: `AlertDialog` para el diálogo,
  `NotificationManager`/`NotificationChannel` para la notificación, y el
  flujo de permiso en tiempo de ejecución (`PermissionAwareActivity`) para
  `POST_NOTIFICATIONS` en Android 13+.
- `android/src/main/java/com/rnsavingsnotifier/RnSavingsNotifierPackage.kt`
  — registra el módulo ante React Native (autolinking).
- `android/src/main/AndroidManifest.xml` — declara `POST_NOTIFICATIONS`
  para que se fusione en el manifest de la app consumidora.

## Pendientes

- **`pod install` en este entorno**: el directorio del proyecto contiene un
  espacio (`.../react native/examen-rn/...`). El descargador de binarios
  prebuilt de React Native 0.85 (`RCTUsePrebuiltRNCore`) construye una URL
  a partir de esa ruta y falla con `bad component (expected absolute path
  component)` al intentar escribir el tarball de release. Es el mismo tipo
  de fricción de toolchain que ya documenta el `README.md` raíz para RN
  0.81 + Xcode 26.5: un choque de herramienta externa, no un error de este
  paquete. La app de ejemplo de este paquete queda sin `Pods/` instalados
  en este entorno por esa razón; el codegen (la parte relevante para
  validar que el `Spec.ts` y el nativo coinciden) sí corre y se validó
  manualmente contra el header generado.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
