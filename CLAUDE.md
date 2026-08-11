# examen-rn — Bolsillo de Ahorro Programado

Monorepo de la KATA: `web/` (micro-app en WebView, sin tests, no evaluada),
`libreria/rn-savings-notifier/` (TurboModule Swift + Kotlin), `mobile/`
(app React Native). Arquitectura, patrones, contrato `postMessage` y
comandos de test están en el [README raíz](README.md) — este archivo no los
repite.

## Flujo de trabajo

- **Issues**: GitHub Issues vía `gh` CLI. Una issue por historia de usuario.
- **Commits**: uno por issue, `feat(<capa>): <resumen> (#<issue>)`. Historial
  incremental, nunca un commit único.
- **Decisiones de arquitectura**: `docs/adr/`, formato del ADR 0001
  (contexto, problema, decisión, alternativa descartada).

## Reglas de código

- **Dominio puro**: `mobile/src/domain/` no importa React, React Native ni
  Redux. Lo verifica el agent `hexagonal-boundary-guardian`.
- **Casos de uso contra el puerto**: `mobile/src/application/` depende de
  `SavingsGoalRepository`, nunca de un adaptador concreto.
- **Sin `any`** en `mobile/src` ni `libreria/**/src`.
- **Contrato `postMessage`**: se edita solo en
  `mobile/src/infrastructure/webMessages.ts`; `web/index.html` replica los
  strings `type` a mano y el catálogo del README raíz debe seguirlos.
- **Tras editar `web/index.html`**: correr `npm run build:webapp` en
  `mobile/` para regenerar `src/infrastructure/webAppHtml.ts`.

## Skills y agents

Cada capa evaluada tiene los suyos, con su documento de uso de IA:

- `mobile/.claude/` — skill `add-application-use-case`, agent
  `hexagonal-boundary-guardian`, [`mobile/docs/ia/USO_IA.md`](mobile/docs/ia/USO_IA.md).
- `libreria/rn-savings-notifier/.claude/` — skill `add-native-capability`,
  agent `capability-contract-checker`,
  [`USO_IA.md`](libreria/rn-savings-notifier/docs/ia/USO_IA.md).

## Antes de cerrar un cambio

```sh
cd mobile && npm test -- --coverage && npx tsc --noEmit && npm run lint
cd libreria/rn-savings-notifier && yarn test --coverage && yarn typecheck && yarn lint
```

Los umbrales de cobertura rompen el build a propósito: `mobile/` exige
`domain/` ≥ 90% y `application/` ≥ 80%; la librería, ≥ 90% global.
