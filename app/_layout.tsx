import { View, Text } from 'react-native'
import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import TabsLayout from './(tabs)/_layout'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { SafeAreaProvider } from 'react-native-safe-area-context';

const  RootLayout = () => {
  const [isLoggedIn,setisLoggedIn] = useState(false);

  return (
    <SafeAreaProvider>
    <Provider store={store}>
    {isLoggedIn ? (
      <><TabsLayout />
      <Stack.Screen name="(routes)/cart/index" /></>
    ) : (
      <Stack screenOptions={{headerShown: false}}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(routes)/welcome-intro/index" />
          <Stack.Screen name="(routes)/login/index" />
          <Stack.Screen name="(routes)/sign-up/index" />
          <Stack.Screen name="(routes)/login/forgot-password" />
          <Stack.Screen name="(routes)/verifyAccount/index" />

      </Stack>

    )}
  </Provider>
  </SafeAreaProvider>

  );
}

export default  RootLayout