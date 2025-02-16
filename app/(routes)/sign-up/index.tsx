import { View, Text } from 'react-native'
import React from 'react'
import SignUpScreen from "../../../screens/auth/signUp/signUp.screen";
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const signUp = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
       <SignUpScreen />
   </GestureHandlerRootView>
  )
}

export default signUp