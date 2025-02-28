import React from 'react'
import CartScreen from '@/screens/cart/cart.screen' 
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
  <CartScreen/>
    </GestureHandlerRootView>
  )
}

export default index