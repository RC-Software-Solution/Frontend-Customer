import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/services';
import { AuthBanner, AuthLayout } from '@/components/ui/AuthLayout';
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { validateEmail } from '@/services/utils/validation';
import { space } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  // the email problem belongs under the field; a failed request is not about the field, so it is a banner
  const [fieldError, setFieldError] = useState('');
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    const problem = validateEmail(email);
    if (problem) {
      setBanner('');
      setFieldError(problem);
      return;
    }
    const address = email.trim().toLowerCase();
    setFieldError('');
    setBanner('');
    setLoading(true);
    try {
      await authService.forgotPassword(address);
      // The server gives the same answer whether or not the email is registered
      router.push({ pathname: '/(routes)/login/reset-password', params: { email: address } });
    } catch (e: any) {
      setBanner(e.message || 'Could not send the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" onBack={() => router.back()} subtitle="Enter the email you signed up with. If it matches an account, we'll send a 6-digit code to it.">
      {banner ? <AuthBanner message={banner} /> : null}
      <Field
        label="Email"
        placeholder="example@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setFieldError('');
        }}
        error={fieldError || undefined}
      />
      <AppButton title="Send code" onPress={sendCode} loading={loading} />
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        style={{ minHeight: 48, marginTop: space.xs, alignItems: 'center', justifyContent: 'center' }}
      >
        <AppText weight="bold" tone="brand">
          Back to sign in
        </AppText>
      </TouchableOpacity>
    </AuthLayout>
  );
}
