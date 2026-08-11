# Plan Maestro — KATA "Bolsillo de Ahorro Programado"

> Documento único de trabajo. Contiene todo lo necesario para construir y sustentar la KATA.
> Fuentes: `KATA - Desarrollador Mobile agosto 2026.pdf` (requerimiento oficial) y `GUIA_IMPLEMENTACION_KATA_REACT_NATIVE.md` (guía propia).
> Design system: `DESIGN-nintendo-2001.md` (tokens Nintendo 2001 — periwinkle chrome + carbon + signal orange).

---

## 1. Qué se entrega

Monorepo público en GitHub, 3 componentes, commits incrementales y descriptivos:

```
examen-rn/
├── web/        Micro-app HTML/JS dentro del WebView. Solo emite/recibe postMessage. SIN tests, NO evaluada.
├── libreria/   Librería RN con código nativo real (builder-bob). CON tests + skill/agent IA. Evaluada.
└── mobile/     App RN (CLI oficial, TypeScript, Redux). Consume libreria/ como dependencia. CON tests + skill/agent IA. Evaluada.
```

Sustentación: 30 min (15 demo + arquitectura, 5 uso de IA, 10 preguntas técnicas). Enviar link del repo antes.

## 2. Historias de usuario

| # | Historia | Prioridad |
|---|---|---|
| HU1 | Ver listado de metas (nombre, objetivo, acumulado, % progreso) en pantalla nativa | Core |
| HU2 | Abrir detalle de meta en WebView y abonar un valor | Core |
| HU3 | Al confirmar abono en la web, Redux se actualiza y el listado refleja el nuevo acumulado sin recargar | Core |
| HU4 | Confirmación local vía módulo nativo al llegar al 100% de la meta | Deseable |

Regla oficial: core sólido y probado > 4 HUs a medias.

## 3. Requisitos técnicos obligatorios

- **CLI oficial**: `npx @react-native-community/cli init`. **Expo prohibido.** RN 0.81+ con React 19 (puntos extra por esa versión exacta).
- **TypeScript** en dominio, contratos postMessage, slices Redux y lógica de negocio. Nada de `any` sin justificación.
- **Redux** (Toolkit) como única fuente de verdad global. Mensajes de la web despachan acciones.
- **WebView + postMessage bidireccional** con contrato tipado (uniones discriminadas).
- **Librería custom** con código nativo real (Kotlin y/o Swift), construida con `react-native-builder-bob`, consumida como dependencia (no código copiado). TurboModule preferido (+puntos) con justificación.
- **Tests** obligatorios en `libreria/` y `mobile/` (Jest + RN Testing Library). Coverage del core documentado (meta: ≥70% dominio; apuntar >90% domain, >80% application).
- **IA obligatoria** en `libreria/` y `mobile/`: ≥1 skill propia, ≥1 agent/subagente, `docs/ia/USO_IA.md`.
- Sin backend real: datos en memoria / repositorio simulado. Sin secretos ni PII en el repo.

## 4. Arquitectura (DDD ligero + capas)

```
Presentation → Application → Domain ← Infrastructure
```

```
mobile/src/
├── domain/           SavingsGoal, Money, Progress, calculateProgress — puro, sin RN
├── application/      GetGoals, MakeDeposit (casos de uso)
├── infrastructure/   InMemorySavingsGoalRepository, postMessageAdapter, messageContract, savingsNotifier
├── presentation/     GoalsScreen, GoalDetailScreen, components, hooks
└── store/            store, goalsSlice, selectors
```

Patrones nombrados (mínimo 1 exigido; usamos 3 y los nombramos en código y README):
- **Adapter**: postMessage crudo → evento de dominio validado. El resto de la app nunca ve el formato crudo.
- **Repository**: `SavingsGoalRepository` (interfaz) + `InMemorySavingsGoalRepository`. Dominio desacoplado de la persistencia.
- **Observer/Pub-Sub implícito**: canal WebView ↔ nativo vía postMessage.

Justificación (regla de oro sustentación): cada decisión = qué problema resuelve + alternativa descartada + trade-off aceptado.

## 5. Contrato postMessage (tipado, único punto de verdad)

```ts
export type NativeToWebMessage = {
  type: 'SESSION_INITIALIZED';
  payload: { sessionId: string; goalId: string; userInfo: { name: string } };
};

export type WebToNativeMessage = {
  type: 'DEPOSIT_CONFIRMED';
  payload: { goalId: string; amount: number };
};
```

| Dirección | Evento | Payload |
|---|---|---|
| Native → Web | `SESSION_INITIALIZED` | sessionId, goalId, userInfo |
| Web → Native | `DEPOSIT_CONFIRMED` | goalId, amount |

**Validación (mensajes del WebView = datos externos no confiables):** JSON válido → `type` permitido → `payload` presente → `goalId` string no vacío → `amount` número finito > 0 → meta existe → estado resultante válido. Mensaje inválido se rechaza antes de tocar Redux.

## 6. Flujo core (el que debe quedar impecable)

```
Web (abono) → postMessage → Adapter (parse + validate) → MakeDeposit (use case)
→ dispatch Redux → GoalsScreen muestra nuevo acumulado (sin recargar)
→ si progress >= 100% → libreria nativa notifyGoalCompleted(goalName)
```

Regla de dominio central:

```ts
calculateProgress(accumulated, target) // 0–100, cap en 100, target<=0 → 0
```

## 7. Librería nativa (`libreria/`)

- Paquete independiente: `package.json` propio, README propio, tests propios, skill/agent IA propio.
- Scaffold: `create-react-native-library` (builder-bob).
- API pública: `notifyGoalCompleted(goalName: string): void` (Opción C del examen — notificación local / Toast nativo). Mínimo exigido: input, botón o diálogo con puente real a nativo.
- **TurboModule** (preferido): frontera JS↔nativo explícita y tipada, alineado con New Architecture de RN 0.81. Trade-off: más complejidad inicial vs NativeModule legacy más simple. Justificar en sustentación.
- Nativo real en al menos una plataforma: **iOS Swift** (decisión confirmada — demo en simulador iOS; Android documentado como pendiente en README).
- `mobile/` la importa como dependencia (`file:../libreria` o npm pack) — nunca copiar código.

## 8. Micro-app web (`web/`)

HTML/JS estático simple. Recibe `SESSION_INITIALIZED`, muestra detalle de la meta, input de monto + botón "Abonar" que hace `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DEPOSIT_CONFIRMED', ... }))`. Sin Redux, sin tests, no evaluada — solo debe funcionar el ciclo postMessage.

UI de la web sigue el design system Nintendo 2001 (tokens en `DESIGN-nintendo-2001.md`): panel platinum, botón submit signal-orange, labels uppercase Arial Bold.

## 9. Diseño visual (tokens)

Fuente: `docs/lineamientos/DESIGN-nintendo-2001.md`. Claves para la app:

- **Superficies**: canvas `#7a8aba` (cuerpo), periwinkle `#8ba1d4` (paneles elevados), platinum `#dedede` (filas de lista), surface `#ffffff` (cards), carbon `#21242e` (nav/footer/botones oscuros).
- **Acción** (calor = acción, siempre): signal `#f68d1f` (submit/avanzar), amber `#ecab37` (utilidad/badges), nav-gold `#e48600` (nav).
- **Marca/error**: `#e60012`.
- **Texto**: ink `#21242e`, ink-soft `#3d4f97`, on-primary `#ffffff`.
- **Tipografía**: Arial; labels uppercase bold 11px tracking 0.5; display Arial Black outline+shadow; body 12px.
- **Forma**: bordes duros/chamfered por defecto (`0px`), redondeo solo en pills/radios/arrow-badges. Profundidad = bevel, no sombra difusa.
- **Espaciado**: base 8px; padding paneles 12–16px; layout denso.
- Mapping app: GoalsScreen = lista `news-row` sobre platinum con `section-label-bar`; progreso = barra bevel; GoalDetailScreen = WebView dentro de `form-panel`; botón abonar = `button-submit` signal.

## 10. Plan de tareas (orden de ejecución)

| Fase | Tarea | Entregable / test |
|---|---|---|
| 0 | Init monorepo, .gitignore, README esqueleto, primer commit | `chore: initialize monorepo` |
| 1 | Crear `mobile/` con CLI oficial (RN 0.81 + React 19), TS estricto | app corre en Android/iOS |
| 2 | Domain: `SavingsGoal`, `calculateProgress`, reglas | tests: 0/100→0, 50/100→50, 150/100→100, target 0→0 |
| 3 | Redux: store, `goalsSlice` (`depositConfirmed`), selectors, seed de metas en memoria | tests reducer + selectors |
| 4 | Repository: interfaz + InMemory | test save/findById |
| 5 | UI listado: GoalsScreen con tokens Nintendo (HU1) | test componente/hook |
| 6 | `web/`: HTML detalle + abono + postMessage | manual |
| 7 | Contrato + Adapter: `messageContract.ts`, `parseWebMessage`, guards | tests: JSON inválido, type desconocido, payload/amount/goalId inválidos |
| 8 | GoalDetailScreen + WebView: enviar SESSION_INITIALIZED, recibir DEPOSIT_CONFIRMED (HU2) | flujo manual |
| 9 | Use case `MakeDeposit` + wiring completo web→Redux→UI sin recargar (HU3) | tests: abono válido, meta inexistente, monto 0/negativo |
| 10 | `libreria/`: scaffold builder-bob, TurboModule Swift (notificación local/alert iOS), API tipada, tests, README | tests API + validación args + invocación nativa |
| 11 | Integrar librería en mobile: progress ≥100 → `notifyGoalCompleted` (HU4) | test del trigger |
| 12 | Coverage: correr, documentar cifra real en README | ≥70% domain mínimo |
| 13 | IA: skill propia (ej. redux-feature), agent (ej. test-reviewer), `docs/ia/USO_IA.md` en ambas capas | archivos en `.claude/` |
| 14 | Docs: README raíz (instalación, arquitectura, tabla postMessage, coverage, uso IA) + READMEs de web/libreria/mobile | checklist §12 |
| 15 | Ensayar sustentación con guion §13 | — |

Commits pequeños tipo: `feat: add savings goal domain`, `feat: add webview message contract`, `test: cover deposit use case`, `docs: add architecture documentation`.

## 11. Qué NO hacer

- Expo (prohibido). `any` sin validación. Lógica de negocio en pantallas ("God Screen"). Copiar código de la librería dentro de mobile. Un único commit final. Confiar en datos del WebView. Duplicar `calculateProgress` o el contrato. Subir secretos/tokens/PII. Tests que solo suben porcentaje.

## 12. Checklist de entrega

```
[ ] Repo GitHub público, historial incremental
[ ] web/ + libreria/ + mobile/
[ ] CLI oficial, sin Expo, RN 0.81+ / React 19
[ ] TypeScript, Redux, WebView, postMessage bidireccional tipado
[ ] DDD 4 capas + Adapter + Repository nombrados
[ ] Librería: package.json propio, nativo real, TurboModule justificado, API tipada, README, consumida por mobile
[ ] Tests: domain, use cases, parser, Redux, componente/hook, librería + coverage documentado
[ ] Skill + Agent + docs/ia/USO_IA.md en libreria/ y mobile/
[ ] README raíz completo (setup, arquitectura, catálogo postMessage, coverage, uso IA)
[ ] Sin secretos; validaciones y manejo de errores del WebView
[ ] Si algo falta: documentar en README qué falta y cómo se haría (también puntúa)
```

## 13. Sustentación (guion 30 min)

1. **0–3** Problema: metas de ahorro; lista nativa, detalle/abono en micro-app WebView.
2. **3–7** Arquitectura: capas DDD, por qué Adapter/Repository, Redux fuente de verdad.
3. **7–12** Demo: listado → meta → WebView → abono → postMessage → Redux → acumulado actualizado sin recargar → (100% → notificación nativa).
4. **12–15** Librería: JS → API → TurboModule → Kotlin/Swift; qué es realmente nativo; TurboModule vs NativeModule.
5. **15–20** Tests + coverage + skill + agent + USO_IA.md + qué rechacé de la IA.
6. **20–30** Preguntas. Respuestas clave preparadas: por qué Redux/WebView/postMessage/Adapter/Repository/DDD; qué pasa con mensaje inválido (se rechaza antes de Redux), monto negativo (use case rechaza), meta inexistente (error, Redux intacto); por qué librería separada (empaquetar y consumir nativo reutilizable); qué generó la IA (responder con precisión).
