import React from 'react'
import PendigPayments from '@/screens/pendingPayments/pendingPayments.screen' 
import {GestureHandlerRootView} from 'react-native-gesture-handler'

const index = () => {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
  <PendigPayments />
    </GestureHandlerRootView>
  )
}

export default index