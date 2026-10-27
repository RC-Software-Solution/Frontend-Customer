import { validateEmail, validateName, validatePhone, validateLocation, validateNewPassword, validateResetCode, PASSWORD_RULE } from '../utils/validation';

describe('validators (mirror the server limits)', () => {
  it.each([
    ['a@b.co', null],
    ['  a@b.co  ', null],
    ['no-at-sign', 'Enter a valid email address'],
    ['a@b', 'Enter a valid email address'],
    ['', 'Enter a valid email address'],
  ])('email %j', (value, expected) => expect(validateEmail(value)).toBe(expected));

  it('name: 2 to 100 characters after trimming', () => {
    expect(validateName('Al')).toBeNull();
    expect(validateName('  A  ')).toMatch(/at least 2/);
    expect(validateName('x'.repeat(100))).toBeNull();
    expect(validateName('x'.repeat(101))).toMatch(/too long/);
  });

  it.each([
    ['0771234567', null],
    ['+94771234567', null],
    ['123456789', null],
    ['12345678', 'Enter a valid phone number (9 to 15 digits)'],
    ['1234567890123456', 'Enter a valid phone number (9 to 15 digits)'],
    ['07712abc90', 'Enter a valid phone number (9 to 15 digits)'],
    ['077 123 4567', 'Enter a valid phone number (9 to 15 digits)'],
  ])('phone %j', (value, expected) => expect(validatePhone(value)).toBe(expected));

  it('location: 3 to 255 characters', () => {
    expect(validateLocation('abc')).toBeNull();
    expect(validateLocation('ab')).toMatch(/at least 3/);
    expect(validateLocation('x'.repeat(256))).toMatch(/too long/);
  });

  it.each([
    ['123456', null],
    [' 123456 ', null],
    ['12345', 'Enter the 6-digit code from your email'],
    ['1234567', 'Enter the 6-digit code from your email'],
    ['12a456', 'Enter the 6-digit code from your email'],
  ])('reset code %j', (value, expected) => expect(validateResetCode(value)).toBe(expected));
});

describe('validateNewPassword (same rule as signup and the server)', () => {
  it.each(['Brand-new-1', 'Passw0rd!', 'abc 12345'])('accepts %p', (pw) => {
    expect(validateNewPassword(pw)).toBeNull();
  });
  it.each(['short1!', 'no-digits-here', 'NoSymbol123', ''])('refuses %p', (pw) => {
    expect(validateNewPassword(pw)).toBe(PASSWORD_RULE);
  });
});
