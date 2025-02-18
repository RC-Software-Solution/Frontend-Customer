import { View, Text } from 'react-native'
import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import TabsLayout from './(tabs)/_layout'



const  RootLayout = () => {
  const [isLoggedIn,setisLoggedIn] = useState(false);
  
  return (
   
    <>
    {isLoggedIn ? (
      <TabsLayout />
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
    </> 
  )
}

export default  RootLayout