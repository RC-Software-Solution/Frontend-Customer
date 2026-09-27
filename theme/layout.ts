// Declared height of the floating tab bar's own box. `tabBar.tsx` sets its
// `height` to this constant directly, so the two cannot drift; screens use
// it (via useScreenPadding) to reserve clearance above the bar.
//
// ponytail: a constant, not a measured value. The bar is fixed-layout, so a
// constant is honest and costs nothing to replace. If the bar ever becomes
// variable-height, publish the measured height through a React context and
// have useScreenPadding read that instead.
export const TAB_BAR_HEIGHT = 76;

// Gap between the bottom of the tab bar and the bottom safe-area inset.
export const TAB_BAR_GAP = 12;
