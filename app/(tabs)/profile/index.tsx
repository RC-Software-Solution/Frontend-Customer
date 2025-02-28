import React from 'react'
import Profile from '@/screens/profile/profile.screen'
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
    <Profile />
    </GestureHandlerRootView>
  )
}

export default index