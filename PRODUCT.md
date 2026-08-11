# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Stack

React Native 0.81 + React 19, creado con `npx @react-native-community/cli init` (Expo prohibido por el examen). TypeScript estricto, Redux Toolkit, react-native-webview. Monorepo `web/` + `libreria/` + `mobile/`. Librería nativa con react-native-builder-bob, TurboModule en Swift (iOS es la plataforma de demo; Android queda documentado como pendiente). Micro-app web: HTML/JS estático.

## Users

Evaluadores técnicos de la KATA "Senior React Native Mobile Engineer" (Grupo Bolívar, agosto 2026): revisan el repo público y asisten a una sustentación de 30 min. Usuario final simulado: persona que crea metas de ahorro ("Bolsillos"), abona dinero y ve su progreso.

## Product Purpose

Feature "Bolsillo de Ahorro Programado": listado nativo de metas de ahorro con progreso; detalle y formulario de abono renderizados como micro-app web dentro de un WebView; al confirmar un abono la app nativa actualiza Redux y refleja el nuevo acumulado sin recargar; al llegar al 100% de una meta, confirmación local vía módulo nativo. Éxito = core (HU1–HU3) sólido, probado y bien sustentado; HU4 deseable.

## Operating Context

Entrega en repositorio GitHub público con historial de commits incremental. Demo en vivo en simulador iOS. Sin backend real: datos en memoria / repositorio simulado. Comunicación web ↔ nativo exclusivamente por postMessage con contrato tipado.

## Capabilities and Constraints

- HU1 listado de metas (nombre, objetivo, acumulado, % progreso) en pantalla nativa con Redux.
- HU2 detalle + abono en WebView (micro-app web).
- HU3 abono confirmado en web actualiza Redux sin recargar.
- HU4 (deseable) notificación local nativa al completar meta: `notifyGoalCompleted(goalName: string)` vía TurboModule Swift.
- Arquitectura DDD ligero (domain/application/infrastructure/presentation) + patrones Adapter y Repository, nombrados en código y README.
- Tests obligatorios en `libreria/` y `mobile/` (Jest + RNTL); coverage del core documentado (meta ≥70% dominio).
- Uso de IA obligatorio y documentado: ≥1 skill, ≥1 agent, `docs/ia/USO_IA.md`.
- Mensajes del WebView = datos externos no confiables: validación estricta antes de tocar Redux.
- Sin secretos, tokens ni PII en el repo. Nada de `any` sin justificación.
- Plan completo de tareas y sustentación: `docs/lineamientos/PLAN_MAESTRO.md`.

## Brand Commitments

Autoridad visual total y binding: `DESIGN.md` (Nintendo.com 2001 — periwinkle chrome, carbon command layer, signal orange como color de acción, bevels duros, tipografía Arial uppercase). Aplica a toda la UI: pantallas nativas y micro-app web. Origen: `docs/lineamientos/DESIGN-nintendo-2001.md`.

## Evidence on Hand

- Requerimiento oficial: `docs/lineamientos/KATA - Desarrollador Mobile agosto 2026.pdf`.
- Guía de implementación propia: `docs/lineamientos/GUIA_IMPLEMENTACION_KATA_REACT_NATIVE.md`.
- Plan maestro consolidado: `docs/lineamientos/PLAN_MAESTRO.md`.
- No existen testimonios, métricas ni datos reales de usuarios; nada de eso debe fabricarse.

## Product Principles

- Core probado antes que features amplias: calidad sobre cantidad.
- El dominio no conoce React Native: reglas puras y testeables.
- Toda entrada externa (WebView) se valida antes de entrar al estado global.
- Cada decisión arquitectónica se sustenta con problema / alternativa descartada / trade-off.
- La librería nativa es un paquete real, consumido como dependencia, nunca código copiado.
