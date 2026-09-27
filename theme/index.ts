export const color = {
  brand: '#69bf70',
  brandInk: '#ffffff',
  ink: '#0A0A0F',
  muted: '#666666',
  subtle: '#999999',
  bg: '#f5f5f5',
  surface: '#ffffff',
  field: '#f0f0f0',
  border: '#e6e6e6',
  danger: '#d9534f',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const type = { h1: 28, h2: 20, body: 16, caption: 14, micro: 12 } as const;

export const shadow = {
  card: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bar: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
} as const;

export const theme = { color, space, radius, type, shadow };
export * from './layout';
