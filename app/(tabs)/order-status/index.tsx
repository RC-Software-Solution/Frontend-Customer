import React from 'react'
import OrderStatus from '@/screens/orderStatus/orderStatus.screen'
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
    <OrderStatus />
    </GestureHandlerRootView>
  )
}

export default index