// UI dimension and typography constants — single source of truth for hardcoded values.
// Never use magic numbers directly in components; always pull from here.

export const UI_FONT_SIZES = {
  heading: 13,
  body: 12,
  label: 11,
} as const;

export const UI_BORDERS = {
  width: 1,
} as const;

export const TYPOGRAPHY_DEFAULTS = {
  fontWeight: {
    bold: '700' as const,
    normal: '400' as const,
  },
  letterSpacing: {
    ui: 0.5,
  },
} as const;

export const PROGRESS = {
  max: 100,
} as const;

export const SESSION_ID_PREFIX = 'session-' as const;

export const DEMO_USER_NAME = 'Ahorrador Demo' as const;

export const UI_CONFIRMATION = {
  confirmationTitle: '¿Confirmar abono?' as const,
  goalsEmptyFallback: 'Esta meta ya no existe.' as const,
  backLabel: '‹ Volver' as const,
  backLabelA11y: 'Volver al listado de metas' as const,
} as const;
