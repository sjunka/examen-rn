// Literals shared by more than one screen, or worth naming because the value
// alone doesn't say what it is. Purely visual scales (colour, type, spacing,
// radii) live in theme.ts instead — this file is not a second design system.

export const UI_FONT_SIZES = {
  heading: 13,
} as const;

export const UI_BORDERS = {
  width: 1,
} as const;

export const SESSION_ID_PREFIX = 'session-' as const;

export const DEMO_USER_NAME = 'Ahorrador Demo' as const;

export const UI_CONFIRMATION = {
  confirmationTitle: '¿Confirmar abono?' as const,
  goalNotFound: 'Esta meta ya no existe.' as const,
  backLabel: '‹ Volver' as const,
  backLabelA11y: 'Volver al listado de metas' as const,
} as const;
