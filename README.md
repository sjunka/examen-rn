# Bolsillo de Ahorro Programado

KATA Senior React Native Mobile Engineer — Grupo Bolívar.

## Descripción

Feature "Bolsillo de Ahorro Programado": una pantalla nativa lista las metas de ahorro del usuario con su progreso (HU1); tocar una meta abre su detalle y un formulario de abono renderizados por una micro-app web dentro de un `WebView` (HU2); al confirmar un abono válido, la app nativa recibe el mensaje, actualiza Redux y refleja el nuevo acumulado sin recargar la vista (HU3); si ese abono completa la meta, se dispara un diálogo de confirmación nativo del sistema y una notificación local, ambos vía `rn-savings-notifier` (HU4). Las cuatro HUs del examen están implementadas.

## Estructura del repositorio

- `web/` — micro-app web (detalle de meta + abono), renderizada en WebView.
- `libreria/` — `rn-savings-notifier`, librería nativa (TurboModule Swift + Kotlin).
- `mobile/` — app React Native.

## Requisitos y versiones

- Node 25.9.0
- React Native 0.87.0, React 19.2.3
- iOS: Xcode 26.5, CocoaPods 1.16.2
- Android: SDK 37 / build-tools 37.0.0, NDK 27.1.12297006, Kotlin 2.2.0, Java 17

## Instalación y ejecución

### iOS

```sh
cd mobile
npm install
bundle install && bundle exec pod install --project-directory=ios
npm run ios
```

### Android

```sh
cd mobile
npm install
npm run android
```

Requiere un emulador o dispositivo Android corriendo (`adb devices` debe listarlo), Java 17 y el SDK de Android configurado (`ANDROID_HOME`). `rn-savings-notifier` trae su implementación Kotlin; el autolinking la detecta sola, sin pasos manuales.

## Arquitectura

`mobile/src/` sigue DDD ligero en cuatro capas. La flecha va del que depende al que provee — el dominio no depende de nada:

```mermaid
flowchart TD
    presentation --> application
    presentation --> infrastructure
    infrastructure -- implementa --> application
    application --> domain
    infrastructure --> domain
```

- **`domain/`** — reglas puras (dinero, progreso, transición de meta cumplida). Sin imports de React, React Native ni Redux; lo aplica el lint del proyecto, no solo la convención.
- **`application/`** — casos de uso (`GetGoals`, `ConfirmDeposit`) y el puerto `SavingsGoalRepository`. Depende solo del dominio.
- **`infrastructure/`** — implementaciones del puerto (`ReduxSavingsGoalRepository` en la app, `InMemorySavingsGoalRepository` en tests), el store de Redux y el contrato `postMessage` (`webMessages.ts`).
- **`presentation/`** — pantallas y hooks. Compone el caso de uso con la implementación concreta del repositorio (por ejemplo `useGoals`) y es la única capa que importa `rn-savings-notifier`.

`libreria/rn-savings-notifier` es un paquete aparte, sin dependencia del árbol anterior: expone dos funciones (`showConfirmDialog`, `notifyGoalCompleted`) que `mobile/` consume como cualquier dependencia de npm. `web/` es HTML/JS estático sin capas, embebido en el `WebView` y comunicado por el contrato `postMessage` documentado más abajo.

## Patrones de diseño

### Repository

- **Problema**: los casos de uso necesitan leer y escribir metas de ahorro sin saber si el dato vive en Redux, en memoria (tests) o en un backend futuro.
- **Dónde**: `SavingsGoalRepository` (`mobile/src/application/savingsGoalRepository.ts`) es un puerto — interfaz con `findAll`/`findById`/`save`, sin implementación. `GetGoals` y `ConfirmDeposit` dependen solo de esa interfaz.
- **Alternativa descartada**: llamar a `useSelector`/`dispatch` directamente desde los casos de uso. Más corto, pero acopla `application/` a Redux y hace imposible probar los casos de uso sin un store real.
- **Trade-off aceptado**: una capa de indirección (la interfaz) a cambio de que la implementación de test (`InMemorySavingsGoalRepository`) y la de producción (`ReduxSavingsGoalRepository`) sean intercambiables sin tocar `application/`.

### Adapter

- **Problema**: el puerto `SavingsGoalRepository` espera `findAll`/`findById`/`save`; Redux expone `getState()`/`dispatch()`, una API distinta.
- **Dónde**: `ReduxSavingsGoalRepository` (`mobile/src/infrastructure/`) adapta el store de Redux a la interfaz del puerto, traduciendo cada método a un `getState()` + selector o a un `dispatch()`.
- **Alternativa descartada**: que las pantallas llamen `useSelector`/`dispatch` sin adaptador. Funciona, pero mezcla vocabulario de Redux con el de los casos de uso en cada componente.
- **Trade-off aceptado**: una clase más a cambio de poder reemplazar Redux (por ejemplo por Context o Zustand) sin tocar `domain/` ni `application/`.

### Observer / Pub-Sub

- **Problema**: `GoalsScreen` debe re-renderizar cuando cualquier meta cambia (por ejemplo, tras un abono hecho desde el detalle); `GoalDetailScreen` no debe re-renderizar nunca por un cambio de estado global, porque eso remontaría su `WebView` y reiniciaría la sesión de la micro-app a mitad de flujo.
- **Dónde**: `useGoals` se suscribe al store con `useSelector(selectGoals)` — el componente se registra y Redux lo notifica en cada cambio (observer). `useGoalSnapshot` y `useConfirmDeposit` leen o escriben una sola vez con `useStore().getState()`/`dispatch()`, sin suscripción.
- **Alternativa descartada**: suscribir también el detalle y aceptar el remount, o pasarle la meta por props en lugar de leerla del store. Lo primero rompe la sesión del `WebView`; lo segundo duplica el estado de la meta en dos sitios.
- **Trade-off aceptado**: dos hooks con la misma forma de acceso pero comportamiento de suscripción distinto — hay que leer el comentario de cada uno para saber cuál es cuál — a cambio de que cada pantalla re-renderice exactamente cuando debe y ni una vez más.

## Contrato de mensajes (postMessage)

Definido en `mobile/src/infrastructure/webMessages.ts` como uniones discriminadas — único módulo con esta forma en el lado nativo. `web/index.html` no tiene sistema de módulos (HTML/JS estático), así que replica estos strings `type` a mano; se mantienen sincronizados por convención y por este catálogo.

**Web → nativo (`WebToNativeMessage`)**

| `type` | payload | Cuándo |
|---|---|---|
| `WEB_APP_READY` | — | La micro-app registró su listener de mensajes y anuncia que está lista. |
| `DEPOSIT_CONFIRMED` | `{ goalId: string; amount: number }` | El usuario confirmó un abono válido en el formulario. |

**Nativo → web (`NativeToWebMessage`)**

| `type` | payload | Cuándo |
|---|---|---|
| `SESSION_INITIALIZED` | `{ sessionId: string; userInfo: { name: string }; goal: SavingsGoal }` | Respuesta al `WEB_APP_READY`, nunca antes. |

`WEB_APP_READY` no está en el ejemplo del examen: se agregó porque responder en `onLoadEnd` es una carrera — el documento puede terminar de cargar antes de que el script registre su listener, y el mensaje inicial se pierde de forma intermitente. Con el handshake la web controla el orden: registra el listener, anuncia que está lista, y solo entonces el nativo responde. La carrera desaparece por construcción, no se mitiga con un delay.

El payload de `SESSION_INITIALIZED` también se extiende respecto al ejemplo del examen: agrega `goal`, un snapshot de la meta tocada (`SavingsGoal` del dominio). Sin eso la web recibe un identificador de sesión pero nada con qué pintar el detalle.

La micro-app llega al WebView como HTML embebido (`source={{ html }}`), no por red: `web/index.html` es el archivo real y editable, y `npm run build:webapp` (en `mobile/`) lo empaqueta en `mobile/src/infrastructure/webAppHtml.ts`, que se commitea. Así la demo no depende de un servidor corriendo.

## Tests y coverage

Dos capas evaluadas, cada una con sus propios umbrales de cobertura — configurados para fallar el build si el núcleo se degrada, no solo para reportar una cifra.

**`mobile/`** (Jest + React Testing Library, 79 tests)

```sh
cd mobile
npm test                # correr los tests
npm test -- --coverage  # con reporte de cobertura
```

Umbrales (`mobile/jest.config.js`): `src/domain/**` ≥ 90% y `src/application/**` ≥ 80% en statements/branches/functions/lines. Cifra real medida sobre todo `src/`: **98.23% statements, 96.22% branches, 100% functions, 98.13% lines**.

**`libreria/rn-savings-notifier/`** (Jest, 12 tests)

```sh
cd libreria/rn-savings-notifier
yarn test                # correr los tests
yarn test --coverage     # con reporte de cobertura
```

Umbral global (bloque `jest` en `package.json`): ≥ 90% en las cuatro métricas. Cifra real medida sobre `src/`: **100%**. Cubre la capa JS (`index.tsx`, validación y delegación al nativo); la implementación Swift/Kotlin no tiene test unitario propio — ver [Pendientes](#pendientes-y-alcance-no-cubierto) y el [README de la librería](libreria/rn-savings-notifier/README.md#pendientes).

## Uso de IA

Cada capa evaluada tiene su propio skill y agent, y su propio documento de
uso de IA — qué generó la IA, qué se ajustó a mano, y casos concretos y
verificables de qué se rechazó o corrigió durante el desarrollo:

- [`mobile/docs/ia/USO_IA.md`](mobile/docs/ia/USO_IA.md) — skill
  `add-application-use-case`, agent `hexagonal-boundary-guardian`.
- [`libreria/rn-savings-notifier/docs/ia/USO_IA.md`](libreria/rn-savings-notifier/docs/ia/USO_IA.md)
  — skill `add-native-capability`, agent `capability-contract-checker`.

## Decisiones técnicas

- **Versión de React Native**: se intentó React Native 0.81 + React 19 (los puntos extra del examen) dentro de un timebox de 45 minutos. El proyecto generado por la CLI oficial compila con RN 0.81.6, pero falla con Xcode 26.5: la librería `fmt` 11.0.2 que empaqueta esa versión usa `consteval` de una forma que el Clang de Xcode 26.5 rechaza (`call to consteval function ... is not a constant expression`), un choque de toolchain conocido (fmtlib/fmt) y no un error del proyecto. Un parche puntual en el `Podfile` no lo resolvió. Se usó React Native 0.87.0 + React 19.2.3 (última estable), que sí compila y corre en el simulador de iOS con este toolchain.
- **Navegación sin librería**: dos pantallas (listado y detalle), así que `App.tsx` guarda el id de la meta seleccionada en un `useState` local en vez de traer React Navigation. Alternativa descartada: una librería de navegación completa para dos estados — coste de una dependencia y su configuración nativa (iOS + Android) sin un tercer caso de uso que lo justifique.
- **Sin capa de casos de uso para `rn-savings-notifier`**: `GoalDetailScreen` llama `showConfirmDialog`/`notifyGoalCompleted` directo, sin un puerto intermedio como el de `SavingsGoalRepository`. Se aceptó esa asimetría porque estas dos funciones no tienen estado que sustituir en tests — se mockea el módulo completo (mismo patrón que `react-native-webview`) — mientras que el repositorio sí necesita una implementación en memoria intercambiable.

## Pendientes y alcance no cubierto

- **Tests unitarios de la implementación nativa** (`libreria/rn-savings-notifier/ios/*.swift`, `android/**/*.kt`): no tienen test unitario propio. En Android requeriría Robolectric (dependencia nueva) para correr `AlertDialog`/`NotificationManager` fuera de un dispositivo; en iOS, un target de test XCTest separado. Ambos quedaron cubiertos manualmente vía la app de ejemplo del paquete (`yarn example ios` / `yarn example android`) en lugar de automatizados — se añadiría si el equipo necesita cobertura automatizada de esta capa.
- **`pod install` de la app de ejemplo de la librería** en este entorno: la ruta del proyecto contiene un espacio (`.../react native/examen-rn/...`) y el descargador de binarios prebuilt de React Native 0.85 falla al construir la URL de descarga. No es un error del paquete — ver detalle en el [README de la librería](libreria/rn-savings-notifier/README.md#pendientes). No afecta a `mobile/`, que sí enlaza y corre la librería real en iOS y Android.
- **`web/`** no tiene tests: excluido explícitamente del alcance evaluado por el examen (ver [`web/README.md`](web/README.md)).
- **Sin backend real**: los datos de las metas viven en memoria (semilla en `goalsSlice.ts`), como corresponde a un examen sin servidor — se documenta aquí para que quede explícito, no porque sea un olvido.
