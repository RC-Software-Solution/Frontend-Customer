import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { validateEmail } from '@/services/utils/validation';
import { space } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    const problem = validateEmail(email);
    if (problem) {
      setError(problem);
      return;
    }
    const address = email.trim().toLowerCase();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(address);
      // The server gives the same answer whether or not the email is registered
      router.push({ pathname: '/(routes)/login/reset-password', params: { email: address } });
    } catch (e: any) {
      setError(e.message || 'Could not send the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter the email you signed up with and we'll send you a 6-digit code.">
      <Field
        label="Email"
        placeholder="example@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError('');
        }}
        error={error || undefined}
      />
      <AppButton title="Send code" onPress={sendCode} loading={loading} />
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: space.lg, alignItems: 'center' }}>
        <AppText weight="bold" tone="brand">
          Back to sign in
        </AppText>
      </TouchableOpacity>
    </AuthLayout>
  );
}
