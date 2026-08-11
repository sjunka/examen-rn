// Design tokens from /DESIGN.md (Nintendo.com 2001) — color, typography,
// shape and spacing scoped to what this screen needs.
export const colors = {
  canvas: '#7a8aba',
  chromeIndigo: '#3d4f97',
  platinum: '#dedede',
  surface: '#ffffff',
  carbon: '#21242e',
  signal: '#f68d1f',
  ink: '#21242e',
  inkSoft: '#3d4f97',
  onPrimary: '#ffffff',
};

export const typography = {
  uiLabel: {
    fontFamily: 'Arial',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: '400' as const,
  },
  link: {
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const rounded = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
};
