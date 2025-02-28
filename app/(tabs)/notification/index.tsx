import React from 'react'
import Notification from '@/screens/notifications/notifications.screen'
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
      <Notification/>
    </GestureHandlerRootView>
  )
}

export default index