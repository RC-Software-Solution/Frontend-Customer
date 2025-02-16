import React from 'react'
import SignUpSecondScreen from "../../../screens/auth/signUpSecond/signUpSecond.screen";
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const signUpSecond = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
       <SignUpSecondScreen />
   </GestureHandlerRootView>
  )
}

export default signUpSecond