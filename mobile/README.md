# mobile

App React Native (0.87.0, React 19.2.3 — ver desvío de versión en el README raíz). Cuatro HUs implementadas: listado nativo de metas con progreso (HU1), detalle y formulario de abono vía WebView (HU2), abono confirmado actualiza el estado global sin recargar la vista (HU3), diálogo de confirmación nativo y notificación local al completar una meta (HU4), vía `rn-savings-notifier` (`libreria/`).

Arquitectura, patrones de diseño, catálogo de mensajes `postMessage`, comandos de test/coverage y decisiones técnicas están documentados en el [README raíz](../README.md) — este archivo no los repite.

## Estructura

- `src/domain/` — reglas puras (dinero, progreso, meta de ahorro). Sin imports de React Native ni Redux.
- `src/application/` — casos de uso (`GetGoals`, `ConfirmDeposit`) y el puerto `SavingsGoalRepository`.
- `src/infrastructure/` — adaptadores del puerto (`ReduxSavingsGoalRepository`, `InMemorySavingsGoalRepository`), el store de Redux y el contrato `postMessage` (`webMessages.ts`).
- `src/presentation/` — pantallas, hooks y componentes RN.

## Tests

```sh
npm test
npm test -- --coverage
```
