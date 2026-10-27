import React, { useEffect, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services';
import { AuthBanner, AuthLayout } from '@/components/ui/AuthLayout';
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { validateNewPassword, validateResetCode } from '@/services/utils/validation';
import { space } from '@/theme';

const RESEND_SECONDS = 30;

// each link under the button is its own 48dp row, centred, with a small gap between rows
const linkRow = { minHeight: 48, marginTop: space.xs, alignItems: 'center', justifyContent: 'center' } as const;

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ code?: string; password?: string; confirm?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  // the "send a new code" button unlocks after a short wait, so it can't be hammered
  useEffect(() => {
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!email) {
    return (
      <AuthLayout title="Reset Password" onBack={() => router.back()}>
        <AppText tone="muted" style={{ textAlign: 'center', marginBottom: space.lg }}>
          Start from "Forgot Password" so we know which account to reset.
        </AppText>
        <AppButton title="Back" onPress={() => router.replace('/(routes)/login/forgot-password')} />
      </AuthLayout>
    );
  }

  const submit = async () => {
    const next = {
      code: validateResetCode(code) ?? undefined,
      password: validateNewPassword(password) ?? undefined,
      confirm: password !== confirm ? 'Passwords do not match' : undefined,
    };
    setErrors(next);
    if (next.code || next.password || next.confirm) return;

    setLoading(true);
    try {
      await authService.resetPassword(email, code.trim(), password);
      Alert.alert('Password updated', 'Your password has been changed. Please sign in with the new one.', [
        { text: 'Sign in', onPress: () => router.dismissTo('/(routes)/login') },
      ]);
    } catch (e: any) {
      setErrors({ form: e.message || 'Could not reset the password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authService.forgotPassword(email);
      setCooldown(RESEND_SECONDS);
      setErrors({});
      Alert.alert('Code sent', 'A new code is on its way. The previous one no longer works.');
    } catch (e: any) {
      setErrors({ form: e.message || 'Could not send a new code. Please try again.' });
    }
  };

  return (
    <AuthLayout title="Reset Password" onBack={() => router.back()} subtitle={`If there is an account for ${email}, a 6-digit code is on its way. Check your spam folder.`}>
      {errors.form ? <AuthBanner message={errors.form} /> : null}
      <Field
        label="Code"
        placeholder="123456"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        style={{ textAlign: 'center', letterSpacing: space.sm }}
        error={errors.code}
      />
      <Field label="New password" placeholder="8+ characters, a number and a symbol" secure value={password} onChangeText={setPassword} error={errors.password} />
      <Field label="Confirm new password" placeholder="Repeat the password" secure value={confirm} onChangeText={setConfirm} error={errors.confirm} />

      <AppButton title="Reset password" onPress={submit} loading={loading} />

      <TouchableOpacity onPress={resend} disabled={cooldown > 0} accessibilityRole="button" style={linkRow}>
        <AppText weight="bold" tone={cooldown > 0 ? 'muted' : 'brand'}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" style={linkRow}>
        <AppText weight="semibold" tone="brand" style={{ textDecorationLine: 'underline' }}>
          Wrong email? Use a different one
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.dismissTo('/(routes)/login')} accessibilityRole="button" style={linkRow}>
        <AppText weight="bold" tone="brand">
          Back to sign in
        </AppText>
      </TouchableOpacity>
    </AuthLayout>
  );
}
