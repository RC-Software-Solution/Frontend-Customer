import { View, Text } from 'react-native'
import React from 'react'
import LoginScreen from "../../../screens/auth/login/login.screen";
import {GestureHandlerRootView} from 'react-native-gesture-handler'
export default function Login() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <LoginScreen />
</GestureHandlerRootView>
  )
} 