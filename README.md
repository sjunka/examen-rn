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

<!-- Catálogo WebToNativeMessage / NativeToWebMessage. -->

## Tests y coverage

<!-- Comandos por paquete (libreria/, mobile/) y cifra real de coverage. -->

## Uso de IA

<!-- Skills y agents usados, link a docs/ia/USO_IA.md de cada paquete. -->

## Decisiones técnicas

- **Versión de React Native**: se intentó React Native 0.81 + React 19 (los puntos extra del examen) dentro de un timebox de 45 minutos. El proyecto generado por la CLI oficial compila con RN 0.81.6, pero falla con Xcode 26.5: la librería `fmt` 11.0.2 que empaqueta esa versión usa `consteval` de una forma que el Clang de Xcode 26.5 rechaza (`call to consteval function ... is not a constant expression`), un choque de toolchain conocido (fmtlib/fmt) y no un error del proyecto. Un parche puntual en el `Podfile` no lo resolvió. Se usó React Native 0.87.0 + React 19.2.3 (última estable), que sí compila y corre en el simulador de iOS con este toolchain.

<!-- Otros trade-offs relevantes para la sustentación. -->

## Pendientes y alcance no cubierto

<!-- Qué quedó fuera y cómo se haría (p. ej. Android de la librería). -->
