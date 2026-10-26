import { Alert, TouchableOpacity } from 'react-native'
import React, { useEffect } from 'react'
import { useState, } from 'react'
import { router } from 'expo-router'
import { useAuth } from '@/services';
import { getFcmToken } from "@/services/push/push.service";
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { AuthBanner, AuthFooterLink, AuthLayout } from '@/components/ui/AuthLayout';
import { space } from '@/theme';


export default function LoginScreen() {
    const { login, sessionExpired, dismissSessionExpired } = useAuth();

    useEffect(() => {
        if (!sessionExpired) return;
        Alert.alert('Session expired', 'For your security, please sign in again.');
        dismissSessionExpired();
    }, [sessionExpired, dismissSessionExpired]);
    const [buttonSpinner, setButtonSpinner] = useState(false);
    const [userInfo, setUserInfo] = useState({
        email: "",
        password: ""
    });

    // Credential and required problems sit under their field; account-status, staff, network
    // and server problems are not about one field, so they go in the banner above the form.
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [banner, setBanner] = useState<string | undefined>();

const handleSignIn = async () => {
  setErrors({});
  setBanner(undefined);

  if (userInfo.email === "" || userInfo.password === "") {
    setErrors({
      email: userInfo.email === "" ? 'Email is required' : undefined,
      password: userInfo.password === "" ? 'Password is required' : undefined,
    });
    return;
  }

  setButtonSpinner(true);
  try {
    // On success the route guard in app/_layout.tsx moves us into the app
    await login({
      email: userInfo.email,
      password: userInfo.password,
      fcm_token: (await getFcmToken()) ?? "",
    });

  } catch (error: any) {
    console.log("❌ Login error:", error);
    const message: string = error.message || "Login failed";
    if (error.status === 401 || error.message === 'Invalid credentials') {
      setErrors({ password: message });
    } else if (error.status === 400 && /email/i.test(message)) {
      setErrors({ email: message });
    } else if (error.status === 400 && /password/i.test(message)) {
      setErrors({ password: message });
    } else {
      setBanner(message);
    }
  } finally {
    setButtonSpinner(false);
  }
};


    return (
        <AuthLayout title="Sign In" subtitle="Welcome back. Enter your details to continue.">
            {banner ? <AuthBanner message={banner} /> : null}

            <Field
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="example@gmail.com"
                value={userInfo.email}
                onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                error={errors.email}
            />

            <Field
                label="Password"
                secure
                placeholder="Password"
                value={userInfo.password}
                onChangeText={(text) => setUserInfo({ ...userInfo, password: text })}
                error={errors.password}
            />

            <TouchableOpacity
                onPress={() => router.push("/(routes)/login/forgot-password")}
                accessibilityRole="button"
                style={{
                    alignSelf: 'flex-end',
                    minHeight: 48,
                    justifyContent: 'center',
                    paddingHorizontal: space.xs,
                    marginTop: -space.sm,
                }}
            >
                <AppText variant="caption" weight="bold" tone="brand">Forgot Password?</AppText>
            </TouchableOpacity>

            <AppButton
                title="Sign In"
                onPress={handleSignIn}
                loading={buttonSpinner}
                style={{ marginTop: space.sm + space.xs }}
            />
            {/* TODO(google-auth): "Sign in with Google" is not built yet. Needs a Google Cloud OAuth setup,
                POST /api/users/google in user-service, @react-native-google-signin/google-signin and a dev build
                (no Expo Go). Decide sign-in only vs sign-up too first. */}

            <AuthFooterLink
                prompt="Don't have an account?"
                action="Sign Up"
                onPress={() => router.push("/(routes)/sign-up")}
            />
        </AuthLayout>
    );
}
