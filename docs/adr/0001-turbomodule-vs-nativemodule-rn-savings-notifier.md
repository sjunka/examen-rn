# ADR 0001: TurboModule frente a NativeModule para `rn-savings-notifier`

## Estado

Aceptado.

## Contexto

`rn-savings-notifier` expone dos capacidades nativas a JavaScript: un
diálogo de confirmación del sistema (`showConfirmDialog`) y una
notificación local (`notifyGoalCompleted`). Había que decidir el mecanismo
de puente: el TurboModule del New Architecture, o el NativeModule "legacy"
del bridge clásico.

## Problema que resuelve

El bridge clásico serializa cada llamada como JSON sobre un puente
asíncrono batched, sin tipos en tiempo de compilación: los argumentos y el
valor de retorno son `any` hasta que algo revienta en runtime. Para un
método que abre un diálogo del sistema y resuelve una promesa con la
elección del usuario, un argumento mal tipado o un cambio de forma en el
payload solo se detecta ejecutando la app.

## Decisión

Se implementa como TurboModule: el contrato vive en
`src/NativeRnSavingsNotifier.ts` como una interfaz TypeScript
(`Spec extends TurboModule`), y `react-native-codegen` genera desde ahí el
protocolo Objective-C++ (`NativeRnSavingsNotifierSpec`) y la contraparte
Kotlin. El compilador, no el runtime, es quien detecta un argumento con el
tipo equivocado o un método que no coincide con el nativo.

## Alternativa descartada

NativeModule con `RCTBridgeModule` / `@ReactMethod` y tipos `any` en el
lado JS. Se descartó por:

- **Sin seguridad de tipos de punta a punta.** El spec de este paquete
  (`Spec.ts`) es la única fuente de verdad; con NativeModule habría que
  mantener a mano la firma en TypeScript, en Objective-C y en Kotlin,
  sincronizadas por convención y no por compilación.
- **Invocación síncrona disponible.** TurboModule permite exponer métodos
  síncronos cuando hace falta (no es el caso aquí, ambos métodos son
  asíncronos por naturaleza — diálogo y notificación — pero la opción
  queda abierta sin cambiar de arquitectura).
- **Es el camino que exige el New Architecture.** RN 0.87 (versión de este
  proyecto, ver `README.md` raíz) tiene Fabric/TurboModules habilitado por
  defecto; construir un NativeModule legacy sobre esa base es nadar contra
  la corriente de la plataforma, no una elección neutral.

## Trade-offs aceptados

- **Carga inicial más compleja.** Hay que declarar `codegenConfig` en
  `package.json`, mantener el `.podspec` y correr codegen antes de poder
  compilar; un NativeModule legacy no lo exige. Se acepta porque el costo
  es de una sola vez (scaffolding) y no recurrente.
- **Puente ObjC++ intermedio para llegar a Swift.** El codegen de
  TurboModule solo genera protocolos Objective-C++, nunca Swift
  directamente. La lógica real vive en Swift
  (`ios/RnSavingsNotifierImpl.swift`, requisito del ticket), y
  `ios/RnSavingsNotifier.mm` es un archivo delgado que solo reenvía cada
  llamada a la instancia Swift a través del header generado
  automáticamente por Xcode (`RnSavingsNotifier-Swift.h`). Es una capa de
  indirección adicional frente a escribir el TurboModule directo en
  Objective-C, pero es el patrón estándar para exponer Swift bajo
  codegen de TurboModule sin reescribir el generador.
- **Mayor superficie para errores de codegen.** Un nombre de método que no
  calce entre el `Spec.ts` y la implementación nativa rompe el build, no
  falla en silencio — se considera una ventaja (falla rápido, en
  compilación) más que un costo, pero cambia el modo de fallo respecto a
  NativeModule (que fallaría en runtime, con un mensaje menos claro).
