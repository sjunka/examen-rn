# Uso de IA — `mobile/`

Este documento cuenta lo que realmente pasó al construir la capa `mobile/`
con Claude Code, no un plan de cómo debía pasar. Cada afirmación apunta a un
artefacto verificable del propio repositorio (archivo, línea, commit, ADR)
— donde no hay ese rastro, se dice explícitamente.

## Proceso

El desarrollo siguió el flujo que declara `CLAUDE.md` en la raíz: issues de
GitHub por historia de usuario (`gh issue list`, ver `#4` HU1, `#5` HU2,
`#6` HU3, `#8` HU4 — `#7` es la librería, capa aparte),
etiquetadas `ready-for-agent`, cada una implementada con el skill
`/mattpocock-skills:implement` — construir en los seams con TDD, typecheck y
suite completa antes de cerrar, `/code-review` antes de commitear. Este
mismo documento y los skills/agents de este ticket (`#9`) se construyeron
con ese flujo; es la evidencia más directa disponible de cómo trabajan los
anteriores, porque es el mismo proceso corriendo ahora.

El historial de commits (`git log --oneline`) confirma la forma: un commit
por HU, mensaje `feat(mobile): HU<n> <resumen> (#issue)`, nunca un commit
único con todo el proyecto.

Lo que **no** está preservado son las transcripciones completas de las
sesiones HU1–HU4: no hay log de prompt-por-prompt de esas conversaciones.
Lo que sigue se reconstruye desde lo que el código y sus comentarios dejan
verificable, no desde memoria de la sesión.

## Qué generó la IA

- El andamiaje completo de la capa hexagonal (`domain/`, `application/`,
  `infrastructure/`, `presentation/`) y su cumplimiento: dominio puro sin
  imports de React/RN/Redux, casos de uso que dependen del puerto
  (`SavingsGoalRepository`) y no del adaptador concreto, hooks de
  presentación que instancian `ReduxSavingsGoalRepository` para producción
  e `InMemorySavingsGoalRepository` para tests.
- Las cuatro HUs (listado, detalle en WebView, abono, notificación de meta
  cumplida) y sus tests colocados (`*.test.ts(x)` junto a cada archivo).
- El contrato de mensajes `webMessages.ts` como uniones discriminadas con
  parser que nunca lanza.
- Los skills y agents de este ticket
  (`.claude/skills/add-application-use-case`,
  `.claude/agents/hexagonal-boundary-guardian`) y este documento.

## Qué se escribió o ajustó a mano

- `PRODUCT.md` y `DESIGN.md` son material importado del enunciado del
  examen (commit `docs: importar plan de producto y diseño desde
  grupoBolivar`), no generado por IA en este repositorio.
- La verificación real en simulador — que el listado no parpadee, que la
  notificación se vea con la app en primer plano, que el WebView no
  recargue al confirmar un abono — es un paso manual que ninguna sesión de
  IA puede certificar por sí sola; el ticket `#12` existe precisamente para
  dejar esa verificación explícita antes de la sustentación.
- La decisión de versión de React Native (intentar 0.81, encontrar el
  choque de toolchain con Xcode 26.5, fijar 0.87.0) fue una decisión de
  ingeniería tomada y documentada en el README raíz (sección "Decisiones
  técnicas"); el timebox de 45 minutos ahí declarado es una decisión de
  alcance, no algo que un modelo decide por su cuenta.

## Qué se rechazó o corrigió (casos concretos y verificables)

1. **`InMemorySavingsGoalRepository.save()` corrige un defecto del
   ejemplo de referencia.** El comentario en
   `mobile/src/infrastructure/inMemorySavingsGoalRepository.ts:4-5` es
   explícito: *"Unlike the flawed reference version, save() inserts when
   the id doesn't exist instead of a silent no-op"*, y el test dedicado en
   `inMemorySavingsGoalRepository.test.ts:30-32` lo verifica por nombre
   (*"instead of a silent no-op"*). La primera versión seguía el patrón del
   material de referencia del examen; se corrigió porque un `save()` que no
   inserta filas nuevas pierde datos en silencio — justo la clase de bug
   que un test de integración no atraparía si el fixture ya trae el id
   cargado.

2. **`WEB_APP_READY` no está en el ejemplo del examen — se agregó para
   cerrar una carrera real.** Documentado en el README raíz, sección
   "Contrato de mensajes": responder en `onLoadEnd` es una carrera porque
   el documento puede terminar de cargar antes de que el script registre
   su listener; el mensaje inicial se perdía de forma intermitente. Se
   descartó el enfoque "esperar `onLoadEnd` y mandar el mensaje" (el que
   trae el ejemplo) por un handshake explícito: la web anuncia que está
   lista, el nativo responde solo entonces.

3. **`useGoalSnapshot`/`useConfirmDeposit` descartan deliberadamente
   `useSelector`.** El comentario en `useGoalSnapshot.ts` señala por qué:
   `GoalDetailScreen` no debe re-renderizar cuando cambia el store, porque
   eso remonta el `WebView` y recarga la micro-app. `useSelector` habría
   sido la opción por defecto — se corrigió a una lectura no reactiva vía
   el puerto porque el defecto rompía justo la propiedad que HU2/HU3 piden
   ("el WebView no se recarga").

4. **`SESSION_INITIALIZED` extiende el payload del ejemplo del examen.**
   Documentado en el mismo README: el ejemplo entrega un id de sesión sin
   datos para pintar el detalle; se agregó `goal` (snapshot del dominio) al
   payload porque sin eso HU2 no es satisfacible. Extensión declarada, no
   silenciosa.

## Skills y agents usados en esta capa

- `/mattpocock-skills:implement` — implementación por ticket con TDD en los
  seams.
- `/code-review` — revisión antes de cada commit.
- `add-application-use-case` (`.claude/skills/`, específico de esta capa) —
  agrega un caso de uso siguiendo el patrón `GetGoals`/`ConfirmDeposit`.
- `hexagonal-boundary-guardian` (`.claude/agents/`, específico de esta
  capa) — revisa que los imports entre capas respeten la dirección de
  dependencia.
