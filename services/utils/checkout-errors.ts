// What the customer is told when the server refuses an order.
// The backend sends no error code: the HTTP status plus the message is all there is
// (order.controller.js:28-66,172-179, authMiddleware.js:36), so the message decides unless the status is clear.
export type CheckoutErrorClass = 'unpaid' | 'noArea' | 'noSession' | 'closed' | 'stale' | 'offline' | 'disabled' | 'server' | 'other';

export type CheckoutRoute = '/(tabs)/pending-payments' | '/(tabs)/profile' | '/(tabs)';

export type CheckoutNotice = {
  alert: string; // the immediate Alert('Error', ...)
  banner?: string; // the sentence that stays on the Cart
  action?: { label: string; route: CheckoutRoute };
};

export function classifyCheckoutError(error: any): CheckoutErrorClass {
  if (error?.status === 0 && error?.code === 'NETWORK_ERROR') return 'offline';
  if (error?.status === 403) return 'disabled';
  if (error?.status >= 500) return 'server';
  const message = typeof error?.message === 'string' ? error.message : '';
  if (/unpaid order/i.test(message)) return 'unpaid';
  if (/customer area not found/i.test(message)) return 'noArea';
  if (/meal session not found/i.test(message)) return 'noSession';
  if (/outside the meal session time window/i.test(message)) return 'closed';
  if (/insufficient quantity|session items not found/i.test(message)) return 'stale';
  if (/server error/i.test(message)) return 'server';
  return 'other';
}

const UNPAID = 'You have 2 or more unpaid orders. Pay them to order again.';
const NO_AREA = "Your delivery area hasn't been assigned yet, so orders can't be placed. Please contact RC Caterings.";

export function checkoutNotice(cls: CheckoutErrorClass, message?: string): CheckoutNotice {
  const fallback = message || 'Failed to place order. Please try again.';
  switch (cls) {
    case 'unpaid':
      return { alert: UNPAID, banner: UNPAID, action: { label: 'View unpaid orders', route: '/(tabs)/pending-payments' } };
    case 'noArea':
      return { alert: NO_AREA, banner: NO_AREA, action: { label: 'Open Profile', route: '/(tabs)/profile' } };
    case 'noSession':
      return { alert: 'The selected meal session is not available for today. Please choose another time or try again later.' };
    case 'closed':
      return {
        alert: fallback,
        banner: 'Ordering for this meal has closed. Choose another meal from the menu.',
        action: { label: 'Back to menu', route: '/(tabs)' },
      };
    case 'stale':
      return { alert: fallback, banner: 'Some items in your basket are no longer available. Update your basket and try again.' };
    case 'offline':
      return { alert: 'No internet connection. Check it, then press CONFIRM ORDER again.' };
    case 'disabled':
      return { alert: 'Your account is disabled. Please contact RC Caterings.' };
    default: // server, other
      return { alert: fallback };
  }
}
