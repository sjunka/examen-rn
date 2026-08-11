# Bolsillo de Ahorro Programado

KATA Senior React Native Mobile Engineer — Grupo Bolívar.

## Descripción

<!-- Feature, HUs cubiertas, qué hace la app. -->

## Estructura del repositorio

- `web/` — micro-app web (detalle de meta + abono), renderizada en WebView.
- `libreria/` — `rn-savings-notifier`, librería nativa (TurboModule Swift).
- `mobile/` — app React Native.

## Requisitos y versiones

- Node 25.9.0
- React Native 0.87.0, React 19.2.3
- Xcode 26.5, CocoaPods 1.16.2

## Instalación y ejecución

### iOS

```sh
cd mobile
npm install
bundle install && bundle exec pod install --project-directory=ios
npm run ios
```

### Android

<!-- Pendiente. -->

## Arquitectura

<!-- Diagrama/descripción de capas: presentation → application → domain ← infrastructure. -->

## Patrones de diseño

<!-- Adapter, Repository, Observer/Pub-Sub — dónde y por qué. -->

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

<!-- Comandos por paquete (libreria/, mobile/) y cifra real de coverage. -->

## Uso de IA

<!-- Skills y agents usados, link a docs/ia/USO_IA.md de cada paquete. -->

## Decisiones técnicas

- **Versión de React Native**: se intentó React Native 0.81 + React 19 (los puntos extra del examen) dentro de un timebox de 45 minutos. El proyecto generado por la CLI oficial compila con RN 0.81.6, pero falla con Xcode 26.5: la librería `fmt` 11.0.2 que empaqueta esa versión usa `consteval` de una forma que el Clang de Xcode 26.5 rechaza (`call to consteval function ... is not a constant expression`), un choque de toolchain conocido (fmtlib/fmt) y no un error del proyecto. Un parche puntual en el `Podfile` no lo resolvió. Se usó React Native 0.87.0 + React 19.2.3 (última estable), que sí compila y corre en el simulador de iOS con este toolchain.

<!-- Otros trade-offs relevantes para la sustentación. -->

## Pendientes y alcance no cubierto

<!-- Qué quedó fuera y cómo se haría (p. ej. Android de la librería). -->
