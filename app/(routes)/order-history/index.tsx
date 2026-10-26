import React from 'react'
import OrderHistoryScreen from '@/screens/orderHistory/orderHistory.screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const index = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OrderHistoryScreen />
    </GestureHandlerRootView>
  )
}

export default index
