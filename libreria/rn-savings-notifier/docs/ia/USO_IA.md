# Uso de IA — `rn-savings-notifier`

Igual que el documento de `mobile/`, esto describe lo verificable en el
propio paquete — código, comentarios, ADR, README — no un plan. Sin log de
prompts de la sesión que construyó HU-lib (`#7`); el rastro es el que dejan
los artefactos.

## Proceso

`create-react-native-library` anduvo el andamiaje inicial (estructura
`src/`/`ios/`/`android/`/`example/`, `react-native-builder-bob`,
`codegenConfig`). Sobre eso, el trabajo real —el `Spec` de TurboModule, la
implementación Swift, la validación en JS, el ADR, el README— se hizo con
el mismo flujo que `mobile/`: ticket de GitHub (`#7`), `/mattpocock-skills:implement`,
`/code-review` antes de commitear, un commit
(`feat(libreria): rn-savings-notifier, TurboModule Swift (#7) (#18)`).

## Qué generó la IA

- El `Spec` tipado (`src/NativeRnSavingsNotifier.ts`) y su traducción a los
  cinco puntos que documenta `README.md#arquitectura`: Spec → wrapper JS
  validado → Swift → glue ObjC++ → tests con el nativo mockeado.
- `RnSavingsNotifierImpl.swift`: el diálogo vía `UIAlertController`, la
  notificación vía `UNUserNotificationCenter`, el manejo de permisos y el
  delegate.
- El ADR 0001 (TurboModule vs. NativeModule) — decisión, alternativa
  descartada y trade-offs, con la justificación completa.
- Los skills y agents de este ticket
  (`.claude/skills/add-native-capability`,
  `.claude/agents/capability-contract-checker`) y este documento.

## Qué se escribió o ajustó a mano

- La verificación contra Xcode/simulador real: el propio `README.md`
  (sección "Pendientes") documenta que `pod install` falla en este entorno
  porque la ruta del proyecto contiene un espacio
  (`.../react native/examen-rn/...`), y que por eso el codegen se validó
  manualmente contra el header generado en lugar de correr la app de
  ejemplo end-to-end. Es una limitación de entorno declarada, no oculta.
- La decisión de alcance de Android (implementar el spec pero rechazar con
  `NOT_IMPLEMENTED` en vez de Kotlin real) es una decisión de negocio sobre
  qué cubre el examen (ver `README.md#pendientes` y el ticket `#11`,
  opcional), no algo que se infiera del código.

## Qué se rechazó o corrigió (casos concretos y verificables)

1. **TurboModule sobre NativeModule — alternativa descartada y
   documentada en el ADR.** El ADR de la raíz del repo
   (`docs/adr/0001-turbomodule-vs-nativemodule-rn-savings-notifier.md`)
   registra por qué se
   rechazó `RCTBridgeModule`/`@ReactMethod` con tipos `any`: sin seguridad
   de tipos de punta a punta, y RN 0.87 trae Fabric/TurboModules por
   defecto — construir NativeModule legacy habría sido nadar contra la
   plataforma. El ADR también documenta el trade-off aceptado a cambio (más
   carga inicial: `codegenConfig`, `.podspec`, codegen antes de compilar).

2. **Permiso de notificación denegado: resuelve, no rechaza — corrige el
   default obvio.** `README.md#comportamiento-del-permiso-de-notificaciones`
   documenta la razón: `notifyGoalCompleted` certifica que la meta se
   cumplió; que el usuario no quiera notificaciones no deshace ese hecho.
   Tratarlo como rechazo habría obligado a quien consume la librería a
   distinguir "no se cumplió" de "se cumplió pero no avisó" — dos cosas
   distintas que el rechazo mezclaría en una sola. El código
   (`RnSavingsNotifierImpl.swift`, casos `.denied`/`notDetermined` con
   `granted == false`) llama `resolve(nil)`, nunca `reject`.

3. **`isPresentingDialog` corrige una promesa que quedaría colgada.** El
   comentario en `RnSavingsNotifierImpl.swift` es explícito: presentar un
   segundo `UIAlertController` mientras el primero sigue en pantalla, UIKit
   lo ignora en silencio — sin el guard, esa segunda promesa nunca
   resolvería ni rechazaría. Se corrigió rechazando de inmediato con
   `DIALOG_ALREADY_PRESENTED` en vez de dejarla pendiente para siempre.

4. **El delegate de notificaciones se reenvía, no se reemplaza.** El
   enfoque directo —`UNUserNotificationCenter.current().delegate = self`—
   rompería cualquier delegate que la app anfitriona ya tuviera registrado
   (por ejemplo, para sus propias push notifications), porque
   `UNUserNotificationCenter` solo admite uno a la vez. Se corrigió
   guardando `previousNotificationDelegate` y reenviándole `willPresent`
   cuando responde a ese selector (`RnSavingsNotifierImpl.swift`, extensión
   `UNUserNotificationCenterDelegate`).

5. **Android: rechazo explícito en vez de fallo silencioso.** El spec de
   codegen ya cubre Android (`RnSavingsNotifierModule.kt` compila), pero
   ambos métodos rechazan con `NOT_IMPLEMENTED` en vez de resolver con un
   no-op o quedar sin implementar de forma que rompa el build de otra
   manera menos clara — decisión documentada en `README.md#pendientes`
   junto con el plan concreto (`AlertDialog` +
   `NotificationManager`/`NotificationChannel`) si se decide cerrarlo.

## Skills y agents usados en esta capa

- `/mattpocock-skills:implement` — implementación del ticket con TDD en los
  seams.
- `/code-review` — revisión antes de cada commit.
- `add-native-capability` (`.claude/skills/`, específico de este paquete) —
  agrega una capacidad de TurboModule siguiendo el patrón de
  `showConfirmDialog`/`notifyGoalCompleted` en las cinco capas donde debe
  existir.
- `capability-contract-checker` (`.claude/agents/`, específico de este
  paquete) — verifica que una capacidad esté completa en esas cinco capas
  y que la semántica declarada (resolve/reject) coincida entre el doc
  comment de JS y la implementación Swift.
