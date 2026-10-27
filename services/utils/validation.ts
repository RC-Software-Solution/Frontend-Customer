/**
 * Form validators. Each returns an error message, or null when the value is fine.
 * Limits mirror the server's (user-service) so the app rejects exactly what the server would.
 */

export const validateEmail = (value: string): string | null =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Enter a valid email address';

export const validateName = (value: string): string | null => {
  const v = value.trim();
  if (v.length < 2) return 'Enter your full name (at least 2 characters)';
  if (v.length > 100) return 'Name is too long (100 characters at most)';
  return null;
};

export const validatePhone = (value: string): string | null =>
  /^\+?\d{9,15}$/.test(value.trim()) ? null : 'Enter a valid phone number (9 to 15 digits)';

export const validateLocation = (value: string): string | null => {
  const v = value.trim();
  if (v.length < 3) return 'Enter your location (at least 3 characters)';
  if (v.length > 255) return 'Location is too long (255 characters at most)';
  return null;
};

export const PASSWORD_RULE = 'Password must be at least 8 characters, contain a number and a special character';

export const validateNewPassword = (value: string): string | null =>
  value.length >= 8 && /\d/.test(value) && /[^A-Za-z0-9]/.test(value) ? null : PASSWORD_RULE;

export const validateResetCode = (value: string): string | null =>
  /^\d{6}$/.test(value.trim()) ? null : 'Enter the 6-digit code from your email';
