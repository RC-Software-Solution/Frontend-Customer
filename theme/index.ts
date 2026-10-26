export const color = {
  brand: '#69bf70', // FILLS ONLY: 2.26:1 on white, never use as text
  brandInk: '#ffffff', // white text on dark fills (danger, tab pill)
  onBrand: '#0A0A0F', // text on the brand fill (8.73:1)
  brandStrong: '#2E7D32', // brand-coloured TEXT and icons on light backgrounds (5.13:1 on white)
  brandSoft: '#E8F5E9', // tinted brand background (icon discs, selected rows)
  ink: '#0A0A0F',
  muted: '#666666',
  subtle: '#6B6B6B', // was #999999 (2.85:1); now 4.68:1 even on the field grey
  bg: '#f5f5f5',
  surface: '#ffffff',
  field: '#f0f0f0',
  border: '#e6e6e6',
  danger: '#C0392B', // was #d9534f (3.96:1); now 5.44:1 on white
} as const;

// Order status chips: every pair clears 5.7:1.
export const status = {
  pending: { fg: '#8A5300', bg: '#FFF3D6' },
  preparing: { fg: '#0B5CAD', bg: '#E3F0FD' },
  delivering: { fg: '#5B2EA6', bg: '#EFE7FB' },
  delivered: { fg: '#1B5E20', bg: '#E4F4E6' },
  completed: { fg: '#1B5E20', bg: '#E4F4E6' },
  cancelled: { fg: '#4F4F4F', bg: '#EEEEEE' },
  delivery_failed: { fg: '#A12622', bg: '#FDE8E7' },
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
} as const;

export const theme = { color, space, radius, type, shadow, status };
export * from './layout';
