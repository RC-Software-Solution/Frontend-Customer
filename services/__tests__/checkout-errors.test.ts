import { classifyCheckoutError, checkoutNotice } from '../utils/checkout-errors';

describe('classifyCheckoutError', () => {
  const rows: [string, any, string][] = [
    ['unpaid, with status', { status: 400, message: 'You have more than two unpaid order' }, 'unpaid'],
    ['unpaid, plain Error (the old test shape)', new Error('You have more than two unpaid order'), 'unpaid'],
    ['unpaid, case-insensitive', new Error('YOU HAVE MORE THAN TWO UNPAID ORDERS'), 'unpaid'],
    ['no area', { status: 400, message: 'Customer area not found' }, 'noArea'],
    ['no area, plain Error', new Error('customer area not found'), 'noArea'],
    ['no session', { status: 400, message: 'Meal session not found' }, 'noSession'],
    ['no session, plain Error', new Error('Meal session not found'), 'noSession'],
    ['closed', { status: 400, message: 'Order cannot be placed outside the meal session time window' }, 'closed'],
    ['closed, plain Error', new Error('Order cannot be placed outside the meal session time window'), 'closed'],
    ['insufficient quantity', { status: 400, message: 'Insufficient quantity for one or more items' }, 'stale'],
    ['items not found', { status: 404, message: 'One or more session items not found for this session' }, 'stale'],
    ['items not found, plain Error', new Error('One or more session items not found for this session'), 'stale'],
    ['offline', { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' }, 'offline'],
    ['offline, code alone decides', { status: 0, code: 'NETWORK_ERROR' }, 'offline'],
    ['disabled', { status: 403, message: 'Account disabled' }, 'disabled'],
    ['disabled, status alone decides', { status: 403 }, 'disabled'],
    ['server, 500 alone', { status: 500 }, 'server'],
    ['server, 500 with a message that matches nothing else', { status: 500, message: 'boom' }, 'server'],
    ['server, plain Error', new Error('Server error'), 'server'],
    ['server wins over a refusal message when the status is 500', { status: 500, message: 'Meal session not found' }, 'server'],
    ['other, unknown message', { status: 400, message: 'Something else' }, 'other'],
    ['other, UNKNOWN_ERROR', { status: 0, code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }, 'other'],
    ['other, undefined', undefined, 'other'],
    ['other, null', null, 'other'],
  ];
  it.each(rows)('%s', (_name, error, expected) => {
    expect(classifyCheckoutError(error)).toBe(expected);
  });
});

describe('checkoutNotice', () => {
  it('unpaid: the same sentence in the alert and the banner, and a button to the unpaid orders', () => {
    const n = checkoutNotice('unpaid', 'You have more than two unpaid order');
    expect(n.alert).toBe('You have 2 or more unpaid orders. Pay them to order again.');
    expect(n.banner).toBe(n.alert);
    expect(n.action).toEqual({ label: 'View unpaid orders', route: '/(tabs)/pending-payments' });
  });

  it('noArea: says the area is not assigned yet, and offers Profile', () => {
    const n = checkoutNotice('noArea', 'Customer area not found');
    expect(n.alert).toBe("Your delivery area hasn't been assigned yet, so orders can't be placed. Please contact RC Caterings.");
    expect(n.banner).toBe(n.alert);
    expect(n.action).toEqual({ label: 'Open Profile', route: '/(tabs)/profile' });
  });

  it('noSession: the old sentence, no banner', () => {
    const n = checkoutNotice('noSession', 'Meal session not found');
    expect(n.alert).toMatch(/not available for today/i);
    expect(n.banner).toBeUndefined();
    expect(n.action).toBeUndefined();
  });

  it('closed: the alert keeps the server wording, the banner says what to do', () => {
    const msg = 'Order cannot be placed outside the meal session time window';
    const n = checkoutNotice('closed', msg);
    expect(n.alert).toBe(msg);
    expect(n.banner).toBe('Ordering for this meal has closed. Choose another meal from the menu.');
    expect(n.action).toEqual({ label: 'Back to menu', route: '/(tabs)' });
  });

  it('stale: the alert keeps the server wording, the banner asks to update the basket, no action', () => {
    const n = checkoutNotice('stale', 'Insufficient quantity for one or more items');
    expect(n.alert).toBe('Insufficient quantity for one or more items');
    expect(n.banner).toBe('Some items in your basket are no longer available. Update your basket and try again.');
    expect(n.action).toBeUndefined();
  });

  it('offline and disabled: an alert only', () => {
    expect(checkoutNotice('offline', 'x')).toEqual({ alert: 'No internet connection. Check it, then press CONFIRM ORDER again.' });
    expect(checkoutNotice('disabled', 'Account disabled')).toEqual({ alert: 'Your account is disabled. Please contact RC Caterings.' });
  });

  it('server and other: the message, else the generic sentence', () => {
    expect(checkoutNotice('server', 'Server error')).toEqual({ alert: 'Server error' });
    expect(checkoutNotice('other', 'Odd')).toEqual({ alert: 'Odd' });
    expect(checkoutNotice('other', undefined)).toEqual({ alert: 'Failed to place order. Please try again.' });
    expect(checkoutNotice('other', '')).toEqual({ alert: 'Failed to place order. Please try again.' });
  });
});
