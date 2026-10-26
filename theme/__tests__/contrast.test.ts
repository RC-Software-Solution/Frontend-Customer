import { color, status } from '@/theme';

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const AA = 4.5;

const textPairs: [string, string, string][] = [
  ['onBrand on brand fill', color.onBrand, color.brand],
  ['brandStrong on surface', color.brandStrong, color.surface],
  ['brandStrong on page bg', color.brandStrong, color.bg],
  ['brandStrong on brandSoft', color.brandStrong, color.brandSoft],
  ['ink on surface', color.ink, color.surface],
  ['muted on surface', color.muted, color.surface],
  ['muted on page bg', color.muted, color.bg],
  ['muted on field', color.muted, color.field],
  ['subtle on surface', color.subtle, color.surface],
  ['subtle on page bg', color.subtle, color.bg],
  ['subtle on field (placeholders)', color.subtle, color.field],
  ['danger on surface', color.danger, color.surface],
  ['white label on danger fill', color.brandInk, color.danger],
];

test.each(textPairs)('%s meets WCAG AA', (_name, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
});

test.each(Object.entries(status))('status chip "%s" meets WCAG AA', (_name, { fg, bg }) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
});

test('the brand fill is never used as text colour (it cannot pass)', () => {
  expect(contrast(color.brand, color.surface)).toBeLessThan(AA);
});
