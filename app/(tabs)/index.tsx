
import React from 'react'
import HomeScreen from "../../screens/homeTab/home/home.screen";
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
    <HomeScreen />
    </GestureHandlerRootView>
  )
}

export default index