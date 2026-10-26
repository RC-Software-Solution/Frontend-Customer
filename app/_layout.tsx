import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/services';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';

// Keep the splash screen up until the saved session has been checked
SplashScreen.preventAutoHideAsync();

const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
  // A font failure must not trap the user on the splash screen: fall back to the system font.
  const ready = !loading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // Stack.Protected: routes in a guarded group are unreachable (and redirect to "index") when guard is false
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(routes)/cart/index" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(routes)/onboarding/index" />
        <Stack.Screen name="(routes)/welcome-intro/index" />
        <Stack.Screen name="(routes)/login/index" />
        <Stack.Screen name="(routes)/login/forgot-password" />
        <Stack.Screen name="(routes)/login/reset-password" />
        <Stack.Screen name="(routes)/sign-up/index" />
        <Stack.Screen name="(routes)/sign-up/signUpSecond" />
        <Stack.Screen name="(routes)/verifyAccount/index" />
      </Stack.Protected>
    </Stack>
  );
}

const RootLayout = () => (
  <SafeAreaProvider>
    <Provider store={store}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </Provider>
  </SafeAreaProvider>
);

export default RootLayout
